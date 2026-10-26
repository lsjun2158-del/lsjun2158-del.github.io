# WMW 웹사이트 (welcomemyworld.dev)

WMW 대문과 그 안의 프로젝트 페이지입니다. 앱 소스는 여기 없습니다.

- 게시 저장소: `lsjun2158-del/lsjun2158-del.github.io` (GitHub Pages 사용자 사이트)
- 도메인: `welcomemyworld.dev` — Porkbun 등록(자동 갱신 · WHOIS 보호). DNS 는 GitHub Pages 주소 A 4 · AAAA 4 + `www` CNAME
- 옛 주소 `lsjun2158-del.github.io` 는 GitHub 가 새 도메인으로 넘긴다

## 주소 구조 (2026-10-26 오너 결정: 도메인은 WMW 전체, 프로젝트는 그 아래)

| 주소 | 파일 | 뜻 |
|---|---|---|
| `/` | `index.html` | WMW 대문 — 이름 + 프로젝트 카드 |
| `/soloclimbing/` | `soloclimbing/index.html` | Solo Climbing — [ 알림 ] 환영합니다, 클라이머님 · 도는 앱 아이콘 · 공식 배지 둘 |
| `/soloclimbing/privacy/` | `soloclimbing/privacy/index.html` | Solo Climbing 개인정보처리방침 (Play 방침 칸에 등록) |
| `/soloclimbing-privacy/` | 별도 저장소 `soloclimbing-privacy` | **옛 방침 주소 — 새 주소로 넘기기만 한다.** iOS · Meta 등록에 이 주소가 남아 있어도 열린다 |
| `/app-ads.txt` | `app-ads.txt` | AdMob 앱 인증. **맨 앞 하나로 모든 WMW 앱 공용.** 지우면 광고가 막힌다 |
| — | `CNAME` | 도메인을 붙이는 파일. **지우면 사이트가 옛 주소로 돌아간다** |

Play Console: 웹사이트 칸 = `https://welcomemyworld.dev/soloclimbing/`, 개인정보처리방침 칸 = `https://welcomemyworld.dev/soloclimbing/privacy/`.

새 프로젝트는 `/<프로젝트>/` 폴더를 만들고 대문에 카드를 하나 더한다.

## Solo Climbing 폴더

| 파일 | 뜻 |
|---|---|
| `og.png` | 링크 미리보기(카톡 · 인스타) 1200×630 |
| `favicon.ico` · `favicon-48.png` · `apple-touch-icon.png` | 탭 · 홈 화면 아이콘 — 앱 아이콘(흰 별 · #300054). 맨 앞에도 같은 것이 있다(브라우저 기본 요청용) |
| `img/star.png` | 앱 아이콘 원본(`android/.../drawable-nodpi/ic_launcher_fg.webp`)을 PNG 로. CSS mask 로 칠하고 돌린다 |
| `img/wall-wide.jpg` | 배경 벽 사진 — 스토어 스크린샷(촬영 화면)에서 벽만 잘라 낸 것 |
| `img/badges/` | **공식 배지 그대로** — App Store 는 Apple 마케팅 도구 한국어 SVG, Google Play 는 Google 한국어 PNG. 색 · 모양을 바꾸지 않고 높이만 맞춘다 |
| `privacy/index.html` | 방침 본문. 정본은 앱 저장소 `docs/PRIVACY.md` — 고치면 여기 HTML 도 다시 만든다 |

## 디자인 규칙

- WMW 디자인 시스템 색(검정 · 보라 `#6E4BFF` 계열)과 Pretendard 하나. 앱 버튼 판(컷 코너 좌상·우하 + 브래킷 우상·좌하)을 창 · 카드에 쓴다.
- 스토어 단추에 Apple · Google 로고를 손으로 그리지 않는다(상표 지침). 공식 배지만.
- Google 배지 PNG 는 위아래 투명 여백이 있어 몸통이 높이의 76.8% — CSS 로 두 배지 몸통 높이를 같게 맞춘다.
- 눌러도 갈 곳 없는 링크는 두지 않는다(영어 · 일본어 페이지가 생기면 언어 링크를 다시 넣는다).
- 공개 페이지에 개인 메일 · 주소를 쓰지 않는다(2026-10-26 오너 지시: 문의 메일은 문의 창으로 바꾼다).

## 고칠 때

1. 이 폴더(`docs/devsite/`)를 먼저 고친다.
2. 로컬 서버로 열어 1440 · 768 · 390 폭으로 확인한다(CSS mask 이미지는 `file://` 에서 안 그려진다).
3. 게시 저장소에 그대로 복사해 푸시한다. **구간 하나가 끝나고 확인을 마친 것만** 올린다 — 올리는 순간 공개된다.

**게시 저장소에서 직접 고치면 앱 저장소의 사본과 어긋납니다.**
