(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var doc = document.documentElement;

  /* 1. 顶部滚动进度条 */
  var bar = document.getElementById("progress");
  function paintProgress() {
    var max = doc.scrollHeight - doc.clientHeight;
    bar.style.width = (max > 0 ? (doc.scrollTop / max) * 100 : 0) + "%";
  }
  window.addEventListener("scroll", paintProgress, { passive: true });
  paintProgress();

  /* 2. 滚动渐入揭示：进入视口时依次显现 */
  var rvs = document.querySelectorAll(".rv");
  if (reduce || !("IntersectionObserver" in window)) {
    rvs.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    rvs.forEach(function (el) { io.observe(el); });
  }

  /* 3. 首屏视频视差：滚动时视频缓慢漂移 */
  var video = document.getElementById("heroVideo");
  var hero = document.querySelector(".hero");
  if (video && hero && !reduce) {
    var ticking = false;
    function parallax() {
      var r = hero.getBoundingClientRect();
      var vh = window.innerHeight;
      if (r.bottom > 0 && r.top < vh) {
        video.style.transform = "translateY(" + (r.top * 0.22) + "px) scale(1.08)";
      }
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(parallax); }
    }, { passive: true });
    parallax();
  }

  /* 4. 轻提示 */
  var toastEl = document.getElementById("toast");
  var toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2200);
  }
  window.toast = toast;

  /* 5. 项目卡片：点击反馈 */
  document.querySelectorAll(".project").forEach(function (card) {
    card.addEventListener("click", function () {
      toast("项目详情整理中，敬请期待");
    });
  });

  /* 6. 兴趣爱好标签：点击切换选中 */
  document.querySelectorAll(".tag").forEach(function (tag) {
    function toggle() {
      var on = tag.classList.toggle("active");
      tag.setAttribute("aria-pressed", on ? "true" : "false");
    }
    tag.addEventListener("click", toggle);
    tag.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
  });

  /* 7. 打招呼（沿用原版功能） */
  window.showMsg = function () {
    var el = document.getElementById("msg");
    if (el) {
      el.textContent = "你好，我是温泽锋，来自广东科学技术职业学院。感谢你看到这里。";
    }
  };
})();

/* ============ 桌宠：3D 跟随鼠标、可拖拽、点击弹气泡 ============ */
(function () {
  var wrap = document.getElementById("petWrap");
  var tilt = document.getElementById("petTilt");
  var bubble = document.getElementById("petBubble");
  var closeBtn = document.getElementById("petClose");
  var recall = document.getElementById("petRecall");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!wrap || !tilt || !bubble) return;

  /* ============================================================
     桌宠随机台词：单击桌宠时从下面随机挑一句说。
     想换成你自己的话：直接改字符串内容，想加一条就再加一行 "..."，
     注意每行结尾要有逗号，最后一行不要逗号。
     ============================================================ */
  var LINES = [
    "真相只有一个！",
    "我是工藤新一……啊不，我是你的简历桌宠～",
    "案件的关键，往往藏在细节里。",
    "推理就像写代码：先拆解，再逐个击破。",
    "想看看我的项目？点上面「查看我的项目」吧。",
    "简历打磨得越细，越经得起推敲。",
    "今天也一起加油吧！",
    "需要我帮忙把关？随时喊我。"
  ];
  var last = -1;
  var sayTimer = null;
  function say(line) {
    bubble.textContent = line;
    bubble.classList.add("show");
    clearTimeout(sayTimer);
    sayTimer = setTimeout(function () { bubble.classList.remove("show"); }, 2600);
  }
  function randomLine() {
    var i;
    do { i = Math.floor(Math.random() * LINES.length); } while (i === last);
    last = i;
    return LINES[i];
  }

  /* 首次问候 */
  setTimeout(function () {
    say("你好呀，我是新一～可以拖拽我，单击聊天，双击有惊喜！");
  }, 1200);

  /* 鼠标靠近：3D 转头朝向光标 */
  var PROX = 230;
  function onMove(e) {
    if (dragging) return;
    var r = wrap.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var dx = e.clientX - cx, dy = e.clientY - cy;
    var dist = Math.hypot(dx, dy);
    if (dist < PROX && !reduce) {
      tilt.style.transform = "rotateX(" + (dy / PROX) * -10 + "deg) rotateY(" + (dx / PROX) * 16 + "deg)";
      if (dist < PROX * 0.55) { wrap.classList.add("attn"); } else { wrap.classList.remove("attn"); }
    } else {
      tilt.style.transform = "rotateX(0deg) rotateY(0deg)";
      wrap.classList.remove("attn");
    }
  }
  document.addEventListener("mousemove", onMove, { passive: true });

  /* 拖拽（区分单击 / 双击） */
  var dragging = false, moved = false;
  var tapTimer = null;
  var startX = 0, startY = 0, sx = 0, sy = 0;
  wrap.addEventListener("pointerdown", function (e) {
    dragging = true; moved = false;
    startX = e.clientX; startY = e.clientY;
    var r = wrap.getBoundingClientRect();
    sx = e.clientX - r.left; sy = e.clientY - r.top;
    wrap.setPointerCapture(e.pointerId);
    wrap.classList.add("dragging");
    tilt.style.transform = "scale(0.96, 0.9)";
    bubble.classList.remove("show");
  });
  wrap.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    if (Math.hypot(e.clientX - startX, e.clientY - startY) > 6) moved = true;
    var nx = e.clientX - sx, ny = e.clientY - sy;
    wrap.style.right = "auto";
    wrap.style.bottom = "auto";
    wrap.style.left = Math.min(Math.max(0, nx), window.innerWidth - 40) + "px";
    wrap.style.top = Math.min(Math.max(0, ny), window.innerHeight - 40) + "px";
  });
  function endDrag() {
    if (!dragging) return;
    dragging = false;
    wrap.classList.remove("dragging");
    tilt.style.transform = "scale(1.04, 0.94)";
    setTimeout(function () { tilt.style.transform = "rotateX(0deg) rotateY(0deg)"; }, 130);
    if (moved) return;
    /* 单击：稍候弹台词；双击（280ms 内两次轻点）：弹出恶搞医药费弹窗 */
    if (tapTimer) {
      clearTimeout(tapTimer); tapTimer = null;
      openPrank();
    } else {
      tapTimer = setTimeout(function () { tapTimer = null; say(randomLine()); }, 280);
    }
  }
  wrap.addEventListener("pointerup", endDrag);
  wrap.addEventListener("pointercancel", endDrag);

  /* 收起 / 唤回 */
  closeBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    wrap.style.display = "none";
    recall.classList.add("show");
  });
  function recallPet() {
    wrap.style.display = "";
    recall.classList.remove("show");
    say("我回来啦！");
  }
  recall.addEventListener("click", recallPet);
  recall.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); recallPet(); }
  });

  /* ===== 恶搞弹窗：点疼我了 请支付医药费（双击触发） ===== */
  var prank = document.getElementById("prank");
  var prankClose = document.getElementById("prankClose");
  var prankMore = document.getElementById("prankMore");
  var prankExtras = document.getElementById("prankExtras");
  var prankInput = document.getElementById("prankInput");
  var prankCustom = document.getElementById("prankCustom");
  var toast = window.toast || function () {};

  function openPrank() {
    if (!prank) return;
    prankExtras.hidden = true;
    prankMore.setAttribute("aria-expanded", "false");
    prank.classList.add("open");
    document.body.style.overflow = "hidden";
    prankClose.focus();
  }
  function closePrank() {
    if (!prank) return;
    prank.classList.remove("open");
    document.body.style.overflow = "";
  }
  function payJoke(amt) {
    var m;
    if (amt === 1000) m = "已收到 1000 元医药费——假的，你的余额分毫未动。";
    else if (amt === 10000) m = "温泽锋表示：谢谢老板！（骗你的，没有真的转账）";
    else if (amt === 100000) m = "富豪！10 万我已笑纳——才怪，逗你玩的。";
    else if (amt >= 500000) m = "转账失败：金额过大，超出了本次恶搞的预算。";
    else m = "已收到 " + amt + " 元……开玩笑的啦！";
    toast(m);
    closePrank();
  }

  if (prank && prankClose && prankMore && prankExtras && prankInput && prankCustom) {
    prank.querySelectorAll("[data-amount]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        payJoke(parseInt(btn.getAttribute("data-amount"), 10));
      });
    });
    prankClose.addEventListener("click", closePrank);
    prank.addEventListener("click", function (e) {
      if (e.target.hasAttribute("data-close")) closePrank();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && prank.classList.contains("open")) closePrank();
    });
    prankMore.addEventListener("click", function () {
      var open = prankExtras.hidden;
      prankExtras.hidden = !open;
      prankMore.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) prankInput.focus();
    });
    prankCustom.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = parseInt(prankInput.value, 10);
      if (!v || v <= 0) {
        toast("请输入一个金额（认真点，逗你玩的）");
        return;
      }
      payJoke(v);
      prankInput.value = "";
    });
  }
})();
