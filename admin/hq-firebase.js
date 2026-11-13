/*
 * WMW HQ 웹판 — 저장소 연결 (Firebase wmw-hq + Google 로그인)
 *
 * HQ 화면(index.html)은 claude.ai 아티팩트에서 옮겨 왔다. 화면 코드는 그대로 두고
 * 아티팩트 런타임(window.claude.use)을 이 파일이 Firebase 로 대신한다.
 *   use("db")        → Firestore (오너 Google 계정으로 로그인한 뒤에만 열린다)
 *   use("downloads") → 브라우저 내려받기
 *   use("comments")  → 아직 없음 (결정 전달은 다음 단계 «지시함» 에서)
 *
 * 누가 읽을 수 있는지는 이 파일이 아니라 Firestore 보안 규칙이 정한다
 * (WMW/공통/HQ/firebase/firestore.rules — 오너 계정만). 여기 있는 설정값은 공개용이다.
 */
(function () {
  "use strict";

  var CONFIG = {
    apiKey: "AIzaSyAjF8hR6dHgIBD5-_AzSu5qRcLN46jPvKI",
    authDomain: "wmw-hq.firebaseapp.com",
    projectId: "wmw-hq",
    storageBucket: "wmw-hq.firebasestorage.app",
    messagingSenderId: "953566283020",
    appId: "1:953566283020:web:b8b505a01ff9d90870f529"
  };
  var LOCAL_KEY = "wmw-hq-v1"; // index.html 의 LS — 로그아웃 때 이 브라우저의 사본도 지운다

  var app = firebase.initializeApp(CONFIG);
  var auth = app.auth();
  var fs = app.firestore();
  var provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  /*
   * 로그인은 /admin 에서 한 번 (2026-11-13 오너) — 같은 Google 로그인으로 Solo Climbing(solo-climbing 프로젝트)도 연다.
   * 앱 이름이 'sc' 여야 SC 대시보드(모듈 SDK, 같은 이름)가 저장된 로그인을 그대로 받는다.
   * solo-climbing 쪽은 wmw-hq 웹 클라이언트를 «외부 프로젝트 클라이언트 ID» 로 허용해 두었다(1_공개 홈페이지, 11-13).
   *   ?next=/admin/...  로그인이 끝나면 그리로 (다른 곳은 받지 않는다)
   *   ?logout=1         두 곳 모두 로그아웃
   */
  var SC_CONFIG = {
    apiKey: "AIzaSyBT2706pHuJZNlCb_eXFR86dBj1q7E1HDg",
    authDomain: "solo-climbing.firebaseapp.com",
    projectId: "solo-climbing",
    storageBucket: "solo-climbing.firebasestorage.app",
    messagingSenderId: "237692887773",
    appId: "1:237692887773:web:7167f357e7f6100e01b134"
  };
  var scAuth = firebase.initializeApp(SC_CONFIG, "sc").auth();
  var qs = new URLSearchParams(location.search);
  var NEXT = (function (n) { return n && /^\/admin\/[A-Za-z0-9_\-\/]*$/.test(n) && n.indexOf("//") < 0 ? n : null; })(qs.get("next"));
  var LOGOUT = qs.get("logout") === "1";
  var scReady = new Promise(function (r) { var off = scAuth.onAuthStateChanged(function () { off(); r(); }); });

  /** Google 로그인 결과의 idToken 으로 Solo Climbing 에도 로그인 */
  function linkSc(result) {
    var tok = result && result.credential && result.credential.idToken;
    if (!tok) return Promise.resolve(false);
    return scAuth.signInWithCredential(firebase.auth.GoogleAuthProvider.credential(tok))
      .then(function () { return true; }, function () { return false; });
  }
  var linking = Promise.resolve(); // 팝업 로그인 뒤 sc 이어 붙이기가 끝날 때까지 다음 화면으로 넘기지 않는다
  function signIn() {
    msg("로그인 창을 여는 중…");
    // 이미 wmw-hq 에 로그인된 채(같은 계정) 다시 로그인하면 onAuthStateChanged 가 다시 불리지 않는다
    // → sc 를 이어 붙인 뒤 처리 흐름을 직접 한 번 더 돈다 (1_공개 홈페이지 검토, 11-13)
    var had = !!auth.currentUser;
    return linking = auth.signInWithPopup(provider).then(function (res) {
      return linkSc(res).then(function (ok) { if (had && auth.currentUser) setTimeout(function () { onUser(auth.currentUser); }, 0); return ok; });
    }, function (err) {
      var c = err && err.code || "";
      if (/popup-blocked|popup-closed|cancelled-popup|operation-not-supported/.test(c)) return auth.signInWithRedirect(provider);
      msg("로그인하지 못했습니다. 다시 눌러 주세요.", true);
    });
  }
  function signOutAll() {
    try { localStorage.removeItem(LOCAL_KEY); } catch (e) {}
    return Promise.all([auth.signOut(), scAuth.signOut()]).catch(function () {});
  }

  /* ---------- 로그인 문 ---------- */
  var css = document.createElement("style");
  css.textContent =
    "#hqGate{position:fixed;inset:0;z-index:100;background:var(--bg,#000);display:flex;align-items:center;justify-content:center;padding:24px}" +
    "#hqGate .box{max-width:360px;width:100%;border:1px solid var(--line,#241F30);border-radius:8px;background:var(--surface,#0B0A10);padding:28px 24px;text-align:center}" +
    "#hqGate b{display:block;font-family:var(--display,sans-serif);font-weight:800;letter-spacing:.13em;font-size:15px}" +
    "#hqGate span.s{display:block;margin-top:6px;font-family:var(--mono,monospace);font-size:10px;letter-spacing:.18em;color:var(--dim,#5C5570);text-transform:uppercase}" +
    "#hqGate button{margin-top:22px;width:100%;padding:11px 14px;border-radius:5px;background:var(--accent,#8257FF);color:#fff;font-weight:600;font-size:14px}" +
    "#hqGate p{margin:14px 0 0;font-size:12.5px;color:var(--muted,#877F97);word-break:keep-all;overflow-wrap:anywhere}" +
    "#hqGate p.err{color:var(--warn,#F0B845)}" +
    "#hqOut{font-family:var(--mono,monospace);font-size:10.5px;color:var(--dim,#5C5570);text-align:left;padding:0}" +
    "#hqOut:hover{color:var(--warn,#F0B845)}";
  document.head.appendChild(css);

  var gate = document.createElement("div");
  gate.id = "hqGate";
  // 처음에는 «확인 중» 만 — 로그인 단추는 로그인이 없다고 확인된 뒤에 보인다(번쩍임 방지)
  gate.innerHTML = '<div class="box"><b>WELMAWORLD</b><span class="s">Headquarters</span>' +
    '<button type="button" id="hqIn" hidden>Google 로 로그인</button>' +
    '<p id="hqMsg">로그인 확인 중…</p></div>';
  function mountGate() { if (!gate.isConnected) document.body.appendChild(gate); }
  function msg(t, err) { var m = document.getElementById("hqMsg"); if (m) { m.textContent = t; m.className = err ? "err" : ""; } }
  function askLogin(t, err) { mountGate(); var b = document.getElementById("hqIn"); if (b) b.hidden = false; msg(t, err); }
  if (document.body) mountGate(); else document.addEventListener("DOMContentLoaded", mountGate);

  gate.addEventListener("click", function (e) {
    if (e.target && e.target.id === "hqIn") signIn();
  });

  /* 이 변경 전에 로그인해 Solo Climbing 이 비어 있으면 한 번만 알린다 */
  function offerScOnce() {
    var KEY = "wmw-sc-link-asked";
    try { if (localStorage.getItem(KEY)) return; localStorage.setItem(KEY, "1"); } catch (e) {}
    var bar = document.createElement("div");
    bar.style.cssText = "position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:120;max-width:calc(100vw - 32px);display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:10px 14px;border-radius:8px;background:var(--raised,#131019);border:1px solid var(--accent-line,rgba(130,87,255,.34));font-size:13px;color:var(--text,#ECE8F2)";
    bar.innerHTML = '<span>Solo Climbing 까지 함께 열려면 한 번 더 로그인해 주세요.</span>' +
      '<button type="button" style="padding:6px 12px;border-radius:6px;background:var(--accent,#8257FF);color:#fff;font-weight:600">로그인</button>' +
      '<button type="button" style="color:var(--muted,#877F97)">나중에</button>';
    bar.children[1].onclick = function () { bar.remove(); signIn(); };
    bar.children[2].onclick = function () { bar.remove(); };
    document.body.appendChild(bar);
  }

  function addSignOut() {
    var foot = document.querySelector(".rail-foot");
    if (!foot || document.getElementById("hqOut")) return;
    var b = document.createElement("button");
    b.id = "hqOut"; b.type = "button"; b.textContent = "로그아웃";
    b.addEventListener("click", function () {
      signOutAll().then(function () { location.replace("/admin/"); });
    });
    foot.appendChild(b);
  }

  /* ---------- 관리 화면 탭 줄 — HQ | Solo Climbing | 세션 별자리 (세 화면 같은 줄, 2026-11-13 오너) ---------- */
  var tabCss = document.createElement("style");
  tabCss.textContent =
    "nav.site{position:sticky;top:0;z-index:101;display:flex;flex-wrap:wrap;gap:2px 20px;padding:0 22px;background:var(--bg,#000);border-bottom:1px solid var(--line,#241F30)}" +
    "nav.site a{display:inline-flex;align-items:center;min-height:40px;margin-bottom:-1px;font:700 14px/1.25 var(--sans,sans-serif);color:var(--muted,#877F97);text-decoration:none;border-bottom:2px solid transparent}" +
    "nav.site a:hover{color:var(--text,#ECE8F2)}" +
    "nav.site a[aria-current=page]{color:var(--text,#ECE8F2);border-bottom-color:var(--accent,#8257FF)}" +
    // 화면 CSS(index.html)가 이 뒤에 오므로 body 를 붙여 이긴다
    "body #hqGate{top:var(--siteH,41px)}" +
    "body .flow-toolbar{top:var(--siteH,41px)}" +
    "@media (min-width:881px){body .rail{top:var(--siteH,41px);height:calc(100vh - var(--siteH,41px))}}";
  document.head.appendChild(tabCss);
  function mountTabs() {
    if (document.querySelector("nav.site")) return;
    var nav = document.createElement("nav");
    nav.className = "site"; nav.setAttribute("aria-label", "관리 화면");
    nav.innerHTML = '<a href="/admin/" aria-current="page">HQ</a><a href="/admin/soloclimbing/">Solo Climbing</a><a href="/admin/sessions/">세션 별자리</a>';
    document.body.insertBefore(nav, document.body.firstChild);
    var fit = function () { document.documentElement.style.setProperty("--siteH", nav.offsetHeight + "px"); };
    fit(); if (window.ResizeObserver) new ResizeObserver(fit).observe(nav); else window.addEventListener("resize", fit);
  }
  if (document.body) mountTabs(); else document.addEventListener("DOMContentLoaded", mountTabs);

  /* ---------- 오너 확인 뒤에만 db 를 건넨다 ---------- */
  var resolveDb;
  var dbReady = new Promise(function (r) { resolveDb = r; });
  var started = LOGOUT
    ? signOutAll().then(function () { history.replaceState(null, "", "/admin/"); })
    : auth.getRedirectResult().then(linkSc, function () {});
  started.then(function () { auth.onAuthStateChanged(onUser); });
  function onUser(user) {
      if (!user) { askLogin(LOGOUT ? "로그아웃했습니다." : "오너 계정으로만 열립니다."); return; }
      msg("확인하는 중…");
      // 규칙이 막으면 오너가 아니다 — 페이지 쪽에서 이메일을 비교하지 않는다(규칙이 정본)
      fs.doc("feed/meta").get().then(function () {
        return Promise.all([scReady, linking]).then(function () {
          if (NEXT) {
            // 다른 관리 화면에서 넘어왔다 — Solo Climbing 은 sc 로그인이 있어야 열린다
            if (/^\/admin\/soloclimbing/.test(NEXT) && !scAuth.currentUser) { askLogin("Solo Climbing 까지 함께 열려면 한 번 더 로그인해 주세요."); return; }
            location.replace(NEXT); return;
          }
          gate.remove();
          addSignOut();
          resolveDb(fs);
          if (!scAuth.currentUser) offerScOnce();
        });
      }, function (err) {
        var denied = err && err.code === "permission-denied";
        signOutAll();
        askLogin(denied ? "이 계정은 볼 수 없습니다. 오너 계정으로 다시 로그인해 주세요." : "저장소에 닿지 못했습니다. 잠시 뒤 다시 시도해 주세요.", true);
      });
  }

  /* ---------- 아티팩트 런타임 대신 ---------- */
  var downloads = {
    save: function (o) {
      return new Promise(function (resolve) {
        var blob = new Blob([o.data], { type: "application/json" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = o.filename || "download.json";
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
        resolve();
      });
    }
  };

  window.claude = {
    use: function (name) {
      if (name === "db") return dbReady;
      if (name === "downloads") return Promise.resolve(downloads);
      // comments(결정 전달) · sample(번역)은 웹판에 없다 — null 을 주면 화면이 «사용할 수 없습니다» 로 안내한다
      return Promise.resolve(null);
    }
  };
})();
