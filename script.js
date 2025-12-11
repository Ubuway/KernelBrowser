// Kernel Browser - Powered by Ubuway
// УПРОЩЕННАЯ ВЕРСИЯ БЕЗ PWA

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const browserState = {
    tabs: [],
    currentTabId: null,
    tabCounter: 0,
    searchEngine: "bing"
};

const searchEngines = {
    bing: "https://www.bing.com/search?q=",
    duckduckgo: "https://duckduckgo.com/?q=",
    google: "https://www.google.com/search?q=",
    yandex: "https://yandex.ru/search/?text="
};

const quickLinks = [
    { name: "YouTube", url: "https://www.youtube.com", icon: "fab fa-youtube", color: "#FF0000" },
    { name: "Bing", url: "https://bing.com", icon: "fab fa-microsoft", color: "#008373" },
    { name: "Google", url: "https://google.com", icon: "fab fa-google", color: "#4285F4" },
    { name: "VK", url: "https://vk.com", icon: "fab fa-vk", color: "#0077FF" },
    { name: "GitHub", url: "https://github.com", icon: "fab fa-github", color: "#181717" },
    { name: "Яндекс", url: "https://yandex.ru", icon: "fab fa-yandex", color: "#FF0000" }
];

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Kernel Browser запускается...');
    
    // Быстрая загрузка - убираем таймаут
    const loadingScreen = document.getElementById('loadingScreen');
    const browserContainer = document.getElementById('browserContainer');
    
    // Сразу создаем первую вкладку
    createNewTab();
    setupEventListeners();
    
    // Скрываем загрузку через 500мс (вместо 1500)
    setTimeout(function() {
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                if (browserContainer) {
                    browserContainer.style.display = 'flex';
                }
                updateStatus('Браузер готов');
            }, 300);
        }
    }, 500);
    
    // Загружаем настройки
    const savedEngine = localStorage.getItem('kernel-search-engine');
    if (savedEngine && searchEngines[savedEngine]) {
        browserState.searchEngine = savedEngine;
        const select = document.getElementById('searchEngineSelect');
        if (select) select.value = savedEngine;
    }
});

function setupEventListeners() {
    const urlInput = document.getElementById('urlInput');
    
    if (urlInput) {
        urlInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                navigateCurrentTab(this.value);
            }
        });
        
        setTimeout(() => {
            if (!isMobile) urlInput.focus();
        }, 100);
    }
    
    // Мобильные жесты
    if (isMobile) {
        setupMobileGestures();
    }
    
    // Горячие клавиши
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 't') {
            e.preventDefault();
            createNewTab();
        }
        if (e.ctrlKey && e.key === 'w') {
            e.preventDefault();
            closeCurrentTab();
        }
        if (e.ctrlKey && e.key === 'Tab') {
            e.preventDefault();
            switchToNextTab();
        }
        if (e.key === 'F5') {
            e.preventDefault();
            reloadCurrentTab();
        }
    });
}

function setupMobileGestures() {
    // Свайп по вкладкам
    let startX = 0;
    const tabsContainer = document.getElementById('tabsContainer');
    
    if (tabsContainer) {
        tabsContainer.addEventListener('touchstart', function(e) {
            startX = e.touches[0].clientX;
        });
        
        tabsContainer.addEventListener('touchend', function(e) {
            const endX = e.changedTouches[0].clientX;
            const diff = startX - endX;
            
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    switchToNextTab();
                } else {
                    switchToPrevTab();
                }
            }
        });
    }
}

// ОСНОВНЫЕ ФУНКЦИИ (остаются как были, но без PWA)

function createNewTab(url = '', title = 'Новая вкладка') {
    browserState.tabCounter++;
    const tabId = browserState.tabCounter;
    
    const newTab = {
        id: tabId,
        title: title,
        url: url,
        history: [],
        historyIndex: -1,
        isLoading: false,
        isStartPage: !url
    };
    
    browserState.tabs.push(newTab);
    
    if (browserState.currentTabId === null) {
        browserState.currentTabId = tabId;
    }
    
    createTabElement(tabId, title);
    createTabContent(tabId);
    
    if (url) {
        loadUrlInTab(tabId, url);
    }
    
    switchToTab(tabId);
    updateStatus('Новая вкладка создана');
    return tabId;
}

function createTabElement(tabId, title) {
    const tabsContainer = document.getElementById('tabsContainer');
    if (!tabsContainer) return;
    
    const tabElement = document.createElement('div');
    tabElement.className = 'tab';
    tabElement.dataset.tabId = tabId;
    tabElement.innerHTML = `
        <span class="tab-title">${title}</span>
        <button class="tab-close" onclick="closeTab(${tabId})">×</button>
    `;
    
    tabElement.addEventListener('click', function(e) {
        if (!e.target.classList.contains('tab-close')) {
            switchToTab(tabId);
        }
    });
    
    tabsContainer.appendChild(tabElement);
    return tabElement;
}

function createTabContent(tabId) {
    const contentContainer = document.getElementById('contentContainer');
    if (!contentContainer) return;
    
    const tabContent = document.createElement('div');
    tabContent.className = 'tab-content';
    tabContent.id = `tabContent-${tabId}`;
    
    const startPage = document.createElement('div');
    startPage.className = 'start-page';
    startPage.id = `startPage-${tabId}`;
    startPage.innerHTML = `
        <h1>Kernel Browser</h1>
        <p class="powered-by">Powered by Ubuway</p>
        
        <div class="search-container">
            <input type="text" 
                   placeholder="Введите адрес или поисковый запрос..." 
                   id="searchInput-${tabId}"
                   autocomplete="off">
            <button onclick="searchInTab(${tabId})">
                <i class="fas fa-search"></i> Поиск
            </button>
        </div>
        
        <div class="quick-links">
            <h3><i class="fas fa-rocket"></i> Быстрые ссылки</h3>
            <div class="links-grid" id="quickLinks-${tabId}"></div>
        </div>
    `;
    
    const searchInput = startPage.querySelector(`#searchInput-${tabId}`);
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchInTab(tabId);
            }
        });
    }
    
    const browserFrame = document.createElement('iframe');
    browserFrame.className = 'browser-frame';
    browserFrame.id = `browserFrame-${tabId}`;
    browserFrame.style.display = 'none';
    browserFrame.sandbox = "allow-same-origin allow-scripts allow-popups allow-forms";
    browserFrame.referrerpolicy = "no-referrer";
    browserFrame.allow = "fullscreen";
    
    browserFrame.addEventListener('load', function() {
        onFrameLoad(tabId);
    });
    
    browserFrame.addEventListener('error', function() {
        onFrameError(tabId);
    });
    
    tabContent.appendChild(startPage);
    tabContent.appendChild(browserFrame);
    contentContainer.appendChild(tabContent);
    
    // Заполняем быстрые ссылки
    const quickLinksContainer = document.getElementById(`quickLinks-${tabId}`);
    if (quickLinksContainer) {
        quickLinksContainer.innerHTML = '';
        quickLinks.forEach(link => {
            const linkElement = document.createElement('div');
            linkElement.className = 'link';
            linkElement.innerHTML = `
                <i class="${link.icon}" style="color: ${link.color};"></i>
                <span>${link.name}</span>
            `;
            
            linkElement.addEventListener('click', function() {
                navigateInTab(tabId, link.url);
            });
            
            quickLinksContainer.appendChild(linkElement);
        });
    }
}

function switchToTab(tabId) {
    const tab = browserState.tabs.find(t => t.id === tabId);
    if (!tab) return;
    
    browserState.currentTabId = tabId;
    
    // Обновляем UI
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    const tabElement = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
    const tabContent = document.getElementById(`tabContent-${tabId}`);
    
    if (tabElement) tabElement.classList.add('active');
    if (tabContent) tabContent.classList.add('active');
    
    // Обновляем URL-бар
    const urlInput = document.getElementById('urlInput');
    if (urlInput) {
        urlInput.value = tab.url || '';
    }
    
    updateNavButtons();
    updatePageTitle(tab.title);
    updateStatus('Активна: ' + tab.title);
}

function switchToNextTab() {
    const tabs = browserState.tabs;
    if (tabs.length <= 1) return;
    
    const currentIndex = tabs.findIndex(t => t.id === browserState.currentTabId);
    const nextIndex = (currentIndex + 1) % tabs.length;
    
    switchToTab(tabs[nextIndex].id);
}

function switchToPrevTab() {
    const tabs = browserState.tabs;
    if (tabs.length <= 1) return;
    
    const currentIndex = tabs.findIndex(t => t.id === browserState.currentTabId);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
    
    switchToTab(tabs[prevIndex].id);
}

function closeTab(tabId) {
    if (browserState.tabs.length <= 1) {
        alert('Нельзя закрыть последнюю вкладку');
        return;
    }
    
    const tabIndex = browserState.tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;
    
    browserState.tabs.splice(tabIndex, 1);
    
    // Удаляем из DOM
    const tabElement = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
    const tabContent = document.getElementById(`tabContent-${tabId}`);
    
    if (tabElement) tabElement.remove();
    if (tabContent) tabContent.remove();
    
    // Переключаемся на другую вкладку
    if (browserState.currentTabId === tabId) {
        const newTabId = tabIndex > 0 ? browserState.tabs[tabIndex - 1].id : browserState.tabs[0].id;
        switchToTab(newTabId);
    }
    
    updateStatus('Вкладка закрыта');
}

function closeCurrentTab() {
    if (browserState.currentTabId) {
        closeTab(browserState.currentTabId);
    }
}

function navigateCurrentTab(input) {
    if (!browserState.currentTabId) return;
    navigateInTab(browserState.currentTabId, input);
}

function navigateInTab(tabId, input) {
    const tab = browserState.tabs.find(t => t.id === tabId);
    if (!tab) return;
    
    const url = parseInput(input);
    
    if (tab.url && tab.url !== url) {
        tab.history.push(tab.url);
        tab.historyIndex = tab.history.length - 1;
    }
    
    tab.url = url;
    tab.isStartPage = false;
    tab.isLoading = true;
    
    updateTabTitle(tabId, 'Загрузка...');
    updateUrlBar(url);
    updateStatus('Загрузка: ' + getDomain(url));
    
    loadUrlInTab(tabId, url);
}

function parseInput(input) {
    if (!input || input.trim() === '') return '';
    
    input = input.trim();
    
    if (input === 'about:blank' || input === 'about:home') return '';
    
    if (isValidUrl(input)) {
        if (!input.startsWith('http://') && !input.startsWith('https://')) {
            return 'https://' + input;
        }
        return input;
    }
    
    return searchEngines[browserState.searchEngine] + encodeURIComponent(input);
}

function isValidUrl(string) {
    if (string.includes(' ')) return false;
    
    try {
        new URL(string);
        return true;
    } catch {
        return /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(string);
    }
}

function loadUrlInTab(tabId, url) {
    const tab = browserState.tabs.find(t => t.id === tabId);
    if (!tab) return;
    
    const startPage = document.getElementById(`startPage-${tabId}`);
    const browserFrame = document.getElementById(`browserFrame-${tabId}`);
    
    if (!startPage || !browserFrame) return;
    
    if (!url || url === '') {
        startPage.style.display = 'flex';
        browserFrame.style.display = 'none';
        browserFrame.src = 'about:blank';
        tab.isStartPage = true;
        updateTabTitle(tabId, 'Новая вкладка');
        return;
    }
    
    startPage.style.display = 'none';
    browserFrame.style.display = 'block';
    
    try {
        browserFrame.src = url;
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        showErrorPage(tabId, url);
    }
}

function onFrameLoad(tabId) {
    const tab = browserState.tabs.find(t => t.id === tabId);
    if (!tab) return;
    
    tab.isLoading = false;
    
    try {
        const browserFrame = document.getElementById(`browserFrame-${tabId}`);
        const title = browserFrame.contentDocument?.title || getDomain(tab.url);
        tab.title = title || 'Без названия';
        
        updateTabTitle(tabId, title);
        updatePageTitle(title);
        updateStatus('Загружено: ' + getDomain(tab.url));
        
    } catch (error) {
        const domain = getDomain(tab.url);
        tab.title = domain;
        updateTabTitle(tabId, domain);
        updatePageTitle(domain);
        updateStatus('Загружено: ' + domain);
    }
    
    updateNavButtons();
}

function onFrameError(tabId) {
    const tab = browserState.tabs.find(t => t.id === tabId);
    if (!tab) return;
    
    tab.isLoading = false;
    showErrorPage(tabId, tab.url);
    updateStatus('Ошибка загрузки');
}

function showErrorPage(tabId, url) {
    const browserFrame = document.getElementById(`browserFrame-${tabId}`);
    if (!browserFrame) return;
    
    browserFrame.srcdoc = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 40px;
                    text-align: center;
                    background: #f5f5f5;
                    margin: 0;
                    height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .error-box {
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.1);
                    max-width: 500px;
                }
                h2 { color: #ff4444; margin-bottom: 20px; }
                .url { 
                    background: #f0f0f0; 
                    padding: 10px; 
                    border-radius: 5px; 
                    margin: 15px 0;
                    word-break: break-all;
                }
                .btn {
                    display: inline-block;
                    background: #0066ff;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 5px;
                    text-decoration: none;
                    margin: 10px 5px;
                    border: none;
                    cursor: pointer;
                    font-size: 16px;
                }
                .btn:hover {
                    background: #0055dd;
                }
            </style>
        </head>
        <body>
            <div class="error-box">
                <h2>⚠️ Не удалось загрузить страницу</h2>
                <div class="url">${url}</div>
                
                <div>
                    <button class="btn" onclick="window.open('${url}', '_blank')">
                        Открыть в новой вкладке
                    </button>
                    <button class="btn" onclick="window.history.back()">
                        Назад
                    </button>
                </div>
            </div>
        </body>
        </html>
    `;
}

function getDomain(url) {
    try {
        if (!url) return '';
        const urlObj = new URL(url.startsWith('http') ? url : 'https://' + url);
        return urlObj.hostname.replace('www.', '');
    } catch {
        return url || '';
    }
}

function searchInTab(tabId) {
    const searchInput = document.getElementById(`searchInput-${tabId}`);
    if (!searchInput) return;
    
    const query = searchInput.value.trim();
    if (!query) return;
    
    navigateInTab(tabId, query);
}

function searchCurrent() {
    const urlInput = document.getElementById('urlInput');
    if (!urlInput) return;
    
    navigateCurrentTab(urlInput.value);
}

function goBack() {
    const tab = browserState.tabs.find(t => t.id === browserState.currentTabId);
    if (!tab || tab.historyIndex < 0) return;
    
    tab.historyIndex--;
    const url = tab.history[tab.historyIndex];
    
    if (url) {
        navigateInTab(tab.id, url);
    }
    
    updateNavButtons();
}

function goForward() {
    const tab = browserState.tabs.find(t => t.id === browserState.currentTabId);
    if (!tab || tab.historyIndex >= tab.history.length - 1) return;
    
    tab.historyIndex++;
    const url = tab.history[tab.historyIndex];
    
    if (url) {
        navigateInTab(tab.id, url);
    }
    
    updateNavButtons();
}

function reload() {
    const tab = browserState.tabs.find(t => t.id === browserState.currentTabId);
    if (!tab || !tab.url) return;
    
    const browserFrame = document.getElementById(`browserFrame-${tab.id}`);
    if (browserFrame && browserFrame.src) {
        browserFrame.src = browserFrame.src;
        updateStatus('Обновление...');
        tab.isLoading = true;
    }
}

function reloadCurrentTab() {
    reload();
}

function goHome() {
    const tab = browserState.tabs.find(t => t.id === browserState.currentTabId);
    if (!tab) return;
    
    navigateInTab(tab.id, '');
    updateStatus('Домашняя страница');
}

function updateTabTitle(tabId, title) {
    const tabElement = document.querySelector(`.tab[data-tab-id="${tabId}"] .tab-title`);
    if (tabElement) {
        tabElement.textContent = title.length > 20 ? title.substring(0, 20) + '...' : title;
    }
    
    const tab = browserState.tabs.find(t => t.id === tabId);
    if (tab) {
        tab.title = title;
    }
}

function updateUrlBar(url) {
    const urlInput = document.getElementById('urlInput');
    if (urlInput) {
        urlInput.value = url || '';
    }
}

function updateNavButtons() {
    const tab = browserState.tabs.find(t => t.id === browserState.currentTabId);
    if (!tab) return;
    
    const backBtn = document.getElementById('backBtn');
    const forwardBtn = document.getElementById('forwardBtn');
    
    if (backBtn) backBtn.disabled = tab.historyIndex < 0;
    if (forwardBtn) forwardBtn.disabled = tab.historyIndex >= tab.history.length - 1;
}

function updatePageTitle(title) {
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = title || 'Kernel Browser';
    }
}

function updateStatus(message) {
    const statusText = document.getElementById('statusText');
    if (statusText) {
        statusText.textContent = message;
        
        // Автоматически очищаем через 3 секунды
        if (message !== 'Готов' && message !== 'Браузер готов') {
            setTimeout(() => {
                if (statusText.textContent === message) {
                    statusText.textContent = 'Готов';
                }
            }, 3000);
        }
    }
}

function changeSearchEngine(engine) {
    if (searchEngines[engine]) {
        browserState.searchEngine = engine;
        localStorage.setItem('kernel-search-engine', engine);
        updateStatus('Поисковик: ' + engine);
    }
}

// УПРОЩЕННЫЕ ФУНКЦИИ ДЛЯ ВЕБ-ВЕРСИИ
function minimize() {
    updateStatus('Минимизировано (веб-версия)');
}

function maximize() {
    updateStatus('Максимизировано (веб-версия)');
}

function closeApp() {
    if (confirm('Закрыть Kernel Browser?')) {
        document.body.innerHTML = `
            <div style="
                display: flex; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                background: #0a0a1a; 
                color: white;
                flex-direction: column;
                gap: 20px;
            ">
                <h1 style="color: #00ccff;">
                    <i class="fas fa-bolt"></i> Kernel Browser закрыт
                </h1>
                <p>Обновите страницу чтобы перезапустить</p>
            </div>
        `;
    }
}