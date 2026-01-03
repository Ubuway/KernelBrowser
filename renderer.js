// Kernel Browser Renderer - Полная версия
class KernelRenderer {
  constructor() {
    this.tabs = new Map();
    this.currentTabId = null;
    this.tabCounter = 0;
    this.closedTabs = [];
    this.isElectron = typeof kernelAPI !== 'undefined';
    
    this.init();
  }

  async init() {
    await this.setup();
    this.createInitialTab();
    this.hideLoadingScreen();
  }

  async setup() {
    // Загружаем настройки
    this.settings = this.isElectron ? 
      await kernelAPI.getSettings() : 
      this.loadLocalSettings();
    
    // Настраиваем UI
    this.setupUI();
    this.setupEventListeners();
    this.setupTheme();
    this.setupContextMenu();
    
    // Загружаем сохраненные вкладки
    this.loadSavedTabs();
  }

  setupUI() {
    // Добавляем стили для webview/iframe
    const style = document.createElement('style');
    style.textContent = `
      .webview-container {
        flex: 1;
        position: relative;
        overflow: hidden;
      }
      
      webview, .browser-frame {
        width: 100%;
        height: 100%;
        border: none;
        background: white;
      }
      
      webview.hidden, .browser-frame.hidden {
        display: none;
      }
      
      .tab.loading::after {
        content: '';
        position: absolute;
        width: 12px;
        height: 12px;
        border: 2px solid #0066ff;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        right: 30px;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .url-bar-wrapper:focus-within {
        box-shadow: 0 0 0 2px rgba(0, 102, 255, 0.3);
      }
      
      .notification {
        animation: slideIn 0.3s ease;
      }
      
      @keyframes slideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  setupEventListeners() {
    // Управление окном
    document.getElementById('minimizeBtn')?.addEventListener('click', () => 
      this.isElectron ? kernelAPI.minimize() : this.minimizeWeb()
    );
    
    document.getElementById('maximizeBtn')?.addEventListener('click', () => 
      this.isElectron ? kernelAPI.maximize() : this.maximizeWeb()
    );
    
    document.getElementById('closeBtn')?.addEventListener('click', () => 
      this.isElectron ? kernelAPI.close() : this.closeWeb()
    );

    // Навигация
    const urlBar = document.getElementById('urlBar');
    urlBar?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.navigate(urlBar.value);
    });

    urlBar?.addEventListener('focus', () => urlBar.select());
    
    // Кнопки навигации
    document.getElementById('backBtn')?.addEventListener('click', () => this.goBack());
    document.getElementById('forwardBtn')?.addEventListener('click', () => this.goForward());
    document.getElementById('reloadBtn')?.addEventListener('click', () => this.reload());
    document.getElementById('homeBtn')?.addEventListener('click', () => this.goHome());
    document.getElementById('newTabBtn')?.addEventListener('click', () => this.createTab());
    document.getElementById('menuBtn')?.addEventListener('click', (e) => this.showMenu(e));
    document.getElementById('bookmarkBtn')?.addEventListener('click', () => this.toggleBookmark());

    // Горячие клавиши
    document.addEventListener('keydown', (e) => this.handleHotkeys(e));
    
    // Закрытие меню по клику вне его
    document.addEventListener('click', () => this.hideMenu());

    // IPC события (Electron)
    if (this.isElectron) {
      this.setupIPCEvents();
    }
  }

  setupIPCEvents() {
    const events = [
      'navigate', 'create-tab', 'close-tab', 'switch-tab',
      'new-tab', 'close-current-tab', 'restore-tab',
      'reload', 'focus-url', 'go-home',
      'show-bookmarks', 'show-history', 'show-settings'
    ];
    
    events.forEach(event => {
      kernelAPI.on(event, (data) => this.handleIPCEvent(event, data));
    });
  }

  handleIPCEvent(event, data) {
    switch (event) {
      case 'navigate': this.navigate(data); break;
      case 'create-tab': case 'new-tab': this.createTab(data?.url); break;
      case 'close-tab': case 'close-current-tab': this.closeCurrentTab(); break;
      case 'switch-tab': this.switchTab(data); break;
      case 'restore-tab': this.restoreTab(); break;
      case 'reload': this.reload(); break;
      case 'focus-url': this.focusUrlBar(); break;
      case 'go-home': this.goHome(); break;
      case 'show-bookmarks': this.showBookmarks(); break;
      case 'show-history': this.showHistory(); break;
      case 'show-settings': this.showSettings(); break;
    }
  }

  setupTheme() {
    const theme = this.settings?.theme || 'dark';
    document.body.className = `${theme}-theme`;
    localStorage.setItem('theme', theme);
  }

  setupContextMenu() {
    // Контекстное меню для веб-версии
    if (!this.isElectron) {
      document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.showCustomContextMenu(e);
      });
    }
  }

  createInitialTab() {
    const homePage = this.settings?.homePage || 'https://www.google.com';
    this.createTab(homePage, true);
  }

  createTab(url = '', active = true) {
    this.tabCounter++;
    const tabId = `tab-${this.tabCounter}`;
    
    // Создаем элемент вкладки
    const tabElement = this.createTabElement(tabId);
    
    // Создаем webview/iframe
    const browserView = this.isElectron ? 
      this.createWebView(tabId) : 
      this.createIframe(tabId);
    
    // Сохраняем информацию
    const tab = {
      id: tabId,
      element: tabElement,
      view: browserView,
      url: url || '',
      title: 'Новая вкладка',
      favicon: null,
      history: [],
      historyIndex: -1,
      isLoading: false,
      createdAt: Date.now()
    };
    
    this.tabs.set(tabId, tab);
    
    // Загружаем URL
    if (url) {
      this.navigateToURL(tabId, url);
    }
    
    // Активируем
    if (active) {
      this.switchTab(tabId);
    }
    
    this.saveTabs();
    return tabId;
  }

  createTabElement(tabId) {
    const tabElement = document.createElement('div');
    tabElement.className = 'tab';
    tabElement.dataset.tabId = tabId;
    tabElement.innerHTML = `
      <span class="tab-title">Новая вкладка</span>
      <button class="tab-close" title="Закрыть">×</button>
      <div class="tab-indicator"></div>
    `;
    
    // События
    tabElement.addEventListener('click', (e) => {
      if (!e.target.classList.contains('tab-close')) {
        this.switchTab(tabId);
      }
    });
    
    tabElement.querySelector('.tab-close').addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeTab(tabId);
    });
    
    document.getElementById('tabsList').appendChild(tabElement);
    return tabElement;
  }

  createWebView(tabId) {
    const webview = document.createElement('webview');
    webview.id = `webview-${tabId}`;
    webview.className = 'webview';
    webview.partition = `persist:${tabId}`;
    webview.setAttribute('allowpopups', '');
    webview.setAttribute('webpreferences', 'contextIsolation=yes');
    
    // События
    this.setupWebViewEvents(webview, tabId);
    
    document.getElementById('webviewContainer').appendChild(webview);
    return webview;
  }

  createIframe(tabId) {
    const iframe = document.createElement('iframe');
    iframe.id = `iframe-${tabId}`;
    iframe.className = 'browser-frame';
    iframe.sandbox = 'allow-same-origin allow-scripts allow-popups allow-forms';
    iframe.referrerpolicy = 'no-referrer';
    
    // События
    this.setupIframeEvents(iframe, tabId);
    
    document.getElementById('webviewContainer').appendChild(iframe);
    return iframe;
  }

  setupWebViewEvents(webview, tabId) {
    webview.addEventListener('did-start-loading', () => {
      this.onPageLoadStart(tabId);
    });
    
    webview.addEventListener('did-stop-loading', () => {
      this.onPageLoadStop(tabId);
      this.updateTabTitle(tabId, webview.getTitle());
    });
    
    webview.addEventListener('page-title-updated', (e) => {
      this.updateTabTitle(tabId, e.title);
    });
    
    webview.addEventListener('page-favicon-updated', (e) => {
      this.updateTabFavicon(tabId, e.favicons[0]);
    });
    
    webview.addEventListener('did-navigate', (e) => {
      this.updateURLBar(e.url);
      this.saveHistory(tabId, e.url);
    });
    
    webview.addEventListener('new-window', (e) => {
      e.preventDefault();
      this.createTab(e.url, true);
    });
  }

  setupIframeEvents(iframe, tabId) {
    iframe.addEventListener('load', () => {
      this.onPageLoadStop(tabId);
      try {
        const title = iframe.contentDocument?.title || 'Без названия';
        this.updateTabTitle(tabId, title);
        this.updateURLBar(iframe.src);
        this.saveHistory(tabId, iframe.src);
      } catch (e) {
        console.log('Cannot access iframe:', e.message);
      }
    });
    
    iframe.addEventListener('error', () => {
      this.onPageLoadError(tabId);
    });
  }

  navigateToURL(tabId, input) {
    const tab = this.tabs.get(tabId);
    if (!tab) return;
    
    const url = this.parseURL(input);
    if (!url) return;
    
    // Сохраняем в историю
    if (tab.url && tab.url !== url) {
      tab.history.push(tab.url);
      tab.historyIndex = tab.history.length - 1;
    }
    
    tab.url = url;
    tab.isLoading = true;
    
    this.updateTabTitle(tabId, 'Загрузка...');
    this.updateURLBar(url);
    this.updateStatus('Загрузка...');
    
    // Загружаем
    if (this.isElectron) {
      tab.view.loadURL(url);
    } else {
      tab.view.src = url;
    }
  }

  parseURL(input) {
    if (!input || input.trim() === '') return null;
    
    input = input.trim();
    
    // Специальные страницы
    if (input === 'about:blank' || input === 'about:home') {
      return this.settings?.homePage || 'https://www.google.com';
    }
    
    // Уже валидный URL
    if (input.startsWith('http://') || input.startsWith('https://')) {
      try {
        new URL(input);
        return input;
      } catch {
        // Продолжаем парсинг
      }
    }
    
    // Домен без протокола
    if (this.isValidDomain(input)) {
      return `https://${input}`;
    }
    
    // Поисковый запрос
    const searchEngine = this.settings?.searchEngine || 'google';
    const searchURLs = {
      google: 'https://www.google.com/search?q=',
      bing: 'https://www.bing.com/search?q=',
      duckduckgo: 'https://duckduckgo.com/?q=',
      yandex: 'https://yandex.ru/search/?text='
    };
    
    return searchURLs[searchEngine] + encodeURIComponent(input);
  }

  isValidDomain(input) {
    // Простая проверка
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    return domainRegex.test(input) && !input.includes(' ');
  }

  switchTab(tabId) {
    // Скрываем все
    this.tabs.forEach((tab, id) => {
      tab.view.classList.add('hidden');
      tab.element.classList.remove('active');
    });
    
    // Показываем выбранную
    const tab = this.tabs.get(tabId);
    if (tab) {
      tab.view.classList.remove('hidden');
      tab.element.classList.add('active');
      this.currentTabId = tabId;
      
      this.updateURLBar(tab.url);
      this.updateNavButtons();
      this.updatePageTitle(tab.title);
      
      // Фокус
      setTimeout(() => {
        if (this.isElectron) {
          tab.view.focus();
        } else {
          tab.view.contentWindow?.focus();
        }
      }, 50);
    }
  }

  closeTab(tabId) {
    if (this.tabs.size <= 1) {
      this.showNotification('Нельзя закрыть последнюю вкладку', 'warning');
      return;
    }
    
    const tab = this.tabs.get(tabId);
    if (!tab) return;
    
    // Сохраняем для восстановления
    this.closedTabs.push({
      id: tabId,
      url: tab.url,
      title: tab.title,
      timestamp: Date.now()
    });
    
    if (this.closedTabs.length > 10) {
      this.closedTabs.shift();
    }
    
    // Удаляем
    tab.element.remove();
    tab.view.remove();
    this.tabs.delete(tabId);
    
    // Переключаемся
    if (this.currentTabId === tabId) {
      const nextTabId = Array.from(this.tabs.keys())[0];
      if (nextTabId) this.switchTab(nextTabId);
    }
    
    this.saveTabs();
    this.showNotification('Вкладка закрыта');
  }

  // ... остальные методы (goBack, goForward, reload, goHome, etc.)

  updateTabTitle(tabId, title) {
    const tab = this.tabs.get(tabId);
    if (!tab) return;
    
    tab.title = title || 'Без названия';
    
    const titleElement = tab.element.querySelector('.tab-title');
    if (titleElement) {
      titleElement.textContent = title.length > 25 ? 
        title.substring(0, 25) + '...' : title;
    }
    
    if (tabId === this.currentTabId) {
      document.getElementById('pageTitle').textContent = title;
    }
  }

  updateURLBar(url) {
    const urlBar = document.getElementById('urlBar');
    if (urlBar) {
      urlBar.value = url || '';
      urlBar.title = url || '';
    }
  }

  updateNavButtons() {
    if (!this.currentTabId) return;
    
    const tab = this.tabs.get(this.currentTabId);
    if (!tab) return;
    
    const backBtn = document.getElementById('backBtn');
    const forwardBtn = document.getElementById('forwardBtn');
    
    if (backBtn) backBtn.disabled = tab.historyIndex <= 0;
    if (forwardBtn) forwardBtn.disabled = tab.historyIndex >= tab.history.length - 1;
  }

  updatePageTitle(title) {
    const element = document.getElementById('pageTitle');
    if (element) element.textContent = title;
  }

  updateStatus(message, type = 'info') {
    const element = document.getElementById('statusText');
    if (element) {
      element.textContent = message;
      element.className = `status-${type}`;
    }
  }

  showNotification(message, type = 'info') {
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Автоматически удаляем
    setTimeout(() => notification.remove(), 3000);
  }

  handleHotkeys(e) {
    const isCtrl = e.ctrlKey || e.metaKey;
    
    if (isCtrl && e.key === 't') {
      e.preventDefault();
      this.createTab();
    } else if (isCtrl && e.key === 'w') {
      e.preventDefault();
      this.closeCurrentTab();
    } else if (isCtrl && e.key === 'Tab') {
      e.preventDefault();
      this.switchToNextTab();
    } else if (isCtrl && e.shiftKey && e.key === 'Tab') {
      e.preventDefault();
      this.switchToPreviousTab();
    } else if (e.key === 'F5' || (isCtrl && e.key === 'r')) {
      e.preventDefault();
      this.reload();
    } else if (e.altKey && e.key === 'ArrowLeft') {
      e.preventDefault();
      this.goBack();
    } else if (e.altKey && e.key === 'ArrowRight') {
      e.preventDefault();
      this.goForward();
    } else if (isCtrl && e.key === 'l') {
      e.preventDefault();
      this.focusUrlBar();
    }
  }

  switchToNextTab() {
    if (!this.currentTabId || this.tabs.size <= 1) return;
    
    const tabIds = Array.from(this.tabs.keys());
    const currentIndex = tabIds.indexOf(this.currentTabId);
    const nextIndex = (currentIndex + 1) % tabIds.length;
    
    this.switchTab(tabIds[nextIndex]);
  }

  switchToPreviousTab() {
    if (!this.currentTabId || this.tabs.size <= 1) return;
    
    const tabIds = Array.from(this.tabs.keys());
    const currentIndex = tabIds.indexOf(this.currentTabId);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : tabIds.length - 1;
    
    this.switchTab(tabIds[prevIndex]);
  }

  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    const app = document.getElementById('app');
    
    setTimeout(() => {
      if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
          loadingScreen.style.display = 'none';
          if (app) app.style.display = 'block';
        }, 300);
      }
    }, 500);
  }

  // Web-specific methods
  minimizeWeb() {
    document.body.classList.add('minimized');
    this.showNotification('Веб-версия: Минимизировано');
  }

  maximizeWeb() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }

  closeWeb() {
    if (confirm('Закрыть Kernel Browser?')) {
      document.body.innerHTML = `
        <div style="
          display: flex; 
          justify-content: center; 
          align-items: center; 
          height: 100vh; 
          background: #000; 
          color: white;
          flex-direction: column;
          gap: 20px;
        ">
          <h1 style="color: #0066ff;">Kernel Browser закрыт</h1>
          <p>Обновите страницу чтобы перезапустить</p>
        </div>
      `;
    }
  }

  loadLocalSettings() {
    return {
      theme: localStorage.getItem('theme') || 'dark',
      searchEngine: localStorage.getItem('searchEngine') || 'google',
      homePage: localStorage.getItem('homePage') || 'https://www.google.com',
      adBlock: localStorage.getItem('adBlock') !== 'false'
    };
  }

  saveTabs() {
    const tabsData = Array.from(this.tabs.values()).map(tab => ({
      id: tab.id,
      url: tab.url,
      title: tab.title,
      history: tab.history,
      historyIndex: tab.historyIndex
    }));
    
    localStorage.setItem('kernel_tabs', JSON.stringify(tabsData));
  }

  loadSavedTabs() {
    try {
      const saved = JSON.parse(localStorage.getItem('kernel_tabs') || '[]');
      saved.slice(1).forEach(tabData => {
        this.createTab(tabData.url, false);
      });
    } catch (e) {
      console.log('Failed to load tabs:', e);
    }
  }

  showCustomContextMenu(e) {
    const menu = document.createElement('div');
    menu.className = 'custom-context-menu';
    menu.style.cssText = `
      position: fixed;
      left: ${e.clientX}px;
      top: ${e.clientY}px;
      background: var(--secondary-bg);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 5px 0;
      z-index: 10000;
      min-width: 150px;
    `;
    
    menu.innerHTML = `
      <div class="menu-item" data-action="back">Назад</div>
      <div class="menu-item" data-action="forward">Вперед</div>
      <div class="menu-item" data-action="reload">Обновить</div>
      <hr>
      <div class="menu-item" data-action="new-tab">Новая вкладка</div>
      <div class="menu-item" data-action="close-tab">Закрыть вкладку</div>
    `;
    
    document.body.appendChild(menu);
    
    // Обработчики
    menu.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('click', () => {
        const action = item.dataset.action;
        this.handleContextMenuAction(action);
        menu.remove();
      });
    });
    
    // Закрыть при клике вне
    setTimeout(() => {
      const closeHandler = () => {
        menu.remove();
        document.removeEventListener('click', closeHandler);
      };
      document.addEventListener('click', closeHandler);
    }, 100);
  }

  handleContextMenuAction(action) {
    switch (action) {
      case 'back': this.goBack(); break;
      case 'forward': this.goForward(); break;
      case 'reload': this.reload(); break;
      case 'new-tab': this.createTab(); break;
      case 'close-tab': this.closeCurrentTab(); break;
    }
  }
}

// Запуск
document.addEventListener('DOMContentLoaded', () => {
  window.kernel = new KernelRenderer();
});