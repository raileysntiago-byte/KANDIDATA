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

  /* ---------- file downloads (PDF) ---------- */
  $$("a[data-download]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var href = a.getAttribute("href"), name = a.getAttribute("download") || href.split("/").pop();
      if (!window.fetch || location.protocol === "file:") { toast("Dina-download ang " + name, "fa-file-arrow-down"); return; }
      e.preventDefault();
      fetch(href).then(function (r) { if (!r.ok) throw new Error(); return r.blob(); }).then(function (blob) {
        var url = URL.createObjectURL(blob), tmp = document.createElement("a");
        tmp.href = url; tmp.download = name; document.body.appendChild(tmp); tmp.click(); tmp.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
        toast("Na-download ang " + name, "fa-file-arrow-down");
      }).catch(function () { window.location.href = href; });
    });
  });

  /* =========================================================
     PAGE MODULES
     ========================================================= */
  var page = document.body.dataset.page;

  /* ---------- Calendar ---------- */
  if (page === "kalendaryo") {
    var cal = $(".calendar");
    var MONTHS = ["Enero", "Pebrero", "Marso", "Abril", "Mayo", "Hunyo", "Hulyo", "Agosto", "Setyembre", "Oktubre", "Nobyembre", "Disyembre"];
    var EVENTS = {
      "2028-1-11": { t: "Simula ng Panahon ng Kampanya", d: "Para sa mga posisyong nasyonal (Senador at Party-list)." },
      "2028-4-10": { t: "Ban Period", d: "Liquor ban at bawal ang pangangampanya sa bisperas ng halalan.", cls: "is-ban first", label: "Ban Period" },
      "2028-4-11": { t: "Ban Period", d: "Liquor ban at bawal ang pangangampanya sa bisperas ng halalan.", cls: "is-ban", label: "Ban Period" },
      "2028-4-12": { t: "Araw ng Halalan 2028", d: "Bumoto mula 6:00 AM hanggang 7:00 PM sa iyong itinalagang presinto.", cls: "is-election", label: "Halalan" },
      "2028-8-30": { t: "Huling Araw ng Rehistrasyon", d: "Ang huling pagkakataon upang makapag-rehistro sa pinakamalapit na opisina ng COMELEC." }
    };
    var state = { y: 2028, m: 4, collapsed: true };
    var grid = $(".calendar__grid", cal), title = $(".calendar__title", cal), sub = $(".calendar__sub", cal), detail = $(".cal-detail", cal), toggleBtn = $(".calendar__toggle", cal);
    function render() {
      title.textContent = MONTHS[state.m] + " " + state.y;
      sub.textContent = state.y === 2028 && state.m === 4 ? "Buwan ng Halalan" : "Kalendaryo ng Halalan";
      var first = new Date(state.y, state.m, 1).getDay();
      var days = new Date(state.y, state.m + 1, 0).getDate();
      var prevDays = new Date(state.y, state.m, 0).getDate();
      var cells = [], i;
      for (i = first - 1; i >= 0; i--) cells.push({ d: prevDays - i, out: true });
      for (i = 1; i <= days; i++) cells.push({ d: i });
      var n = 1; while (cells.length % 7) cells.push({ d: n++, out: true });
      var today = new Date();
      var html = "";
      cells.forEach(function (c, idx) {
        var row = Math.floor(idx / 7);
        var extra = row >= 3 ? " cal-row-extra" : "";
        if (c.out) { html += '<div class="cal-day is-out' + extra + '" aria-hidden="true">' + c.d + "</div>"; return; }
        var key = state.y + "-" + state.m + "-" + c.d, ev = EVENTS[key];
        var isToday = today.getFullYear() === state.y && today.getMonth() === state.m && today.getDate() === c.d;
        html += '<button type="button" class="cal-day' + (ev && ev.cls ? " " + ev.cls : "") + (isToday ? " is-today" : "") + extra + '" data-key="' + key + '" aria-label="' + c.d + " " + MONTHS[state.m] + (ev ? " — " + esc(ev.t) : "") + '">' + c.d + (ev && ev.label ? "<small>" + ev.label + "</small>" : "") + "</button>";
      });
      grid.innerHTML = html;
      cal.classList.toggle("is-collapsed", state.collapsed);
      toggleBtn.textContent = state.collapsed ? "Ipakita ang buong buwan" : "Itago ang ibang linggo";
      detail.classList.remove("is-open");
    }
    grid.addEventListener("click", function (e) {
      var b = e.target.closest("button.cal-day"); if (!b) return;
      $$(".cal-day.is-selected", grid).forEach(function (x) { x.classList.remove("is-selected"); });
      b.classList.add("is-selected");
      var ev = EVENTS[b.dataset.key], p = b.dataset.key.split("-");
      detail.innerHTML = "<strong>" + p[2] + " " + MONTHS[+p[1]] + " " + p[0] + "</strong> — " + (ev ? esc(ev.t) + ". " + esc(ev.d) : "Walang nakatakdang aktibidad ng halalan sa petsang ito.");
      detail.classList.add("is-open");
    });
    $(".cal-prev", cal).addEventListener("click", function () { state.m--; if (state.m < 0) { state.m = 11; state.y--; } render(); });
    $(".cal-next", cal).addEventListener("click", function () { state.m++; if (state.m > 11) { state.m = 0; state.y++; } render(); });
    toggleBtn.addEventListener("click", function () { state.collapsed = !state.collapsed; render(); });
    $(".calendar__more", cal).addEventListener("click", function () { state.collapsed = false; render(); });
    render();
    $$(".event-card[data-goto]").forEach(function (card) {
      card.addEventListener("click", function () { var p = card.dataset.goto.split("-"); state.y = +p[0]; state.m = +p[1]; state.collapsed = false; render(); var b = $('[data-key="' + card.dataset.goto + '"]', grid); b && b.click(); cal.scrollIntoView({ behavior: "smooth", block: "center" }); });
    });
  }

  /* ---------- Info page checklist (persist) ---------- */
  $$("[data-checklist]").forEach(function (list) {
    var key = "kd_check_" + list.dataset.checklist, saved = store.get(key, []);
    var boxes = $$("input[type=checkbox]", list), prog = list.parentNode.querySelector(".check-progress b");
    function upd() { var n = 0; boxes.forEach(function (b) { b.closest(".check-item").classList.toggle("is-checked", b.checked); if (b.checked) n++; }); if (prog) prog.textContent = n + "/" + boxes.length; }
    boxes.forEach(function (b, i) { b.checked = saved.indexOf(i) > -1; b.addEventListener("change", function () { var s = []; boxes.forEach(function (x, j) { if (x.checked) s.push(j); }); store.set(key, s); upd(); if (s.length === boxes.length) toast("Handa ka na para sa araw ng halalan!", "fa-circle-check"); }); });
    upd();
  });

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
