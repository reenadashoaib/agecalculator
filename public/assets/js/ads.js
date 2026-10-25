(function () {
  "use strict";

  var config = window.AD_CONFIG || {};
  var slots = config.slots || {};
  var isLive = /^ca-pub-\d{10,}$/.test(config.client || "");
  var SESSION_KEY = "ac-interstitial-shown";

  if (isLive) {
    var loader = document.createElement("script");
    loader.async = true;
    loader.crossOrigin = "anonymous";
    loader.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(config.client);
    document.head.appendChild(loader);
  }

  function placeholder(el, unit) {
    el.innerHTML = "";
    var box = document.createElement("div");
    box.className = "ad-placeholder";
    box.innerHTML = "<span>Advertisement</span><b></b>";
    box.querySelector("b").textContent = unit && unit.size ? unit.size : "";
    el.appendChild(box);
  }

  // Renders one slot. Hidden slots (for example the sidebar on mobile) are
  // skipped, because AdSense can't size an ad inside an element with no width.
  function fill(el) {
    if (el.dataset.filled) return;
    if (el.offsetWidth === 0) return;
    el.dataset.filled = "true";

    var unit = slots[el.dataset.ad];
    if (!isLive || !unit || !unit.slot) {
      placeholder(el, unit);
      return;
    }

    var ins = document.createElement("ins");
    ins.className = "adsbygoogle";
    ins.style.display = "block";
    ins.setAttribute("data-ad-client", config.client);
    ins.setAttribute("data-ad-slot", unit.slot);
    if (unit.format) ins.setAttribute("data-ad-format", unit.format);
    if (unit.layout) ins.setAttribute("data-ad-layout", unit.layout);
    if (unit.responsive) ins.setAttribute("data-full-width-responsive", "true");
    el.appendChild(ins);

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      // AdSense reports its own errors in the console; don't break the page.
    }
  }

  function fillVisible() {
    var els = document.querySelectorAll(".ad[data-ad]");
    for (var i = 0; i < els.length; i++) {
      if (!els[i].closest(".ad-corner, .ad-overlay")) fill(els[i]);
    }
  }

  // ---------- Bottom-right corner video ad ----------
  function setupCorner() {
    var settings = config.video || {};
    if (settings.enabled === false) return;
    try {
      if (sessionStorage.getItem("ac-corner-closed")) return;
    } catch (err) { /* storage blocked: show it anyway */ }

    var corner = document.createElement("aside");
    corner.className = "ad-corner";
    corner.hidden = true;
    corner.setAttribute("aria-label", "Advertisement");
    corner.innerHTML =
      '<div class="ad-corner__bar"><span>Advertisement</span>' +
      '<button class="ad-close" type="button" aria-label="Close video ad">Close</button></div>' +
      '<div class="ad" data-ad="video"></div>';
    document.body.appendChild(corner);

    corner.querySelector(".ad-close").addEventListener("click", function () {
      corner.remove();
      try { sessionStorage.setItem("ac-corner-closed", "1"); } catch (err) { /* ignore */ }
    });

    setTimeout(function () {
      corner.hidden = false;
      corner.classList.add("is-entering");
      var slot = corner.querySelector(".ad");
      if (settings.embedHtml) {
        slot.dataset.filled = "true";
        insertHtml(slot, settings.embedHtml);
      } else {
        fill(slot);
      }
    }, Math.max(0, settings.showAfterSeconds || 0) * 1000);
  }

  // Inserts third-party embed code and runs any <script> tags inside it.
  function insertHtml(target, html) {
    var tmp = document.createElement("div");
    tmp.innerHTML = html;
    Array.prototype.forEach.call(tmp.childNodes, function (node) {
      if (node.nodeName === "SCRIPT") {
        var s = document.createElement("script");
        Array.prototype.forEach.call(node.attributes, function (a) { s.setAttribute(a.name, a.value); });
        s.text = node.text;
        target.appendChild(s);
      } else {
        target.appendChild(node.cloneNode(true));
      }
    });
  }

  // ---------- Full-screen interstitial ----------
  var overlay = null;
  var pendingHref = null;

  function alreadyShown() {
    try { return sessionStorage.getItem(SESSION_KEY) === "1"; } catch (err) { return false; }
  }

  function buildOverlay() {
    overlay = document.createElement("dialog");
    overlay.className = "ad-overlay";
    overlay.setAttribute("aria-label", "Advertisement");
    overlay.innerHTML =
      '<div class="ad-overlay__bar"><span>Advertisement</span>' +
      '<button class="ad-close" type="button">Close ad</button></div>' +
      '<div class="ad-overlay__body"><div class="ad" data-ad="interstitial"></div></div>';
    document.body.appendChild(overlay);

    overlay.querySelector(".ad-close").addEventListener("click", function () { overlay.close(); });
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) overlay.close(); // click on the backdrop
    });
    overlay.addEventListener("close", function () {
      if (pendingHref) {
        var href = pendingHref;
        pendingHref = null;
        window.location.href = href;
      }
    });
  }

  function showInterstitial(href) {
    var settings = config.interstitial || {};
    if (settings.enabled === false || alreadyShown()) return false;
    if (typeof HTMLDialogElement !== "function") return false;
    if (!overlay) buildOverlay();
    if (overlay.open) return true;

    try { sessionStorage.setItem(SESSION_KEY, "1"); } catch (err) { /* ignore */ }
    pendingHref = href || null;
    overlay.showModal();
    fill(overlay.querySelector(".ad"));
    overlay.querySelector(".ad-close").focus();
    return true;
  }

  function setupInterstitial() {
    var settings = config.interstitial || {};
    if (settings.enabled === false) return;

    if (settings.afterSeconds > 0) {
      setTimeout(function () { showInterstitial(); }, settings.afterSeconds * 1000);
    }

    if (settings.afterCalculations > 0) {
      var count = 0;
      document.addEventListener("age:calculated", function () {
        count += 1;
        if (count === settings.afterCalculations) {
          // Let the visitor see their result change before the ad opens
          setTimeout(function () { showInterstitial(); }, 1200);
        }
      });
    }

    if (settings.onInternalLink) {
      document.addEventListener("click", function (e) {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        var link = e.target.closest("a[href]");
        if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
        if (link.closest(".ad-overlay, .ad-corner, .ad")) return;
        var url = new URL(link.href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname) return; // same page, e.g. #anchor links
        if (showInterstitial(url.href)) e.preventDefault();
      });
    }
  }

  // ---------- Start ----------
  function start() {
    fillVisible();
    setupCorner();
    setupInterstitial();

    // Fill slots that become visible later, e.g. the sidebar after rotating a tablet
    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(fillVisible, 250);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
