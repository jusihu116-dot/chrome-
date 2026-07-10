# Simple Electron Browser

간단한 Electron 기반 데스크탑 브라우저 예제입니다. Chromium의 webview를 사용해 주소창, 뒤로/앞으로, 새로고침, 다중 탭(간단)을 지원합니다.

사용 방법

1. 레포 클론 후 새 브랜치로 체크아웃 (또는 해당 브랜치 사용):

   git clone https://github.com/jusihu116-dot/chrome-.git
   cd chrome-
   git checkout add-electron-browser

2. 의존성 설치 및 실행:

   npm install
   npm start

요구사항

- Node.js 12 이상 권장
- 이 예제는 데모용이며 보안/성능 최적화가 되어 있지 않습니다. 실제 제품 수준 브라우저를 만들려면 추가 작업이 필요합니다.

설명

- main.js: Electron 메인 프로세스
- preload.js: 안전한 브리지
- index.html + renderer.js: UI 및 탭/웹뷰 제어

