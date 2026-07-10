// renderer.js - controls tabs and webviews
const address = document.getElementById('address');
const backBtn = document.getElementById('back');
const forwardBtn = document.getElementById('forward');
const reloadBtn = document.getElementById('reload');
const goBtn = document.getElementById('go');
const newTabBtn = document.getElementById('new-tab');
const tabsEl = document.getElementById('tabs');
const webviewsEl = document.getElementById('webviews');

const MAX_TABS = 10;
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

let tabs = [];
let activeTabId = null;
let nextTabId = 1;

function makeValidUrl(input) {
  try {
    const url = new URL(input);
    // URL 검증: HTTP/HTTPS 프로토콜만 허용
    if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
      return 'about:blank';
    }
    return url.toString();
  } catch (e) {
    // prepend http:// if missing
    try {
      const url = new URL('http://' + input);
      return url.toString();
    } catch (e2) {
      return 'about:blank';
    }
  }
}

function createTab(url = 'https://www.google.com') {
  // 탭 개수 제한 (최대 10개)
  if (tabs.length >= MAX_TABS) {
    alert(`최대 ${MAX_TABS}개의 탭만 열 수 있습니다.`);
    return null;
  }

  const id = String(nextTabId++);

  // tab button
  const tabBtn = document.createElement('button');
  tabBtn.className = 'tab';
  tabBtn.dataset.id = id;
  tabBtn.textContent = 'New Tab';
  tabBtn.setAttribute('role', 'tab');
  tabBtn.setAttribute('aria-selected', 'false');

  const closeBtn = document.createElement('span');
  closeBtn.className = 'tab-close';
  closeBtn.textContent = '×';
  closeBtn.setAttribute('aria-label', '탭 닫기');
  tabBtn.appendChild(closeBtn);

  tabsEl.appendChild(tabBtn);

  // webview
  const webview = document.createElement('webview');
  webview.setAttribute('src', makeValidUrl(url));
  webview.setAttribute('partition', `persist:tab${id}`);
  webview.setAttribute('preload', '');
  webview.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-plugins allow-popups');
  webview.className = 'webview';
  webview.dataset.id = id;
  webviewsEl.appendChild(webview);

  const tab = { id, tabBtn, webview };
  tabs.push(tab);

  tabBtn.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-close')) {
      closeTab(id);
    } else {
      activateTab(id);
    }
  });

  webview.addEventListener('did-start-loading', () => {
    tabBtn.classList.add('loading');
  });
  webview.addEventListener('did-stop-loading', () => {
    tabBtn.classList.remove('loading');
  });
  webview.addEventListener('page-title-updated', (ev) => {
    tabBtn.childNodes[0].textContent = ev.title;
  });
  webview.addEventListener('did-navigate-in-page', (ev) => {
    if (activeTabId === id) address.value = ev.url;
  });
  webview.addEventListener('did-navigate', (ev) => {
    if (activeTabId === id) address.value = ev.url;
  });

  // 크래시 감지
  webview.addEventListener('crashed', () => {
    console.error(`탭 ${id} 크래시 감지`);
    tabBtn.style.opacity = '0.5';
    tabBtn.title = '크래시됨 - 탭을 닫고 다시 열어주세요';
  });

  // 외부 링크 처리
  webview.addEventListener('new-window', (e) => {
    if (e.url && ALLOWED_PROTOCOLS.some(p => e.url.startsWith(p))) {
      window.electronAPI.openExternal(e.url);
    }
  });

  activateTab(id);
  return id;
}

function activateTab(id) {
  activeTabId = id;
  tabs.forEach(t => {
    const active = t.id === id;
    t.tabBtn.classList.toggle('active', active);
    t.tabBtn.setAttribute('aria-selected', active);
    t.webview.style.display = active ? 'flex' : 'none';
  });

  const activeTab = tabs.find(t => t.id === id);
  if (activeTab) {
    // update address
    try {
      address.value = activeTab.webview.getURL() || activeTab.webview.getAttribute('src');
    } catch (e) {
      address.value = activeTab.webview.getAttribute('src') || '';
    }
  }
}

function closeTab(id) {
  const i = tabs.findIndex(t => t.id === id);
  if (i === -1) return;
  const [t] = tabs.splice(i, 1);
  t.tabBtn.remove();
  
  // 메모리 정리: 리스너 및 DOM 정리
  try {
    t.webview.stop();
    t.webview.clearHistory();
  } catch (e) {
    // webview가 이미 제거된 경우 무시
  }
  t.webview.remove();
  
  if (activeTabId === id) {
    if (tabs[i]) activateTab(tabs[i].id);
    else if (tabs[i - 1]) activateTab(tabs[i - 1].id);
    else createTab();
  }
}

function getActiveWebview() {
  const tab = tabs.find(t => t.id === activeTabId);
  return tab ? tab.webview : null;
}

backBtn.addEventListener('click', () => {
  const w = getActiveWebview();
  if (w && w.canGoBack && w.canGoBack()) w.goBack();
});
forwardBtn.addEventListener('click', () => {
  const w = getActiveWebview();
  if (w && w.canGoForward && w.canGoForward()) w.goForward();
});
reloadBtn.addEventListener('click', () => {
  const w = getActiveWebview();
  if (w) w.reload();
});

goBtn.addEventListener('click', () => {
  const w = getActiveWebview();
  if (!w) return;
  const url = makeValidUrl(address.value.trim());
  w.loadURL(url);
});

address.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') goBtn.click();
});

newTabBtn.addEventListener('click', () => createTab());

// start with one tab
createTab('https://www.google.com');
