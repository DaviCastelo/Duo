/* ============================================================
   DUO Estética Automotiva — interações
   ============================================================ */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* Data final da promoção de inauguração (edite aqui) */
  const PROMO_END = "2026-06-27T23:59:59-03:00";

  /* ----------------------------------------------------------
     PRELOADER
  ---------------------------------------------------------- */
  const preloader = $("#preloader");
  if (preloader) {
    const bar = $("#preloaderBar");
    const pct = $("#preloaderPct");
    const fast = sessionStorage.getItem("duo-seen") === "1";
    const dur = fast || reduceMotion ? 350 : 1500;
    const t0 = performance.now();
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      bar.style.width = "100%";
      pct.textContent = "100%";
      sessionStorage.setItem("duo-seen", "1");
      setTimeout(() => {
        preloader.classList.add("is-done");
        document.body.classList.add("is-loaded");
      }, 180);
    };

    const step = (now) => {
      const p = clamp((now - t0) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      bar.style.width = `${eased * 100}%`;
      pct.textContent = `${Math.round(eased * 100)}%`;
      if (p < 1) requestAnimationFrame(step);
      else finish();
    };
    requestAnimationFrame(step);
    setTimeout(finish, dur + 1200); // trava de segurança
  }

  /* ----------------------------------------------------------
     CURSOR CUSTOM
  ---------------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    const dot = $("#cursorDot");
    const ring = $("#cursorRing");
    let mx = innerWidth / 2, my = innerHeight / 2;
    let rx = mx, ry = my;

    addEventListener("pointermove", (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.left = `${mx}px`;
      dot.style.top = `${my}px`;
      document.body.classList.remove("cursor-hidden");
    }, { passive: true });

    document.documentElement.addEventListener("pointerleave", () =>
      document.body.classList.add("cursor-hidden"));

    const loop = () => {
      rx = lerp(rx, mx, 0.16);
      ry = lerp(ry, my, 0.16);
      ring.style.left = `${rx}px`;
      ring.style.top = `${ry}px`;
      requestAnimationFrame(loop);
    };
    loop();

    const hoverSel = "a, button, input, [data-tilt], .ba, .chip, .faq__q";
    document.addEventListener("pointerover", (e) => {
      if (e.target.closest(hoverSel)) ring.classList.add("is-hover");
    });
    document.addEventListener("pointerout", (e) => {
      if (e.target.closest(hoverSel)) ring.classList.remove("is-hover");
    });
  }

  /* ----------------------------------------------------------
     TOPBAR / NAVBAR / PROGRESSO / MENU MOBILE
  ---------------------------------------------------------- */
  const topbar = $("#topbar");
  $("#topbarClose")?.addEventListener("click", () => {
    topbar.classList.add("is-hidden");
    sessionStorage.setItem("duo-topbar", "off");
  });
  if (sessionStorage.getItem("duo-topbar") === "off") topbar?.classList.add("is-hidden");

  const navbar = $("#navbar");
  const progress = $("#scrollProgress");
  const toTop = $("#toTop");
  const toTopRing = $("#toTopProgress");
  const RING = 2 * Math.PI * 20;
  if (toTopRing) {
    toTopRing.style.strokeDasharray = String(RING);
    toTopRing.style.strokeDashoffset = String(RING);
  }

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = scrollY;
      navbar.classList.toggle("is-scrolled", y > 40);
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? y / max : 0;
      progress.style.transform = `scaleX(${p})`;
      toTop.classList.toggle("is-visible", y > 620);
      toTopRing.style.strokeDashoffset = RING * (1 - p);
      updateProcess();
      ticking = false;
    });
  };
  addEventListener("scroll", onScroll, { passive: true });

  toTop?.addEventListener("click", () => scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

  const burger = $("#navBurger");
  const mobileMenu = $("#mobileMenu");
  const setMenu = (open) => {
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    mobileMenu.classList.toggle("is-open", open);
    mobileMenu.setAttribute("aria-hidden", !open);
    document.body.style.overflow = open ? "hidden" : "";
  };
  burger?.addEventListener("click", () => setMenu(!mobileMenu.classList.contains("is-open")));
  $$(".mobile-menu a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mobileMenu.classList.contains("is-open")) setMenu(false);
  });

  /* link ativo conforme a seção visível */
  const navLinks = $$(".navbar__link");
  const sectionByLink = new Map();
  navLinks.forEach((l) => {
    const sec = $(l.getAttribute("href"));
    if (sec) sectionByLink.set(sec, l);
  });
  const activeIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        navLinks.forEach((l) => l.classList.remove("is-active"));
        sectionByLink.get(en.target)?.classList.add("is-active");
      }
    });
  }, { rootMargin: "-38% 0px -55% 0px" });
  sectionByLink.forEach((_, sec) => activeIO.observe(sec));

  /* ----------------------------------------------------------
     PARTÍCULAS DO HERO (canvas)
  ---------------------------------------------------------- */
  const canvas = $("#heroParticles");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    const hero = canvas.parentElement;
    let parts = [];
    let raf = null;
    let w = 0, h = 0, dpr = 1;

    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = hero.offsetWidth;
      h = hero.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(clamp(w / 26, 26, 70));
      parts = Array.from({ length: n }, () => spawn(true));
    };

    const spawn = (anyY) => ({
      x: Math.random() * w,
      y: anyY ? Math.random() * h : h + 12,
      r: Math.random() * 1.9 + 0.5,
      vy: Math.random() * 0.34 + 0.08,
      vx: (Math.random() - 0.5) * 0.16,
      tw: Math.random() * Math.PI * 2,
      ts: Math.random() * 0.025 + 0.008,
      gold: Math.random() < 0.3,
    });

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.y -= p.vy;
        p.x += p.vx;
        p.tw += p.ts;
        if (p.y < -14 || p.x < -14 || p.x > w + 14) Object.assign(p, spawn(false));
        const a = (Math.sin(p.tw) * 0.5 + 0.5) * 0.5 + 0.08;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.gold ? `rgba(228,183,72,${a})` : `rgba(195,208,235,${a * 0.8})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    const start = () => { if (!raf) raf = requestAnimationFrame(draw); };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = null; } };

    resize();
    start();
    addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    new IntersectionObserver(([en]) => (en.isIntersecting ? start() : stop()))
      .observe(hero);
  }

  /* ----------------------------------------------------------
     PARALLAX DO MOUSE (hero)
  ---------------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    const layers = $$("[data-parallax]");
    if (layers.length) {
      let px = 0, py = 0, cx = 0, cy = 0;
      addEventListener("pointermove", (e) => {
        px = (e.clientX / innerWidth - 0.5) * 2;
        py = (e.clientY / innerHeight - 0.5) * 2;
      }, { passive: true });
      const move = () => {
        cx = lerp(cx, px, 0.05);
        cy = lerp(cy, py, 0.05);
        for (const el of layers) {
          const f = parseFloat(el.dataset.parallax) * 100;
          el.style.transform = `translate3d(${(-cx * f).toFixed(1)}px, ${(-cy * f).toFixed(1)}px, 0)`;
        }
        requestAnimationFrame(move);
      };
      move();
    }
  }

  /* ----------------------------------------------------------
     REVEAL AO ROLAR
  ---------------------------------------------------------- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add("is-in");
        revealIO.unobserve(en.target);
      }
    });
  }, { threshold: 0.14, rootMargin: "0px 0px -36px 0px" });
  $$("[data-reveal]").forEach((el) => revealIO.observe(el));

  /* ----------------------------------------------------------
     CONTADORES (odômetro)
  ---------------------------------------------------------- */
  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      counterIO.unobserve(en.target);
      const el = en.target;
      const target = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.decimals || "0", 10);
      const t0 = performance.now();
      const dur = reduceMotion ? 1 : 1700;
      const tick = (now) => {
        const p = clamp((now - t0) / dur, 0, 1);
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = (target * eased).toFixed(dec).replace(".", ",");
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  $$("[data-count]").forEach((el) => counterIO.observe(el));

  /* ----------------------------------------------------------
     TILT 3D + SPOTLIGHT + BOTÕES MAGNÉTICOS
  ---------------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    $$("[data-tilt]").forEach((card) => {
      let raf = null;
      card.addEventListener("pointermove", (e) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          card.style.transform =
            `perspective(820px) rotateY(${(x * 9).toFixed(2)}deg) rotateX(${(-y * 9).toFixed(2)}deg) translateY(-4px)`;
          raf = null;
        });
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });

    $$("[data-spotlight]").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
        card.style.setProperty("--my", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
      }, { passive: true });
    });

    $$("[data-magnetic]").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${(x * 0.16).toFixed(1)}px, ${(y * 0.22).toFixed(1)}px)`;
      }, { passive: true });
      btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
    });
  }

  /* ----------------------------------------------------------
     ANTES & DEPOIS
  ---------------------------------------------------------- */
  const ba = $("#baSlider");
  if (ba) {
    let pos = 50;
    const apply = () => {
      ba.style.setProperty("--pos", `${pos}%`);
      ba.setAttribute("aria-valuenow", Math.round(pos));
    };
    const fromEvent = (e) => {
      const r = ba.getBoundingClientRect();
      pos = clamp(((e.clientX - r.left) / r.width) * 100, 3, 97);
      apply();
    };
    let dragging = false;
    ba.addEventListener("pointerdown", (e) => {
      dragging = true;
      ba.setPointerCapture(e.pointerId);
      fromEvent(e);
    });
    ba.addEventListener("pointermove", (e) => dragging && fromEvent(e));
    const stopDrag = () => (dragging = false);
    ba.addEventListener("pointerup", stopDrag);
    ba.addEventListener("pointercancel", stopDrag);
    ba.addEventListener("keydown", (e) => {
      const step = e.shiftKey ? 10 : 3;
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") { pos = clamp(pos - step, 3, 97); apply(); e.preventDefault(); }
      if (e.key === "ArrowRight" || e.key === "ArrowUp") { pos = clamp(pos + step, 3, 97); apply(); e.preventDefault(); }
    });
    apply();
    /* aceno inicial quando entra na tela */
    if (!reduceMotion) {
      new IntersectionObserver(([en], io) => {
        if (!en.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const wave = (now) => {
          const p = (now - t0) / 1500;
          if (p >= 1 || dragging) { pos = 50; apply(); return; }
          pos = 50 + Math.sin(p * Math.PI * 2) * 14 * (1 - p);
          apply();
          requestAnimationFrame(wave);
        };
        setTimeout(() => requestAnimationFrame(wave), 350);
      }, { threshold: 0.5 }).observe(ba);
    }
  }

  /* ----------------------------------------------------------
     MONTE SEU ORÇAMENTO
  ---------------------------------------------------------- */
  const builder = {
    vehicle: null,
    name: "",
  };
  const bMsg = $("#builderMessage");
  const bBubble = $("#builderBubble");
  const bSend = $("#builderSend");
  const bTime = $("#builderTime");

  if (bMsg) {
    const now = new Date();
    bTime.textContent = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const compose = () => {
      if (!builder.vehicle) {
        return "Olá! Selecione seu veículo ao lado para começar…";
      }
      let msg = "Olá! 👋";
      if (builder.name.trim()) msg += ` Meu nome é ${builder.name.trim()}.`;
      msg += `\nTenho um ${builder.vehicle} e quero um orçamento.`;
      msg += "\nPode me passar valores e prazos?";
      return msg;
    };

    const update = () => {
      bMsg.textContent = compose();
      bBubble.classList.remove("is-pop");
      void bBubble.offsetWidth; // reinicia a animação
      bBubble.classList.add("is-pop");
      const ready = Boolean(builder.vehicle);
      bSend.classList.toggle("is-disabled", !ready);
      bSend.setAttribute("aria-disabled", String(!ready));
      bSend.href = "#";
    };

    const vehicleMap = {
      Hatch: "Sedan/Hatch",
      Sedan: "Sedan/Hatch",
      SUV: "SUV",
      Picape: "Caminhonete",
    };

    bSend.addEventListener("click", (e) => {
      e.preventDefault();
      if (bSend.classList.contains("is-disabled")) return;
      window.openDuoBot?.({
        tipo_veiculo: vehicleMap[builder.vehicle] || builder.vehicle,
        nome_cliente: builder.name.trim() || undefined,
      });
    });

    $$("#builderVehicles .chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const on = chip.classList.contains("is-on");
        $$("#builderVehicles .chip").forEach((c) => c.classList.remove("is-on"));
        builder.vehicle = on ? null : chip.dataset.vehicle;
        if (!on) chip.classList.add("is-on");
        update();
      });
    });
    $("#builderName")?.addEventListener("input", (e) => {
      builder.name = e.target.value;
      update();
    });
  }

  /* ----------------------------------------------------------
     LINHA DE PROGRESSO DO PROCESSO
  ---------------------------------------------------------- */
  const processTl = $("#processTimeline");
  const processFill = $("#processLineFill");
  function updateProcess() {
    if (!processTl) return;
    const r = processTl.getBoundingClientRect();
    const start = innerHeight * 0.82;
    const p = clamp(((start - r.top) / (r.height + innerHeight * 0.3)) * 100, 0, 100);
    processFill.style.setProperty("--p", p.toFixed(1));
  }
  updateProcess();

  /* ----------------------------------------------------------
     CARROSSEL DE DEPOIMENTOS
  ---------------------------------------------------------- */
  const carousel = $("#tCarousel");
  if (carousel) {
    const track = $("#tTrack");
    const cards = $$(".tcard", track);
    const dotsWrap = $("#tDots");
    let index = 0;
    let timer = null;
    let startX = null;
    let delta = 0;

    cards.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", `Depoimento ${i + 1}`);
      dot.addEventListener("click", () => go(i, true));
      dotsWrap.appendChild(dot);
    });
    const dots = $$("button", dotsWrap);

    const go = (i, manual) => {
      index = (i + cards.length) % cards.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((d, k) => d.classList.toggle("is-on", k === index));
      if (manual) restart();
    };
    const restart = () => {
      clearInterval(timer);
      if (!reduceMotion) timer = setInterval(() => go(index + 1), 5200);
    };

    carousel.addEventListener("pointerdown", (e) => {
      startX = e.clientX;
      delta = 0;
      carousel.classList.add("is-dragging");
      track.style.transition = "none";
    });
    carousel.addEventListener("pointermove", (e) => {
      if (startX === null) return;
      delta = e.clientX - startX;
      track.style.transform =
        `translateX(calc(-${index * 100}% + ${delta}px))`;
    });
    const release = () => {
      if (startX === null) return;
      carousel.classList.remove("is-dragging");
      track.style.transition = "";
      if (Math.abs(delta) > 56) go(index + (delta < 0 ? 1 : -1), true);
      else go(index, true);
      startX = null;
    };
    carousel.addEventListener("pointerup", release);
    carousel.addEventListener("pointerleave", release);
    carousel.addEventListener("mouseenter", () => clearInterval(timer));
    carousel.addEventListener("mouseleave", restart);
    document.addEventListener("visibilitychange", () =>
      document.hidden ? clearInterval(timer) : restart());

    go(0);
    restart();
  }

  /* ----------------------------------------------------------
     FAQ
  ---------------------------------------------------------- */
  $$(".faq__item").forEach((item) => {
    const btn = $(".faq__q", item);
    btn.addEventListener("click", () => {
      const open = item.classList.contains("is-open");
      $$(".faq__item.is-open").forEach((o) => {
        o.classList.remove("is-open");
        $(".faq__q", o).setAttribute("aria-expanded", "false");
      });
      if (!open) {
        item.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* ----------------------------------------------------------
     COUNTDOWN DA PROMO
  ---------------------------------------------------------- */
  const cd = {
    d: $("#cdDays"), h: $("#cdHours"), m: $("#cdMins"), s: $("#cdSecs"),
  };
  if (cd.d) {
    const end = new Date(PROMO_END).getTime();
    const setVal = (el, v) => {
      const txt = String(v).padStart(2, "0");
      if (el.textContent !== txt) {
        el.textContent = txt;
        if (!reduceMotion) {
          el.classList.remove("is-tick");
          void el.offsetWidth;
          el.classList.add("is-tick");
        }
      }
    };
    const tick = () => {
      const left = Math.max(0, end - Date.now());
      setVal(cd.d, Math.floor(left / 86400000));
      setVal(cd.h, Math.floor(left / 3600000) % 24);
      setVal(cd.m, Math.floor(left / 60000) % 60);
      setVal(cd.s, Math.floor(left / 1000) % 60);
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ----------------------------------------------------------
     FAB — dica temporizada
  ---------------------------------------------------------- */
  const fab = $("#waFab");
  if (fab && sessionStorage.getItem("duo-tip") !== "1") {
    setTimeout(() => {
      fab.classList.add("show-tip");
      setTimeout(() => {
        fab.classList.remove("show-tip");
        sessionStorage.setItem("duo-tip", "1");
      }, 4200);
    }, 4500);
  }

  /* ----------------------------------------------------------
     MOBILE — bloqueia scroll horizontal residual
  ---------------------------------------------------------- */
  const root = document.documentElement;
  const resetScrollX = () => {
    if (root.scrollLeft !== 0) root.scrollLeft = 0;
  };
  addEventListener("scroll", resetScrollX, { passive: true });
  addEventListener("resize", resetScrollX, { passive: true });

  let touchX = 0;
  let touchY = 0;
  addEventListener("touchstart", (e) => {
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
  }, { passive: true });

  addEventListener("touchmove", (e) => {
    if (root.scrollWidth <= root.clientWidth + 1) return;
    const dx = Math.abs(e.touches[0].clientX - touchX);
    const dy = Math.abs(e.touches[0].clientY - touchY);
    if (dx <= dy || dx < 8) return;
    const allow = e.target.closest(".ba, .tcarousel, typebot-popup, input, textarea, select");
    if (!allow) e.preventDefault();
  }, { passive: false });

  /* ----------------------------------------------------------
     ANO DO RODAPÉ
  ---------------------------------------------------------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  onScroll();
})();
