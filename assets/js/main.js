/* =========================================================
   KandiDATA — site interactions
   ========================================================= */
(function () {
  "use strict";
  var $ = function (s, r) {
    return (r || document).querySelector(s);
  };
  var $$ = function (s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  };
  var DATA = window.KD_DATA || { candidates: [], pages: [] };

  /* ---------- storage helpers (safe) ---------- */
  var store = {
    get: function (k, d) {
      try {
        var v = localStorage.getItem(k);
        return v === null ? d : JSON.parse(v);
      } catch (e) {
        return d;
      }
    },
    set: function (k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch (e) {}
    },
    del: function (k) {
      try {
        localStorage.removeItem(k);
      } catch (e) {}
    },
  };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  /* ---------- toast ---------- */
  function toast(msg, icon) {
    var wrap = $(".toast-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "toast-wrap";
      wrap.setAttribute("role", "status");
      wrap.setAttribute("aria-live", "polite");
      document.body.appendChild(wrap);
    }
    var t = document.createElement("div");
    t.className = "toast";
    t.innerHTML =
      '<i class="fa-solid ' + (icon || "fa-circle-check") + '"></i><span>' + esc(msg) + "</span>";
    wrap.appendChild(t);
    setTimeout(function () {
      t.classList.add("is-leaving");
      setTimeout(function () {
        t.remove();
      }, 320);
    }, 2800);
  }
  window.kdToast = toast;

  /* ---------- auth ---------- */
  var user = store.get("kd_user", null);
  function applyAuth() {
    user = store.get("kd_user", null);
    $$("[data-auth='guest']").forEach(function (el) {
      el.classList.toggle("is-hidden", !!user);
    });
    $$("[data-auth='user']").forEach(function (el) {
      el.classList.toggle("is-hidden", !user);
    });
    $$("[data-user-name]").forEach(function (el) {
      el.textContent = user ? user.name : "John Guerrero";
    });
    $$("[data-user-email]").forEach(function (el) {
      el.textContent = user ? user.email : "";
    });
  }
  applyAuth();
  $$("[data-logout]").forEach(function (b) {
    b.addEventListener("click", function () {
      store.del("kd_user");
      applyAuth();
      closeDropdowns();
      closeMenu();
      toast("Matagumpay kang naka-logout.", "fa-right-from-bracket");
      if (document.body.dataset.page === "profile")
        setTimeout(function () {
          location.href = "index.html";
        }, 700);
    });
  });

  /* ---------- header: scroll shadow ---------- */
  var header = $(".site-header");
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- user dropdown ---------- */
  function closeDropdowns() {
    $$(".user-dropdown.is-open").forEach(function (d) {
      d.classList.remove("is-open");
      var b = d.parentNode.querySelector("[aria-haspopup]");
      if (b) b.setAttribute("aria-expanded", "false");
    });
  }
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
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".user-menu")) closeDropdowns();
  });

  /* ---------- mobile menu ---------- */
  var menu = $(".mobile-menu");
  var lastFocus = null;
  function openMenu() {
    if (!menu) return;
    lastFocus = document.activeElement;
    menu.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    $(".menu-toggle") && $(".menu-toggle").setAttribute("aria-expanded", "true");
    setTimeout(function () {
      var c = $(".mobile-menu__close");
      c && c.focus();
    }, 50);
  }
  function closeMenu() {
    if (!menu || !menu.classList.contains("is-open")) return;
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    $(".menu-toggle") && $(".menu-toggle").setAttribute("aria-expanded", "false");
    lastFocus && lastFocus.focus && lastFocus.focus();
  }
  $$(".menu-toggle").forEach(function (b) {
    b.addEventListener("click", openMenu);
  });
  $$(".mobile-menu__close, .mobile-menu__backdrop").forEach(function (b) {
    b.addEventListener("click", closeMenu);
  });
  $$(".mobile-menu a").forEach(function (a) {
    a.addEventListener("click", closeMenu);
  });
  window.addEventListener("resize", function () {
    if (window.innerWidth > 1023) closeMenu();
  });

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

  /* ---------- search overlay ---------- */
  var overlay = $(".search-overlay");
  function renderResults(q) {
    var box = $(".search-results", overlay);
    q = (q || "").trim().toLowerCase();
    var cands = DATA.candidates.filter(function (c) {
      return !q || (c.name + " " + c.party + " " + c.position).toLowerCase().indexOf(q) > -1;
    });
    var pages = DATA.pages.filter(function (p) {
      return !q || (p.t + " " + p.d).toLowerCase().indexOf(q) > -1;
    });
    if (!q) (cands = cands.slice(0, 4)), (pages = pages.slice(0, 5));
    var html = "";
    cands.forEach(function (c) {
      html +=
        '<a href="kandidato-' +
        c.id +
        '.html"><img src="' +
        c.img +
        '" alt=""><div><strong>' +
        esc(c.name) +
        "</strong><span>" +
        esc(c.position) +
        " · " +
        esc(c.party) +
        "</span></div></a>";
    });
    pages.forEach(function (p) {
      html +=
        '<a href="' +
        p.u +
        '"><span class="sr-ico"><i class="fa-solid ' +
        p.i +
        '"></i></span><div><strong>' +
        esc(p.t) +
        "</strong><span>" +
        esc(p.d) +
        "</span></div></a>";
    });
    box.innerHTML =
      html ||
      '<div class="search-empty"><i class="fa-regular fa-face-frown"></i> Walang nahanap para sa “' +
        esc(q) +
        "”.</div>";
  }
  function openSearch() {
    if (!overlay) return;
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    var inp = $("input", overlay);
    inp.value = "";
    renderResults("");
    setTimeout(function () {
      inp.focus();
    }, 60);
  }
  function closeSearch() {
    if (!overlay) return;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
  }
  if (overlay) {
    var sInput = $("input", overlay);
    sInput.addEventListener("input", function () {
      renderResults(sInput.value);
    });
    sInput.addEventListener("keydown", function (e) {
      var links = $$(".search-results a", overlay);
      if (!links.length) return;
      var i = links.indexOf($(".search-results a.is-focus", overlay));
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (i > -1) links[i].classList.remove("is-focus");
        i = e.key === "ArrowDown" ? (i + 1) % links.length : (i - 1 + links.length) % links.length;
        links[i].classList.add("is-focus");
        links[i].scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter") {
        e.preventDefault();
        location.href = links[i > -1 ? i : 0].getAttribute("href");
      }
    });
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeSearch();
    });
  }
  $$("[data-open-search]").forEach(function (b) {
    b.addEventListener("click", openSearch);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeSearch();
      closeMenu();
      closeDropdowns();
      closeModal();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k" && overlay) {
      e.preventDefault();
      openSearch();
    }
  });

  /* ---------- modal ---------- */
  var modal = $(".modal");
  function openModal(html) {
    if (!modal) return;
    $(".modal__content", modal).innerHTML = html;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setTimeout(function () {
      $(".modal__close", modal).focus();
    }, 60);
  }
  function closeModal() {
    if (!modal || !modal.classList.contains("is-open")) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  if (modal) {
    $(".modal__close", modal).addEventListener("click", closeModal);
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeModal();
    });
  }
  window.kdModal = { open: openModal, close: closeModal };

  /* ---------- reveal on scroll ---------- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("is-visible");
            io.unobserve(en.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 },
    );
    $$(".reveal").forEach(function (el) {
      io.observe(el);
    });
  } else {
    $$(".reveal").forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ---------- file downloads (PDF) ---------- */
  $$("a[data-download]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var href = a.getAttribute("href"),
        name = a.getAttribute("download") || href.split("/").pop();
      if (!window.fetch || location.protocol === "file:") {
        toast("Dina-download ang " + name, "fa-file-arrow-down");
        return;
      }
      e.preventDefault();
      fetch(href)
        .then(function (r) {
          if (!r.ok) throw new Error();
          return r.blob();
        })
        .then(function (blob) {
          var url = URL.createObjectURL(blob),
            tmp = document.createElement("a");
          tmp.href = url;
          tmp.download = name;
          document.body.appendChild(tmp);
          tmp.click();
          tmp.remove();
          setTimeout(function () {
            URL.revokeObjectURL(url);
          }, 4000);
          toast("Na-download ang " + name, "fa-file-arrow-down");
        })
        .catch(function () {
          window.location.href = href;
        });
    });
  });

  /* ---------- generic accordion (FAQ) ---------- */
  $$(".faq-item").forEach(function (item) {
    var q = $(".faq-q", item);
    q.addEventListener("click", function () {
      var open = !item.classList.contains("is-open");
      var group = item.closest("[data-accordion-single]");
      if (group && open)
        $$(".faq-item.is-open", group).forEach(function (o) {
          if (o !== item) {
            o.classList.remove("is-open");
            $(".faq-q", o).setAttribute("aria-expanded", "false");
          }
        });
      item.classList.toggle("is-open", open);
      q.setAttribute("aria-expanded", String(open));
    });
  });

  /* ---------- saved candidates ---------- */
  var DEFAULT_SAVED = ["juan-de-la-cruz", "maria-clara-reyes", "elena-guerrero"];
  function getSaved() {
    return store.get("kd_saved", DEFAULT_SAVED);
  }
  function setSaved(v) {
    store.set("kd_saved", v);
  }
  $$("[data-save-candidate]").forEach(function (btn) {
    var id = btn.getAttribute("data-save-candidate");
    var sync = function () {
      var saved = getSaved().indexOf(id) > -1;
      btn.classList.toggle("is-saved", saved);
      btn.setAttribute("aria-pressed", String(saved));
      var ic = $(".save-card__top i", btn);
      if (ic) ic.className = saved ? "fa-solid fa-bookmark" : "fa-regular fa-bookmark";
      btn.setAttribute(
        "title",
        saved ? "Naka-save na — i-click upang alisin" : "I-save ang kandidatong ito",
      );
    };
    sync();
    btn.addEventListener("click", function () {
      var s = getSaved(),
        i = s.indexOf(id);
      if (i > -1) {
        s.splice(i, 1);
        toast("Inalis sa iyong mga naka-save na kandidato.", "fa-bookmark");
      } else {
        s.push(id);
        toast("Na-save! Makikita ito sa iyong Dashboard.", "fa-bookmark");
      }
      setSaved(s);
      sync();
    });
  });

  /* ---------- share links on profile ---------- */
  $$("[data-share]").forEach(function (a) {
    var url = encodeURIComponent(location.href),
      txt = encodeURIComponent(document.title);
    var net = a.getAttribute("data-share");
    if (net === "facebook") a.href = "https://www.facebook.com/sharer/sharer.php?u=" + url;
    if (net === "twitter") a.href = "https://twitter.com/intent/tweet?url=" + url + "&text=" + txt;
    if (net === "instagram")
      a.addEventListener("click", function (e) {
        if (navigator.clipboard) {
          e.preventDefault();
          navigator.clipboard.writeText(location.href).then(function () {
            toast("Nakopya ang link — i-paste sa iyong Instagram story o bio.", "fa-link");
            window.open("https://www.instagram.com/", "_blank", "noopener");
          });
        }
      });
  });

  /* =========================================================
     PAGE MODULES
     ========================================================= */
  var page = document.body.dataset.page;

  /* ---------- Calendar ---------- */
  if (page === "kalendaryo") {
    var cal = $(".calendar");
    var MONTHS = [
      "Enero",
      "Pebrero",
      "Marso",
      "Abril",
      "Mayo",
      "Hunyo",
      "Hulyo",
      "Agosto",
      "Setyembre",
      "Oktubre",
      "Nobyembre",
      "Disyembre",
    ];
    var EVENTS = {
      "2028-1-11": {
        t: "Simula ng Panahon ng Kampanya",
        d: "Para sa mga posisyong nasyonal (Senador at Party-list).",
      },
      "2028-4-10": {
        t: "Ban Period",
        d: "Liquor ban at bawal ang pangangampanya sa bisperas ng halalan.",
        cls: "is-ban first",
        label: "Ban Period",
      },
      "2028-4-11": {
        t: "Ban Period",
        d: "Liquor ban at bawal ang pangangampanya sa bisperas ng halalan.",
        cls: "is-ban",
        label: "Ban Period",
      },
      "2028-4-12": {
        t: "Araw ng Halalan 2028",
        d: "Bumoto mula 6:00 AM hanggang 7:00 PM sa iyong itinalagang presinto.",
        cls: "is-election",
        label: "Halalan",
      },
      "2028-8-30": {
        t: "Huling Araw ng Rehistrasyon",
        d: "Ang huling pagkakataon upang makapag-rehistro sa pinakamalapit na opisina ng COMELEC.",
      },
    };
    var state = { y: 2028, m: 4, collapsed: true };
    var grid = $(".calendar__grid", cal),
      title = $(".calendar__title", cal),
      sub = $(".calendar__sub", cal),
      detail = $(".cal-detail", cal),
      toggleBtn = $(".calendar__toggle", cal);
    function render() {
      title.textContent = MONTHS[state.m] + " " + state.y;
      sub.textContent =
        state.y === 2028 && state.m === 4 ? "Buwan ng Halalan" : "Kalendaryo ng Halalan";
      var first = new Date(state.y, state.m, 1).getDay();
      var days = new Date(state.y, state.m + 1, 0).getDate();
      var prevDays = new Date(state.y, state.m, 0).getDate();
      var cells = [],
        i;
      for (i = first - 1; i >= 0; i--) cells.push({ d: prevDays - i, out: true });
      for (i = 1; i <= days; i++) cells.push({ d: i });
      var n = 1;
      while (cells.length % 7) cells.push({ d: n++, out: true });
      var today = new Date();
      var html = "";
      cells.forEach(function (c, idx) {
        var row = Math.floor(idx / 7);
        var extra = row >= 3 ? " cal-row-extra" : "";
        if (c.out) {
          html += '<div class="cal-day is-out' + extra + '" aria-hidden="true">' + c.d + "</div>";
          return;
        }
        var key = state.y + "-" + state.m + "-" + c.d,
          ev = EVENTS[key];
        var isToday =
          today.getFullYear() === state.y &&
          today.getMonth() === state.m &&
          today.getDate() === c.d;
        html +=
          '<button type="button" class="cal-day' +
          (ev && ev.cls ? " " + ev.cls : "") +
          (isToday ? " is-today" : "") +
          extra +
          '" data-key="' +
          key +
          '" aria-label="' +
          c.d +
          " " +
          MONTHS[state.m] +
          (ev ? " — " + esc(ev.t) : "") +
          '">' +
          c.d +
          (ev && ev.label ? "<small>" + ev.label + "</small>" : "") +
          "</button>";
      });
      grid.innerHTML = html;
      cal.classList.toggle("is-collapsed", state.collapsed);
      toggleBtn.textContent = state.collapsed
        ? "Ipakita ang buong buwan"
        : "Itago ang ibang linggo";
      detail.classList.remove("is-open");
    }
    grid.addEventListener("click", function (e) {
      var b = e.target.closest("button.cal-day");
      if (!b) return;
      $$(".cal-day.is-selected", grid).forEach(function (x) {
        x.classList.remove("is-selected");
      });
      b.classList.add("is-selected");
      var ev = EVENTS[b.dataset.key],
        p = b.dataset.key.split("-");
      detail.innerHTML =
        "<strong>" +
        p[2] +
        " " +
        MONTHS[+p[1]] +
        " " +
        p[0] +
        "</strong> — " +
        (ev
          ? esc(ev.t) + ". " + esc(ev.d)
          : "Walang nakatakdang aktibidad ng halalan sa petsang ito.");
      detail.classList.add("is-open");
    });
    $(".cal-prev", cal).addEventListener("click", function () {
      state.m--;
      if (state.m < 0) {
        state.m = 11;
        state.y--;
      }
      render();
    });
    $(".cal-next", cal).addEventListener("click", function () {
      state.m++;
      if (state.m > 11) {
        state.m = 0;
        state.y++;
      }
      render();
    });
    toggleBtn.addEventListener("click", function () {
      state.collapsed = !state.collapsed;
      render();
    });
    $(".calendar__more", cal).addEventListener("click", function () {
      state.collapsed = false;
      render();
    });
    render();
    $$(".event-card[data-goto]").forEach(function (card) {
      card.addEventListener("click", function () {
        var p = card.dataset.goto.split("-");
        state.y = +p[0];
        state.m = +p[1];
        state.collapsed = false;
        render();
        var b = $('[data-key="' + card.dataset.goto + '"]', grid);
        b && b.click();
        cal.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  }

  /* ---------- Candidate list filter + pager ---------- */
  if (page === "kandidato") {
    var cards = $$(".cand-section .cand-card");
    var form = $(".filter-panel"),
      nameIn = $("#f-name"),
      posIn = $("#f-pos"),
      partyIn = $("#f-party");
    var pager = $(".pager"),
      PER = 8,
      cur = 1,
      matched = cards.slice();
    var gridEl = $(".cand-section .cand-grid"),
      empty = $(".cand-section .empty-state");
    function apply() {
      var q = nameIn.value.trim().toLowerCase(),
        pos = posIn.value,
        party = partyIn.value;
      matched = cards.filter(function (c) {
        return (
          (!q || c.dataset.name.toLowerCase().indexOf(q) > -1) &&
          (!pos || c.dataset.pos === pos) &&
          (!party || c.dataset.party === party)
        );
      });
      cur = 1;
      draw();
    }
    function draw() {
      var pages = Math.max(3, Math.ceil(matched.length / PER));
      cards.forEach(function (c) {
        c.classList.add("is-hidden");
      });
      matched.slice((cur - 1) * PER, cur * PER).forEach(function (c) {
        c.classList.remove("is-hidden");
      });
      var none = !matched.slice((cur - 1) * PER, cur * PER).length;
      empty.classList.toggle("is-hidden", !none);
      empty.querySelector("p").textContent = matched.length
        ? "Wala nang ibang kandidato sa pahinang ito. Bumalik sa pahina 1."
        : "Walang kandidatong tumugma sa iyong paghahanap. Subukang baguhin ang mga filter.";
      var nums = $$("[data-p]", pager);
      nums.forEach(function (b) {
        b.classList.toggle("is-current", +b.dataset.p === cur);
        b.setAttribute("aria-current", +b.dataset.p === cur ? "page" : "false");
      });
      $(".pg-prev", pager).disabled = cur === 1;
      $(".pg-next", pager).disabled = cur === pages;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      apply();
      gridEl.scrollIntoView({ behavior: "smooth", block: "start" });
      toast(matched.length + " kandidato ang nahanap.", "fa-magnifying-glass");
    });
    nameIn.addEventListener("input", apply);
    posIn.addEventListener("change", apply);
    partyIn.addEventListener("change", apply);
    pager.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b || b.disabled) return;
      if (b.dataset.p) cur = +b.dataset.p;
      else if (b.classList.contains("pg-prev")) cur--;
      else if (b.classList.contains("pg-next")) cur++;
      draw();
      $(".cand-section").scrollIntoView({ behavior: "smooth" });
    });
    var params = new URLSearchParams(location.search);
    if (params.get("q")) {
      nameIn.value = params.get("q");
    }
    apply();
  }

  /* ---------- Bills ---------- */
  if (page === "panukala") {
    var BILLS = window.KD_BILLS || [];
    var bState = { q: "", cat: "Lahat", sort: "new", page: 1, per: 6 };
    var bGrid = $(".bill-grid"),
      bCount = $(".bills-head .count"),
      bPager = $(".pager");
    var STATUS = {
      approved: ["st-approved", "Approved"],
      pending: ["st-pending", "Pending Review"],
      debate: ["st-debate", "Under Debate"],
      approvedg: ["st-approved-g", "Approved"],
      impl: ["st-impl", "In Implementation"],
    };
    function filtered() {
      var q = bState.q.toLowerCase();
      var list = BILLS.filter(function (b) {
        return (
          (bState.cat === "Lahat" || b.cat === bState.cat) &&
          (!q ||
            (b.title + " " + b.desc + " " + b.author + " " + b.cat).toLowerCase().indexOf(q) > -1)
        );
      });
      list.sort(function (a, b) {
        return bState.sort === "new"
          ? b.date > a.date
            ? 1
            : -1
          : bState.sort === "old"
            ? a.date > b.date
              ? 1
              : -1
            : a.title.localeCompare(b.title);
      });
      return list;
    }
    function card(b, i) {
      var st = STATUS[b.status];
      return (
        '<article class="bill-card reveal is-visible"><div class="bill-card__body"><div class="bill-card__top"><span class="bill-ico ' +
        b.ico +
        '">' +
        b.icon +
        '</span><span class="status ' +
        st[0] +
        '">' +
        st[1] +
        "</span></div>" +
        "<h3>" +
        esc(b.title) +
        "</h3><p>" +
        esc(b.desc) +
        '</p><div class="bill-prop"><span class="pin"><i class="fa-solid fa-location-dot"></i></span><div><small>Pangunahing Proponente</small><strong>' +
        esc(b.author) +
        "</strong></div></div></div>" +
        '<button type="button" class="bill-card__cta" data-bill="' +
        b.id +
        '">Suriin ang Detalye</button></article>'
      );
    }
    function drawBills() {
      var list = filtered(),
        pages = Math.max(1, Math.ceil(list.length / bState.per));
      if (bState.page > pages) bState.page = pages;
      var slice = list.slice((bState.page - 1) * bState.per, bState.page * bState.per);
      bGrid.innerHTML = slice.length
        ? slice.map(card).join("")
        : '<div class="empty-state" style="grid-column:1/-1"><i class="fa-regular fa-folder-open"></i><p>Walang panukalang tumugma sa iyong paghahanap.</p></div>';
      bCount.textContent = "Ipinapakita: " + list.length + " na panukala";
      var html =
        '<button type="button" class="pg-prev" aria-label="Nakaraang pahina"><i class="fa-solid fa-arrow-left"></i></button>';
      var nums = [];
      if (pages <= 5) {
        for (var i = 1; i <= pages; i++) nums.push(i);
      } else {
        nums = [1, 2, 3, "…", pages];
        if (bState.page > 3 && bState.page < pages) nums = [1, "…", bState.page, "…", pages];
      }
      nums.forEach(function (n) {
        html +=
          n === "…"
            ? '<span class="dots">…</span>'
            : '<button type="button" data-p="' +
              n +
              '" class="' +
              (n === bState.page ? "is-current" : "") +
              '"' +
              (n === bState.page ? ' aria-current="page"' : "") +
              ">" +
              n +
              "</button>";
      });
      html +=
        '<button type="button" class="pg-next" aria-label="Susunod na pahina"><i class="fa-solid fa-arrow-right"></i></button>';
      bPager.innerHTML = html;
      $(".pg-prev", bPager).disabled = bState.page === 1;
      $(".pg-next", bPager).disabled = bState.page === pages;
    }
    $(".bills-search").addEventListener("submit", function (e) {
      e.preventDefault();
      bState.q = $("#bill-q").value.trim();
      bState.page = 1;
      drawBills();
      $(".bills-section").scrollIntoView({ behavior: "smooth" });
    });
    $("#bill-q").addEventListener("input", function () {
      bState.q = this.value.trim();
      bState.page = 1;
      drawBills();
    });
    $$(".cat-chip").forEach(function (c) {
      c.addEventListener("click", function () {
        $$(".cat-chip").forEach(function (x) {
          x.classList.remove("is-active");
          x.setAttribute("aria-pressed", "false");
        });
        c.classList.add("is-active");
        c.setAttribute("aria-pressed", "true");
        bState.cat = c.dataset.cat;
        bState.page = 1;
        drawBills();
      });
    });
    $("#bill-sort").addEventListener("change", function () {
      bState.sort = this.value;
      drawBills();
    });
    bPager.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b || b.disabled) return;
      if (b.dataset.p) bState.page = +b.dataset.p;
      else if (b.classList.contains("pg-prev")) bState.page--;
      else bState.page++;
      drawBills();
      $(".bills-section").scrollIntoView({ behavior: "smooth" });
    });
    bGrid.addEventListener("click", function (e) {
      var b = e.target.closest("[data-bill]");
      if (!b) return;
      var bill = BILLS.filter(function (x) {
          return x.id === b.dataset.bill;
        })[0],
        st = STATUS[bill.status];
      openModal(
        '<span class="bill-ico ' +
          bill.ico +
          '">' +
          bill.icon +
          '</span><h3 id="modal-title" style="margin-top:18px">' +
          esc(bill.title) +
          '</h3><div class="meta"><span class="status ' +
          st[0] +
          '">' +
          st[1] +
          '</span><span class="chip">' +
          esc(bill.cat) +
          "</span></div><p>" +
          esc(bill.full || bill.desc) +
          "</p><dl><dt>Proponente</dt><dd>" +
          esc(bill.author) +
          "</dd><dt>Bill No.</dt><dd>" +
          esc(bill.no) +
          "</dd><dt>Isinampa</dt><dd>" +
          esc(bill.dateLabel) +
          "</dd><dt>Komite</dt><dd>" +
          esc(bill.committee) +
          '</dd></dl><div class="modal-actions"><button type="button" class="btn btn-primary" data-follow="' +
          bill.id +
          '"><i class="fa-regular fa-bell"></i> Sundan ang Panukala</button><button type="button" class="btn btn-soft" data-close-modal>Isara</button></div>',
      );
    });
    document.addEventListener("click", function (e) {
      if (e.target.closest("[data-close-modal]")) closeModal();
      var f = e.target.closest("[data-follow]");
      if (f) {
        var fl = store.get("kd_follow_bills", []);
        if (fl.indexOf(f.dataset.follow) < 0) fl.push(f.dataset.follow);
        store.set("kd_follow_bills", fl);
        f.innerHTML = '<i class="fa-solid fa-bell"></i> Sinusundan mo na';
        toast("Makakatanggap ka ng update tungkol sa panukalang ito.", "fa-bell");
      }
    });
    drawBills();
  }

  /* ---------- Info page checklist (persist) ---------- */
  $$("[data-checklist]").forEach(function (list) {
    var key = "kd_check_" + list.dataset.checklist,
      saved = store.get(key, []);
    var boxes = $$("input[type=checkbox]", list),
      prog = list.parentNode.querySelector(".check-progress b");
    function upd() {
      var n = 0;
      boxes.forEach(function (b) {
        b.closest(".check-item").classList.toggle("is-checked", b.checked);
        if (b.checked) n++;
      });
      if (prog) prog.textContent = n + "/" + boxes.length;
    }
    boxes.forEach(function (b, i) {
      b.checked = saved.indexOf(i) > -1;
      b.addEventListener("change", function () {
        var s = [];
        boxes.forEach(function (x, j) {
          if (x.checked) s.push(j);
        });
        store.set(key, s);
        upd();
        if (s.length === boxes.length)
          toast("Handa ka na para sa araw ng halalan!", "fa-circle-check");
      });
    });
    upd();
  });

  /* ---------- Polling place ---------- */
  if (page === "botohan") {
    var PLACES = [
      {
        name: "Makati High School",
        addr: "Gen. Luna St, Brgy. Poblacion, Makati City, Metro Manila",
        area: "Poblacion, Makati City",
        short: "Makati High",
        time: "5 min lakad",
        mode: "walk",
        x: 47,
        y: 42,
        precinct: "0123A",
      },
      {
        name: "Brgy. Valenzuela Hall",
        addr: "Ocampo St, Brgy. Valenzuela, Makati City",
        area: "Valenzuela, Makati City",
        short: "Valenzuela Hall",
        time: "12 min drive",
        mode: "car",
        x: 70,
        y: 52,
        precinct: "0145B",
      },
      {
        name: "Guadalupe Elementary School",
        addr: "J.P. Rizal Ext, Brgy. Guadalupe Nuevo, Makati City",
        area: "Guadalupe Nuevo, Makati City",
        short: "Guadalupe Elem.",
        time: "18 min drive",
        mode: "car",
        x: 30,
        y: 55,
        precinct: "0201C",
      },
    ];
    var EXTRA = [
      {
        name: "San Antonio National High School",
        addr: "Kalayaan Ave, Brgy. San Antonio, Makati City",
        area: "San Antonio, Makati City",
        short: "San Antonio HS",
        time: "22 min drive",
        mode: "car",
        x: 82,
        y: 40,
        precinct: "0233A",
      },
      {
        name: "Pio del Pilar Elementary School",
        addr: "Arnaiz Ave, Brgy. Pio del Pilar, Makati City",
        area: "Pio del Pilar, Makati City",
        short: "Pio del Pilar ES",
        time: "25 min drive",
        mode: "car",
        x: 20,
        y: 45,
        precinct: "0310D",
      },
    ];
    var list = $(".place-list"),
      active = 0,
      showAll = false,
      zoom = 1;
    var canvas = $(".map-canvas"),
      pin = $(".map-pin"),
      locName = $(".map-loc strong"),
      countPill = $(".poll-list-head .pill");
    function placeCard(p, i) {
      return (
        '<button type="button" class="place-card' +
        (i === active ? " is-active" : "") +
        '" data-i="' +
        i +
        '" aria-pressed="' +
        (i === active) +
        '">' +
        (i === 0 ? '<div class="near">Pinakamalapit</div>' : "") +
        '<i class="fa-solid fa-check tick" aria-hidden="true"></i><h3>' +
        esc(p.name) +
        "</h3><p>" +
        esc(p.addr) +
        '</p><div class="place-meta"><span><i class="fa-regular fa-clock"></i>6:00 AM - 7:00 PM</span><span class="' +
        (p.mode === "walk" ? "blue" : "") +
        '"><i class="fa-solid ' +
        (p.mode === "walk" ? "fa-person-walking" : "fa-car") +
        '"></i>' +
        p.time +
        "</span></div></button>"
      );
    }
    var current = PLACES.slice();
    function drawPlaces() {
      var shown = showAll ? current : current.slice(0, 3);
      list.innerHTML =
        shown.map(placeCard).join("") ||
        '<div class="empty-state"><i class="fa-solid fa-map-location-dot"></i><p>Walang nahanap na presinto. Subukan ang ibang address o precinct number.</p></div>';
      countPill.textContent = current.length + " Nahanap";
      $(".show-all").innerHTML = showAll
        ? 'Ipakita ang mas kaunti <i class="fa-solid fa-arrow-up"></i>'
        : 'Ipakita ang lahat <i class="fa-solid fa-arrow-right"></i>';
      var p = current[active] || current[0];
      if (p) {
        pin.style.left = p.x + "%";
        pin.style.top = p.y + "%";
        $(".lbl", pin).textContent = p.short;
        locName.textContent = p.area;
        pin.classList.remove("is-hidden");
      }
    }
    list.addEventListener("click", function (e) {
      var b = e.target.closest(".place-card");
      if (!b) return;
      active = +b.dataset.i;
      drawPlaces();
    });
    $(".show-all").addEventListener("click", function () {
      showAll = !showAll;
      if (showAll && current.length <= 3 && current === PLACES) current = PLACES.concat(EXTRA);
      else if (!showAll && current.length > 3 && current[3] === EXTRA[0]) current = PLACES.slice();
      drawPlaces();
    });
    $(".poll-search").addEventListener("submit", function (e) {
      e.preventDefault();
      var q = $("#poll-q").value.trim().toLowerCase();
      if (!q) {
        $("#poll-q").focus();
        toast("Ilagay muna ang iyong address o Precinct Number.", "fa-circle-exclamation");
        return;
      }
      var all = PLACES.concat(EXTRA);
      current = all.filter(function (p) {
        return (p.name + " " + p.addr + " " + p.precinct).toLowerCase().indexOf(q) > -1;
      });
      if (!current.length && /makati|poblacion|manila/.test(q)) current = PLACES.slice();
      active = 0;
      showAll = current.length > 3;
      drawPlaces();
      toast(
        current.length
          ? current.length + " lugar ng botohan ang nahanap."
          : "Walang nahanap na presinto.",
        current.length ? "fa-location-dot" : "fa-circle-exclamation",
      );
    });
    $(".btn-loc").addEventListener("click", function () {
      var btn = this;
      if (!navigator.geolocation) {
        toast("Hindi suportado ng iyong browser ang geolocation.", "fa-circle-exclamation");
        return;
      }
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Hinahanap ang lokasyon…';
      navigator.geolocation.getCurrentPosition(
        function () {
          btn.innerHTML = '<i class="fa-solid fa-location-dot"></i> Gamitin ang aking lokasyon';
          current = PLACES.slice();
          active = 0;
          showAll = false;
          drawPlaces();
          toast("Ipinakita ang mga presinto na pinakamalapit sa iyo.", "fa-location-crosshairs");
        },
        function () {
          btn.innerHTML = '<i class="fa-solid fa-location-dot"></i> Gamitin ang aking lokasyon';
          toast(
            "Hindi makuha ang iyong lokasyon. Pakibigay ang pahintulot o i-type ang address.",
            "fa-circle-exclamation",
          );
        },
        { timeout: 8000 },
      );
    });
    function setZoom(z) {
      zoom = Math.min(2.2, Math.max(1, z));
      canvas.style.transform = "scale(" + zoom + ")";
    }
    $(".zoom-in").addEventListener("click", function () {
      setZoom(zoom + 0.3);
    });
    $(".zoom-out").addEventListener("click", function () {
      setZoom(zoom - 0.3);
    });
    $(".zoom-loc").addEventListener("click", function () {
      setZoom(1.6);
      var p = current[active];
      if (p) canvas.style.transformOrigin = p.x + "% " + p.y + "%";
    });
    $$("[data-share-loc]").forEach(function (b) {
      b.addEventListener("click", function () {
        var p = current[active] || PLACES[0];
        var text =
          "Ang aking lugar ng botohan: " + p.name + " — " + p.addr + " (6:00 AM - 7:00 PM)";
        if (navigator.share)
          navigator
            .share({ title: "Lugar ng Botohan", text: text, url: location.href })
            .catch(function () {});
        else if (navigator.clipboard)
          navigator.clipboard.writeText(text + " " + location.href).then(function () {
            toast("Nakopya ang lokasyon sa clipboard.", "fa-link");
          });
      });
    });
    $$("[data-print]").forEach(function (b) {
      b.addEventListener("click", function () {
        window.print();
      });
    });
    drawPlaces();
  }

  /* ---------- Registration page ---------- */
  if (page === "rehistrasyon") {
    var tabs = $$(".tab-switch button"),
      panel = $(".where__panel");
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        tabs.forEach(function (x) {
          x.classList.toggle("is-active", x === t);
          x.setAttribute("aria-pressed", String(x === t));
        });
        var mode = t.dataset.view;
        panel.dataset.view = mode;
        if (mode === "list") {
          $(".office-col").scrollIntoView({ behavior: "smooth", block: "center" });
          $("#office-q").focus({ preventScroll: true });
        } else {
          $(".ph-map").scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    });
    var offices = $$(".office");
    offices.forEach(function (o) {
      o.addEventListener("click", function () {
        offices.forEach(function (x) {
          x.classList.toggle("is-active", x === o);
        });
        $(".ph-loc strong").textContent = o.dataset.city;
      });
    });
    $("#office-q").addEventListener("input", function () {
      var q = this.value.trim().toLowerCase(),
        any = false;
      offices.forEach(function (o) {
        var m = !q || o.textContent.toLowerCase().indexOf(q) > -1;
        o.classList.toggle("is-hidden", !m);
        if (m) any = true;
      });
      $(".office-empty").classList.toggle("is-hidden", any);
    });
  }

  /* ---------- Help center ---------- */
  if (page === "faq") {
    var items = $$(".help-sec .faq-item"),
      secs = $$(".help-sec"),
      nores = $(".no-results");
    function filterFaq(q) {
      q = q.trim().toLowerCase();
      var hits = 0;
      items.forEach(function (it) {
        var m = !q || it.textContent.toLowerCase().indexOf(q) > -1;
        it.classList.toggle("is-hidden", !m);
        if (m) hits++;
        if (q && m) {
          it.classList.add("is-open");
        }
      });
      secs.forEach(function (s) {
        var vis = $$(".faq-item:not(.is-hidden), .privacy-card", s).filter(function (x) {
          return !x.classList.contains("is-hidden");
        }).length;
        s.classList.toggle("is-hidden", !vis);
      });
      var pc = $(".privacy-card");
      if (pc) {
        var mm = !q || pc.textContent.toLowerCase().indexOf(q) > -1;
        pc.classList.toggle("is-hidden", !mm);
        if (mm) hits++;
        pc.closest(".help-sec").classList.toggle(
          "is-hidden",
          !mm && !$$(".faq-item:not(.is-hidden)", pc.closest(".help-sec")).length,
        );
      }
      nores.style.display = hits ? "none" : "block";
      return hits;
    }
    $(".help-search").addEventListener("submit", function (e) {
      e.preventDefault();
      var h = filterFaq($("#help-q").value);
      $(".help-layout").scrollIntoView({ behavior: "smooth" });
      toast(
        h ? h + " sagot ang nahanap." : "Walang nahanap — subukang magpadala ng tanong sa ibaba.",
        h ? "fa-magnifying-glass" : "fa-circle-question",
      );
    });
    $("#help-q").addEventListener("input", function () {
      if (!this.value.trim()) filterFaq("");
    });
    $$("[data-popular]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        $("#help-q").value = a.dataset.popular;
        $(".help-search").dispatchEvent(new Event("submit"));
      });
    });
    $$(".help-cat").forEach(function (c) {
      c.addEventListener("click", function () {
        $$(".help-cat").forEach(function (x) {
          x.classList.toggle("is-active", x === c);
        });
        $("#help-q").value = "";
        filterFaq("");
      });
    });
    var segBtns = $$(".seg button");
    segBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        segBtns.forEach(function (x) {
          x.classList.toggle("is-active", x === b);
          x.setAttribute("aria-selected", String(x === b));
        });
        $$(".ql-grid").forEach(function (g) {
          g.classList.toggle("is-hidden", g.dataset.tab !== b.dataset.tab);
        });
      });
    });
  }

  /* ---------- Contact form ---------- */
  $$("form[data-contact]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      $$("[data-req]", f).forEach(function (fld) {
        var inp = $("input, textarea", fld),
          v = inp.value.trim(),
          bad = !v || (inp.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
        fld.classList.toggle("has-error", bad);
        if (bad) ok = false;
      });
      if (!ok) {
        toast("Pakikumpleto ang mga kinakailangang field.", "fa-circle-exclamation");
        var fe = $(".has-error input, .has-error textarea", f);
        fe && fe.focus();
        return;
      }
      var msgs = store.get("kd_messages", []);
      msgs.push({
        name: f.elements.name.value,
        email: f.elements.email.value,
        msg: f.elements.message.value,
        at: new Date().toISOString(),
      });
      store.set("kd_messages", msgs);
      f.reset();
      toast("Salamat! Natanggap namin ang iyong mensahe.", "fa-paper-plane");
    });
    $$("input, textarea", f).forEach(function (i) {
      i.addEventListener("input", function () {
        i.closest("[data-req]") && i.closest("[data-req]").classList.remove("has-error");
      });
    });
  });

  /* ---------- Auth forms ---------- */
  function fieldErr(inp, msg) {
    var fld = inp.closest(".auth-field");
    fld.classList.toggle("has-error", !!msg);
    var fe = $(".field-error", fld);
    if (fe) fe.textContent = msg || "";
    return !msg;
  }
  $$(".toggle-pass").forEach(function (b) {
    b.addEventListener("click", function () {
      var i = b.parentNode.querySelector("input");
      var show = i.type === "password";
      i.type = show ? "text" : "password";
      b.innerHTML = '<i class="fa-regular ' + (show ? "fa-eye-slash" : "fa-eye") + '"></i>';
      b.setAttribute("aria-label", show ? "Itago ang password" : "Ipakita ang password");
    });
  });
  var loginForm = $("#login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var em = $("#login-email"),
        pw = $("#login-pass");
      var a = fieldErr(em, em.value.trim() ? "" : "Ilagay ang iyong email o username.");
      var b = fieldErr(
        pw,
        pw.value.length >= 6 ? "" : "Ang password ay dapat may hindi bababa sa 6 na karakter.",
      );
      if (!a || !b) return;
      var accounts = store.get("kd_accounts", {}),
        id = em.value.trim().toLowerCase(),
        acc = accounts[id];
      if (acc && acc.pass !== pw.value) {
        fieldErr(pw, "Mali ang password. Subukang muli.");
        return;
      }
      var name = acc
        ? acc.name
        : id.indexOf("@") > -1
          ? id
              .split("@")[0]
              .replace(/[._]/g, " ")
              .replace(/\b\w/g, function (c) {
                return c.toUpperCase();
              })
          : id;
      store.set("kd_user", {
        name: name,
        email: acc ? acc.email : id,
        remember: $("#remember").checked,
      });
      toast("Maligayang pagbabalik, " + name + "!", "fa-circle-check");
      setTimeout(function () {
        location.href = "profile.html";
      }, 700);
    });
    $("#forgot-link").addEventListener("click", function (e) {
      e.preventDefault();
      var em = $("#login-email");
      if (!em.value.trim()) {
        fieldErr(em, "Ilagay muna ang iyong email upang makapagpadala ng reset link.");
        em.focus();
        return;
      }
      fieldErr(em, "");
      toast("Nagpadala kami ng password reset link sa " + em.value.trim() + ".", "fa-envelope");
    });
  }
  var signupForm = $("#signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var n = $("#su-name"),
        em = $("#su-email"),
        p1 = $("#su-pass"),
        p2 = $("#su-pass2"),
        terms = $("#su-terms");
      var ok = fieldErr(n, n.value.trim().length >= 2 ? "" : "Ilagay ang iyong buong pangalan.");
      ok = fieldErr(em, em.value.trim() ? "" : "Ilagay ang iyong email o username.") && ok;
      ok =
        fieldErr(p1, p1.value.length >= 6 ? "" : "Gumamit ng hindi bababa sa 6 na karakter.") && ok;
      ok =
        fieldErr(p2, p2.value && p2.value === p1.value ? "" : "Hindi tugma ang mga password.") &&
        ok;
      if (!terms.checked) {
        ok = false;
        toast("Kailangang sumang-ayon sa mga Kondisyon.", "fa-circle-exclamation");
      }
      if (!ok) return;
      var accounts = store.get("kd_accounts", {}),
        id = em.value.trim().toLowerCase();
      accounts[id] = { name: n.value.trim(), email: em.value.trim(), pass: p1.value };
      store.set("kd_accounts", accounts);
      store.set("kd_user", { name: n.value.trim(), email: em.value.trim() });
      toast("Matagumpay na nagawa ang iyong voter account!", "fa-circle-check");
      setTimeout(function () {
        location.href = "profile.html";
      }, 800);
    });
  }
  $$("[data-social-auth]").forEach(function (b) {
    b.addEventListener("click", function () {
      var net = b.dataset.socialAuth;
      store.set("kd_user", {
        name: "John Guerrero",
        email: "john.guerrero@" + (net === "Google" ? "gmail.com" : "facebook.com"),
        via: net,
      });
      toast("Naka-login gamit ang " + net + ".", "fa-circle-check");
      setTimeout(function () {
        location.href = "profile.html";
      }, 700);
    });
  });
  $$("[data-terms]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      openModal(
        '<h3 id="modal-title">Mga Kondisyon ng Paggamit</h3><p>Ang KandiDATA ay isang pang-impormasyong plataporma para sa Eleksyon 2028. Sa paggawa ng account, sumasang-ayon ka na:</p><p>1. Gagamitin mo ang plataporma para sa personal at hindi pangkomersyal na layunin.<br>2. Hindi ka magpapakalat ng maling impormasyon o mapanirang nilalaman.<br>3. Ang iyong data ay iniimbak lamang sa iyong device at hindi ibinabahagi sa ibang partido.<br>4. Ang opisyal na impormasyon ng halalan ay nagmumula sa COMELEC.</p><div class="modal-actions"><button type="button" class="btn btn-primary" data-accept-terms>Sumasang-ayon ako</button></div>',
      );
    });
  });
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-accept-terms]")) {
      var t = $("#su-terms");
      if (t) t.checked = true;
      closeModal();
    }
  });
  $$(".auth-field input").forEach(function (i) {
    i.addEventListener("input", function () {
      var f = i.closest(".auth-field");
      f.classList.remove("has-error");
    });
  });

  /* ---------- Voter dashboard ---------- */
  if (page === "profile") {
    var savedGrid = $(".dash-saved .cand-grid"),
      countEl = $("[data-saved-count]");
    var ROLE = {
      "juan-de-la-cruz": "Presidente",
      "maria-clara-reyes": "Senador",
      "elena-guerrero": "Bise Presidente",
    };
    function drawSaved() {
      var ids = getSaved();
      var list = ids
        .map(function (id) {
          return DATA.candidates.filter(function (c) {
            return c.id === id;
          })[0];
        })
        .filter(Boolean);
      savedGrid.innerHTML =
        list
          .map(function (c) {
            var role = ROLE[c.id] || c.tag;
            return (
              '<article class="cand-card"><button type="button" class="cand-card__remove" data-remove="' +
              c.id +
              '" aria-label="Alisin si ' +
              esc(c.name) +
              '"><i class="fa-solid fa-xmark"></i></button><div class="cand-card__img"><span class="tag-role">' +
              esc(role) +
              '</span><img src="' +
              c.img +
              '" alt="' +
              esc(c.name) +
              '"></div><div class="cand-card__body"><span class="cand-card__role-m">' +
              esc(role) +
              '</span><h3 class="cand-card__name">' +
              esc(c.name) +
              '</h3><p class="cand-card__party">' +
              esc(c.party) +
              '</p><a class="cand-card__cta" href="kandidato-' +
              c.id +
              '.html">View Profile <i class="fa-solid fa-arrow-right"></i></a></div></article>'
            );
          })
          .join("") ||
        '<div class="empty-state"><i class="fa-regular fa-bookmark"></i><p>Wala ka pang naka-save na kandidato. <a class="link-arrow" href="mga-kandidato.html">Tingnan ang mga kandidato</a></p></div>';
      if (countEl) countEl.textContent = list.length + " / 12 Slot";
    }
    savedGrid.addEventListener("click", function (e) {
      var r = e.target.closest("[data-remove]");
      if (!r) return;
      setSaved(
        getSaved().filter(function (x) {
          return x !== r.dataset.remove;
        }),
      );
      drawSaved();
      toast("Inalis sa iyong listahan.", "fa-trash-can");
    });
    var mg = $("[data-manage]");
    mg.addEventListener("click", function () {
      var on = $(".dash-saved").classList.toggle("is-managing");
      mg.textContent = on ? "Tapos na" : mg.dataset.label;
    });
    drawSaved();
    var notifBtn = $("[data-all-notif]");
    notifBtn &&
      notifBtn.addEventListener("click", function () {
        openModal(
          '<h3 id="modal-title">Lahat ng Notipikasyon</h3>' +
            $$(".activity-item")
              .map(function (a) {
                return (
                  '<div class="activity-item" style="margin-top:22px">' + a.innerHTML + "</div>"
                );
              })
              .join("") +
            '<div class="activity-item" style="margin-top:22px"><span class="ico"><i class="fa-solid fa-check c-green"></i></span><div><strong>Na-verify ang iyong voter registration</strong><span>1 linggo na ang nakalipas • Account</span></div></div>',
        );
      });
  }
})();
