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
  gate.innerHTML = '<div class="box"><b>WELMAWORLD</b><span class="s">Headquarters</span>' +
    '<button type="button" id="hqIn">Google 로 로그인</button>' +
    '<p id="hqMsg">오너 계정으로만 열립니다.</p></div>';
  function mountGate() { if (!gate.isConnected) document.body.appendChild(gate); }
  function msg(t, err) { var m = document.getElementById("hqMsg"); if (m) { m.textContent = t; m.className = err ? "err" : ""; } }
  if (document.body) mountGate(); else document.addEventListener("DOMContentLoaded", mountGate);

  gate.addEventListener("click", function (e) {
    if (e.target && e.target.id === "hqIn") {
      msg("로그인 창을 여는 중…");
      auth.signInWithPopup(provider).catch(function (err) {
        var c = err && err.code || "";
        if (/popup-blocked|popup-closed|cancelled-popup|operation-not-supported/.test(c)) auth.signInWithRedirect(provider);
        else msg("로그인하지 못했습니다. 다시 눌러 주세요.", true);
      });
    }
  });

  function addSignOut() {
    var foot = document.querySelector(".rail-foot");
    if (!foot || document.getElementById("hqOut")) return;
    var b = document.createElement("button");
    b.id = "hqOut"; b.type = "button"; b.textContent = "로그아웃";
    b.addEventListener("click", function () {
      try { localStorage.removeItem(LOCAL_KEY); } catch (e) {}
      auth.signOut().then(function () { location.reload(); });
    });
    foot.appendChild(b);
    // 관리 입구(/admin) 의 다른 화면 — Solo Climbing 대시보드
    var sc = document.createElement("a");
    sc.href = "/admin/soloclimbing/"; sc.textContent = "Solo Climbing 대시보드 →";
    sc.style.cssText = "font-family:var(--mono,monospace);font-size:10.5px;color:var(--accent-soft,#B79CFF);text-decoration:none";
    foot.insertBefore(sc, foot.firstChild);
    // 세션 별자리 — 세션을 보고 지시를 보내는 화면 (relay.js 가 이 PC 에서 받아 넣는다)
    var ss = document.createElement("a");
    ss.href = "/admin/sessions/"; ss.textContent = "세션 별자리 →";
    ss.style.cssText = sc.style.cssText;
    foot.insertBefore(ss, foot.firstChild);
  }

  /* ---------- 오너 확인 뒤에만 db 를 건넨다 ---------- */
  var resolveDb;
  var dbReady = new Promise(function (r) { resolveDb = r; });
  auth.getRedirectResult().catch(function () {});
  auth.onAuthStateChanged(function (user) {
    if (!user) { mountGate(); msg("오너 계정으로만 열립니다."); return; }
    msg("확인하는 중…");
    // 규칙이 막으면 오너가 아니다 — 페이지 쪽에서 이메일을 비교하지 않는다(규칙이 정본)
    fs.doc("feed/meta").get().then(function () {
      gate.remove();
      addSignOut();
      resolveDb(fs);
    }, function (err) {
      var denied = err && err.code === "permission-denied";
      try { localStorage.removeItem(LOCAL_KEY); } catch (e) {}
      auth.signOut();
      mountGate();
      msg(denied ? "이 계정은 볼 수 없습니다. 오너 계정으로 다시 로그인해 주세요." : "저장소에 닿지 못했습니다. 잠시 뒤 다시 시도해 주세요.", true);
    });
  });

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
