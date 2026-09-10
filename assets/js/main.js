/* =========================================================
   KandiDATA — site interactions
   ========================================================= */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var DATA = window.KD_DATA || { candidates: [], pages: [] };

  /* ---------- storage helpers (safe) ---------- */
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };

  /* ---------- toast ---------- */
  function toast(msg, icon) {
    var wrap = $(".toast-wrap");
    if (!wrap) { wrap = document.createElement("div"); wrap.className = "toast-wrap"; wrap.setAttribute("role", "status"); wrap.setAttribute("aria-live", "polite"); document.body.appendChild(wrap); }
    var t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = '<i class="fa-solid ' + (icon || "fa-circle-check") + '"></i><span>' + esc(msg) + "</span>";
    wrap.appendChild(t);
    setTimeout(function () { t.classList.add("is-leaving"); setTimeout(function () { t.remove(); }, 320); }, 2800);
  }
  window.kdToast = toast;

  /* ---------- auth ---------- */
  var user = store.get("kd_user", null);
  function applyAuth() {
    user = store.get("kd_user", null);
    $$("[data-auth='guest']").forEach(function (el) { el.classList.toggle("is-hidden", !!user); });
    $$("[data-auth='user']").forEach(function (el) { el.classList.toggle("is-hidden", !user); });
    $$("[data-user-name]").forEach(function (el) { el.textContent = user ? user.name : "John Guerrero"; });
    $$("[data-user-email]").forEach(function (el) { el.textContent = user ? user.email : ""; });
  }
  applyAuth();
  $$("[data-logout]").forEach(function (b) {
    b.addEventListener("click", function () {
      store.del("kd_user");
      applyAuth();
      closeDropdowns();
      closeMenu();
      toast("Matagumpay kang naka-logout.", "fa-right-from-bracket");
      if (document.body.dataset.page === "profile") setTimeout(function () { location.href = "index.html"; }, 700);
    });
  });

  /* ---------- header: scroll shadow ---------- */
  var header = $(".site-header");
  function onScroll() { if (header) header.classList.toggle("is-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- user dropdown ---------- */
  function closeDropdowns() { $$(".user-dropdown.is-open").forEach(function (d) { d.classList.remove("is-open"); var b = d.parentNode.querySelector("[aria-haspopup]"); if (b) b.setAttribute("aria-expanded", "false"); }); }
  $$(".user-menu > .avatar-btn").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var dd = btn.parentNode.querySelector(".user-dropdown");
      var open = !dd.classList.contains("is-open");
      closeDropdowns();
      dd.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
    });
  });
  document.addEventListener("click", function (e) { if (!e.target.closest(".user-menu")) closeDropdowns(); });

  /* ---------- mobile menu ---------- */
  var menu = $(".mobile-menu");
  var lastFocus = null;
  function openMenu() { if (!menu) return; lastFocus = document.activeElement; menu.classList.add("is-open"); menu.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; $(".menu-toggle") && $(".menu-toggle").setAttribute("aria-expanded", "true"); setTimeout(function () { var c = $(".mobile-menu__close"); c && c.focus(); }, 50); }
  function closeMenu() { if (!menu || !menu.classList.contains("is-open")) return; menu.classList.remove("is-open"); menu.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; $(".menu-toggle") && $(".menu-toggle").setAttribute("aria-expanded", "false"); lastFocus && lastFocus.focus && lastFocus.focus(); }
  $$(".menu-toggle").forEach(function (b) { b.addEventListener("click", openMenu); });
  $$(".mobile-menu__close, .mobile-menu__backdrop").forEach(function (b) { b.addEventListener("click", closeMenu); });
  $$(".mobile-menu a").forEach(function (a) { a.addEventListener("click", closeMenu); });
  window.addEventListener("resize", function () { if (window.innerWidth > 767) closeMenu(); });

  /* ---------- footer accordion (mobile) ---------- */
  $$(".footer-col h4 button").forEach(function (b) {
    b.addEventListener("click", function () {
      if (window.innerWidth > 767) return;
      var col = b.closest(".footer-col");
      var open = !col.classList.contains("is-open");
      col.classList.toggle("is-open", open);
      b.setAttribute("aria-expanded", String(open));
    });
  });

  /* ---------- reveal on scroll ---------- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    $$(".reveal").forEach(function (el) { io.observe(el); });
  } else { $$(".reveal").forEach(function (el) { el.classList.add("is-visible"); }); }

  /* =========================================================
     PAGE MODULES
     ========================================================= */
  var page = document.body.dataset.page;

  /* ---------- Auth forms ---------- */
  function fieldErr(inp, msg) { var fld = inp.closest(".auth-field"); fld.classList.toggle("has-error", !!msg); var fe = $(".field-error", fld); if (fe) fe.textContent = msg || ""; return !msg; }
  $$(".toggle-pass").forEach(function (b) { b.addEventListener("click", function () { var i = b.parentNode.querySelector("input"); var show = i.type === "password"; i.type = show ? "text" : "password"; b.innerHTML = '<i class="fa-regular ' + (show ? "fa-eye-slash" : "fa-eye") + '"></i>'; b.setAttribute("aria-label", show ? "Itago ang password" : "Ipakita ang password"); }); });
  var loginForm = $("#login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var em = $("#login-email"), pw = $("#login-pass");
      var a = fieldErr(em, em.value.trim() ? "" : "Ilagay ang iyong email o username.");
      var b = fieldErr(pw, pw.value.length >= 6 ? "" : "Ang password ay dapat may hindi bababa sa 6 na karakter.");
      if (!a || !b) return;
      var accounts = store.get("kd_accounts", {}), id = em.value.trim().toLowerCase(), acc = accounts[id];
      if (acc && acc.pass !== pw.value) { fieldErr(pw, "Mali ang password. Subukang muli."); return; }
      var name = acc ? acc.name : (id.indexOf("@") > -1 ? id.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); }) : id);
      store.set("kd_user", { name: name, email: acc ? acc.email : id, remember: $("#remember").checked });
      toast("Maligayang pagbabalik, " + name + "!", "fa-circle-check");
      setTimeout(function () { location.href = "profile.html"; }, 700);
    });
    $("#forgot-link").addEventListener("click", function (e) { e.preventDefault(); var em = $("#login-email"); if (!em.value.trim()) { fieldErr(em, "Ilagay muna ang iyong email upang makapagpadala ng reset link."); em.focus(); return; } fieldErr(em, ""); toast("Nagpadala kami ng password reset link sa " + em.value.trim() + ".", "fa-envelope"); });
  }
  var signupForm = $("#signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var n = $("#su-name"), em = $("#su-email"), p1 = $("#su-pass"), p2 = $("#su-pass2"), terms = $("#su-terms");
      var ok = fieldErr(n, n.value.trim().length >= 2 ? "" : "Ilagay ang iyong buong pangalan.");
      ok = fieldErr(em, em.value.trim() ? "" : "Ilagay ang iyong email o username.") && ok;
      ok = fieldErr(p1, p1.value.length >= 6 ? "" : "Gumamit ng hindi bababa sa 6 na karakter.") && ok;
      ok = fieldErr(p2, p2.value && p2.value === p1.value ? "" : "Hindi tugma ang mga password.") && ok;
      if (!terms.checked) { ok = false; toast("Kailangang sumang-ayon sa mga Kondisyon.", "fa-circle-exclamation"); }
      if (!ok) return;
      var accounts = store.get("kd_accounts", {}), id = em.value.trim().toLowerCase();
      accounts[id] = { name: n.value.trim(), email: em.value.trim(), pass: p1.value }; store.set("kd_accounts", accounts);
      store.set("kd_user", { name: n.value.trim(), email: em.value.trim() });
      toast("Matagumpay na nagawa ang iyong voter account!", "fa-circle-check");
      setTimeout(function () { location.href = "profile.html"; }, 800);
    });
  }
  $$("[data-social-auth]").forEach(function (b) {
    b.addEventListener("click", function () {
      var net = b.dataset.socialAuth;
      store.set("kd_user", { name: "John Guerrero", email: "john.guerrero@" + (net === "Google" ? "gmail.com" : "facebook.com"), via: net });
      toast("Naka-login gamit ang " + net + ".", "fa-circle-check");
      setTimeout(function () { location.href = "profile.html"; }, 700);
    });
  });
  $$("[data-terms]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      openModal('<h3 id="modal-title">Mga Kondisyon ng Paggamit</h3><p>Ang KandiDATA ay isang pang-impormasyong plataporma para sa Eleksyon 2028. Sa paggawa ng account, sumasang-ayon ka na:</p><p>1. Gagamitin mo ang plataporma para sa personal at hindi pangkomersyal na layunin.<br>2. Hindi ka magpapakalat ng maling impormasyon o mapanirang nilalaman.<br>3. Ang iyong data ay iniimbak lamang sa iyong device at hindi ibinabahagi sa ibang partido.<br>4. Ang opisyal na impormasyon ng halalan ay nagmumula sa COMELEC.</p><div class="modal-actions"><button type="button" class="btn btn-primary" data-accept-terms>Sumasang-ayon ako</button></div>');
    });
  });
  document.addEventListener("click", function (e) { if (e.target.closest("[data-accept-terms]")) { var t = $("#su-terms"); if (t) t.checked = true; closeModal(); } });
  $$(".auth-field input").forEach(function (i) { i.addEventListener("input", function () { var f = i.closest(".auth-field"); f.classList.remove("has-error"); }); });

})();
