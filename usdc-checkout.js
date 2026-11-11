// usdc-checkout.js — RAEN USDC-direct checkout widget (Bean, Nov 11 2026)
// Drop-in: <div id="usdc-checkout" data-product="contract-review" data-price="19"></div>
// Requires vendored qrcode.js (client-side QR, no external API).
(function () {
  var el = document.getElementById("usdc-checkout");
  if (!el) return;
  var productId = el.dataset.product || "";
  var price = Number(el.dataset.price || 0);
  var payTo = "0x9b8a27e03CEbA490953cDa8AB1291c0E13bAf72f";
  var usdc = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  var collector = "https://settlement-collector.fly.dev";
  var atomic = String(Math.round(price * 1e6));
  var uri = "ethereum:" + usdc + "@8453/transfer?address=" + payTo + "&uint256=" + atomic;

  var svg = "";
  try { var qr = qrcode(0, "M"); qr.addData(uri); qr.make(); svg = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); }
  catch (e) { svg = "<p style='color:#f59e0b'>QR unavailable — copy the address below.</p>"; }

  el.innerHTML =
    '<div style="background:#11161f;border:1px solid #2ea04366;border-radius:10px;padding:1.25rem;margin:1.5rem 0">' +
    '<h2 style="color:#2ea043;margin:0 0 .5rem;font-size:1.25rem">Pay with USDC — instant automatic delivery</h2>' +
    '<p style="margin:.25rem 0;color:#c9d1d9">Send exactly <b style="color:#e6edf3">$' + price + ' USDC</b> on <b style="color:#e6edf3">Base mainnet</b> to:</p>' +
    '<p style="margin:.5rem 0"><code id="usdc-payto" style="word-break:break-all">' + payTo + '</code> ' +
    '<button id="usdc-copy" style="cursor:pointer;background:#161b22;color:#22d3ee;border:1px solid #22d3ee;border-radius:6px;padding:.25rem .75rem">Copy</button></p>' +
    '<div id="usdc-qr" style="background:#fff;display:inline-block;padding:8px;border-radius:8px;margin:.5rem 0">' + svg + '</div>' +
    '<p style="margin:.5rem 0;color:#8b949e;font-size:.9rem">Scan with any Base wallet (Coinbase Wallet, MetaMask, Rabby). The QR encodes the exact amount and token — just confirm. Prefer paste? The address above is the only destination; amount must be exactly $' + price + ' USDC.</p>' +
    '<div style="margin-top:1rem;border-top:1px solid #1f2733;padding-top:1rem">' +
    '<p style="margin:.25rem 0;color:#c9d1d9"><b style="color:#e6edf3">Then register for automatic delivery</b> — paste your transaction hash and your email. Delivery is fully automatic: our watcher verifies your payment on-chain and emails the product. No human ever touches it.</p>' +
    '<input id="usdc-email" type="email" placeholder="you@example.com" style="background:#0a0e14;color:#e6edf3;border:1px solid #1f2733;border-radius:6px;padding:.5rem .75rem;margin:.35rem .5rem .35rem 0;min-width:240px">' +
    '<input id="usdc-tx" type="text" placeholder="0x… transaction hash (or your wallet address)" style="background:#0a0e14;color:#e6edf3;border:1px solid #1f2733;border-radius:6px;padding:.5rem .75rem;margin:.35rem 0;min-width:280px">' +
    '<br><button id="usdc-register" style="cursor:pointer;background:#238636;color:#fff;border:0;border-radius:6px;padding:.5rem 1.25rem;font-weight:600;margin-top:.5rem">Register for automatic delivery</button>' +
    '<p id="usdc-status" style="margin:.5rem 0;color:#8b949e;font-size:.9rem"></p></div>' +
    '<p style="margin:.5rem 0 0;color:#8b949e;font-size:.85rem">Paid but lost your tx hash? Register with just your wallet address — we match on-chain transfers from that address too, or claim later at settlement-collector.fly.dev/storefront/claims.</p></div>';

  var status = document.getElementById("usdc-status");
  document.getElementById("usdc-copy").onclick = function () {
    navigator.clipboard.writeText(payTo).then(function () { status.textContent = "Address copied."; status.style.color = "#2ea043"; });
  };
  document.getElementById("usdc-register").onclick = function () {
    var email = document.getElementById("usdc-email").value.trim();
    var tx = document.getElementById("usdc-tx").value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { status.textContent = "Enter a valid email."; status.style.color = "#f59e0b"; return; }
    if (!tx) { status.textContent = "Paste your transaction hash (or wallet address)."; status.style.color = "#f59e0b"; return; }
    status.textContent = "Registering…"; status.style.color = "#8b949e";
    fetch(collector + "/storefront/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tx_or_intent: tx, email: email }),
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j.ok) { status.textContent = "Error: " + (j.error || "registration failed"); status.style.color = "#f59e0b"; return; }
      if (j.delivered) { status.textContent = "Delivered! Check " + email + " for " + j.product + "."; status.style.color = "#2ea043"; return; }
      status.textContent = "Registered. Watching the chain for your payment — delivery fires automatically once your " + (tx.indexOf("0x") === 0 && tx.length === 66 ? "transaction" : "transfer") + " is seen on Base."; status.style.color = "#22d3ee";
      poll(tx, email, 24);
    }).catch(function (e) { status.textContent = "Network error — try again."; status.style.color = "#f59e0b"; });
  };
  function poll(tx, email, left) {
    if (left <= 0) { status.textContent = "Still registered — delivery fires automatically when the payment appears on-chain (watcher runs every minute)."; return; }
    fetch(collector + "/storefront/orders").then(function (r) { return r.json(); }).then(function (j) {
      var hit = (j.orders || []).find(function (o) {
        return o.matched && (o.tx === tx.toLowerCase() || (o.payer === tx.toLowerCase() && o.email === email));
      });
      if (hit && hit.delivered) { status.textContent = "Delivered! Check " + email + "."; status.style.color = "#2ea043"; return; }
      setTimeout(function () { poll(tx, email, left - 1); }, 5000);
    }).catch(function () { setTimeout(function () { poll(tx, email, left - 1); }, 5000); });
  }
})();
