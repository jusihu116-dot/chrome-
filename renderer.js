// renderer.js - controls tabs and webviews
const address = document.getElementById('address');
const backBtn = document.getElementById('back');
const forwardBtn = document.getElementById('forward');
const reloadBtn = document.getElementById('reload');
const goBtn = document.getElementById('go');
const newTabBtn = document.getElementById('new-tab');
const tabsEl = document.getElementById('tabs');
const webviewsEl = document.getElementById('webviews');

let tabs = [];
let activeTabId = null;
let nextTabId = 1;

function makeValidUrl(input) {
  try {
    // try as-is
    new URL(input);
    return input;
  } catch (e) {
    // prepend http:// if missing
    try {
      return 'http://' + input;
    } catch (e2) {
      return 'about:blank';
    }
  }
}

function createTab(url = 'https://www.google.com') {
  const id = String(nextTabId++);

  // tab button
  const tabBtn = document.createElement('button');
  tabBtn.className = 'tab';
  tabBtn.dataset.id = id;
  tabBtn.textContent = 'New Tab';

  const closeBtn = document.createElement('span');
  closeBtn.className = 'tab-close';
  closeBtn.textContent = '×';
  tabBtn.appendChild(closeBtn);

  tabsEl.appendChild(tabBtn);

  // webview
  const webview = document.createElement('webview');
  webview.setAttribute('src', url);
  webview.setAttribute('partition', `persist:tab${id}`);
  webview.setAttribute('preload', '');
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

  activateTab(id);
  return id;
}

function activateTab(id) {
  activeTabId = id;
  tabs.forEach(t => {
    const active = t.id === id;
    t.tabBtn.classList.toggle('active', active);
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
