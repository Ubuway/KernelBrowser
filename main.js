const { app, BrowserWindow, ipcMain, session, Menu, Tray, nativeTheme } = require('electron');
const path = require('path');
const url = require('url');
const Store = require('electron-store');

const store = new Store({
  defaults: {
    settings: {
      theme: 'gamer',
      searchEngine: 'google',
      homepage: 'about:home',
      adblock: true,
      hardwareAcceleration: true,
      autoUpdate: true,
      startup: true
    },
    themes: {
      office: {
        name: 'Офисная',
        colors: {
          primary: '#0066ff',
          secondary: '#1a1a2e',
          accent: '#00ccff',
          background: '#ffffff',
          text: '#000000'
        }
      },
      home: {
        name: 'Домашняя',
        colors: {
          primary: '#4CAF50',
          secondary: '#2E7D32',
          accent: '#8BC34A',
          background: '#f5f5f5',
          text: '#333333'
        }
      },
      gamer: {
        name: 'Геймерская',
        colors: {
          primary: '#FF1B6B',
          secondary: '#45CAFF',
          accent: '#00FF88',
          background: '#0a0a1a',
          text: '#ffffff'
        }
      },
      dark: {
        name: 'Темная',
        colors: {
          primary: '#0066ff',
          secondary: '#1a1a2e',
          accent: '#00ccff',
          background: '#0a0a1a',
          text: '#ffffff'
        }
      },
      light: {
        name: 'Светлая',
        colors: {
          primary: '#0066ff',
          secondary: '#f0f0f0',
          accent: '#00aaff',
          background: '#ffffff',
          text: '#000000'
        }
      }
    },
    quickLinks: [
      { name: 'YouTube', url: 'https://youtube.com', icon: 'youtube', category: 'entertainment' },
      { name: 'Twitch', url: 'https://twitch.tv', icon: 'twitch', category: 'gaming' },
      { name: 'Discord', url: 'https://discord.com', icon: 'discord', category: 'social' },
      { name: 'Steam', url: 'https://store.steampowered.com', icon: 'steam', category: 'gaming' },
      { name: 'GitHub', url: 'https://github.com', icon: 'github', category: 'development' },
      { name: 'Google Drive', url: 'https://drive.google.com', icon: 'drive', category: 'office' },
      { name: 'Gmail', url: 'https://gmail.com', icon: 'gmail', category: 'office' },
      { name: 'Spotify', url: 'https://spotify.com', icon: 'spotify', category: 'entertainment' }
    ],
    bookmarks: [],
    history: []
  }
});

let mainWindow = null;
let tray = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webviewTag: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icons/icon.png'),
    backgroundColor: '#0a0a1a',
    title: 'Kernel Browser - Powered by Ubuway'
  });

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Автоматически открываем DevTools в режиме разработки
    if (process.env.NODE_ENV === 'development') {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets/icons/icon.png');
  tray = new Tray(iconPath);
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Открыть Kernel', click: () => mainWindow.show() },
    { type: 'separator' },
    { label: 'Новая вкладка', accelerator: 'Ctrl+T', click: () => sendToRenderer('new-tab') },
    { label: 'Новое окно', click: createWindow },
    { type: 'separator' },
    { label: 'Настройки', click: () => sendToRenderer('open-settings') },
    { type: 'separator' },
    { label: 'Выход', role: 'quit' }
  ]);

  tray.setToolTip('Kernel Browser');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
}

function sendToRenderer(channel, data) {
  if (mainWindow) {
    mainWindow.webContents.send(channel, data);
  }
}

function setupIPC() {
  // Настройки
  ipcMain.handle('get-settings', () => store.get('settings'));
  ipcMain.handle('save-settings', (event, settings) => {
    store.set('settings', settings);
    return { success: true };
  });
  
  // Темы
  ipcMain.handle('get-themes', () => store.get('themes'));
  ipcMain.handle('set-theme', (event, themeName) => {
    const settings = store.get('settings');
    settings.theme = themeName;
    store.set('settings', settings);
    sendToRenderer('theme-changed', themeName);
    return { success: true };
  });
  
  // Быстрые ссылки
  ipcMain.handle('get-quick-links', () => store.get('quickLinks'));
  ipcMain.handle('add-quick-link', (event, link) => {
    const links = store.get('quickLinks');
    links.push(link);
    store.set('quickLinks', links);
    return { success: true };
  });
  
  // Закладки
  ipcMain.handle('get-bookmarks', () => store.get('bookmarks'));
  ipcMain.handle('add-bookmark', (event, bookmark) => {
    const bookmarks = store.get('bookmarks');
    bookmarks.push(bookmark);
    store.set('bookmarks', bookmarks);
    return { success: true };
  });
  
  // История
  ipcMain.handle('get-history', () => store.get('history'));
  ipcMain.handle('add-history', (event, entry) => {
    const history = store.get('history');
    history.unshift({
      ...entry,
      timestamp: new Date().toISOString(),
      id: Date.now()
    });
    
    if (history.length > 1000) history.length = 1000;
    store.set('history', history);
    return { success: true };
  });
  
  // Управление окном
  ipcMain.on('window-minimize', () => mainWindow.minimize());
  ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });
  ipcMain.on('window-close', () => mainWindow.close());
  
  // Навигация
  ipcMain.on('navigate-to', (event, url) => {
    sendToRenderer('navigate', url);
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  setupIPC();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});