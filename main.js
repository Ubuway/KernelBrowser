const { app, BrowserWindow, ipcMain, session, Menu, Tray, shell, dialog, globalShortcut } = require('electron');
const path = require('path');
const url = require('url');
const Store = require('electron-store');

// Хранилище настроек
const store = new Store({
  defaults: {
    windowBounds: { width: 1200, height: 800 },
    homePage: 'https://www.google.com',
    searchEngine: 'google',
    theme: 'dark',
    adBlock: true,
    hardwareAcceleration: true,
    tabs: [],
    bookmarks: [],
    history: []
  }
});

class KernelBrowser {
  constructor() {
    this.mainWindow = null;
    this.tray = null;
    this.init();
  }

  init() {
    app.whenReady().then(() => {
      this.createWindow();
      this.createTray();
      this.setupIPC();
      this.setupGlobalShortcuts();
      this.setupSession();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });

    app.on('before-quit', () => {
      this.saveWindowState();
    });
  }

  createWindow() {
    const { width, height } = store.get('windowBounds');

    this.mainWindow = new BrowserWindow({
      width,
      height,
      minWidth: 800,
      minHeight: 600,
      show: false,
      frame: false,
      titleBarStyle: 'hidden',
      backgroundColor: '#000000',
      icon: path.join(__dirname, 'assets/icon.png'),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webviewTag: true,
        preload: path.join(__dirname, 'preload.js'),
        partition: 'persist:main',
        enableRemoteModule: false,
        spellcheck: true
      }
    });

    // Загружаем index.html
    this.mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true
    }));

    // События окна
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
      if (process.argv.includes('--dev')) {
        this.mainWindow.webContents.openDevTools({ mode: 'detach' });
      }
    });

    this.mainWindow.on('resize', () => this.saveWindowState());
    this.mainWindow.on('move', () => this.saveWindowState());
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Обработка новых окон
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      this.mainWindow.webContents.send('create-tab', { url, active: true });
      return { action: 'deny' };
    });

    // Навигация
    this.mainWindow.webContents.on('will-navigate', (event, url) => {
      console.log('Navigation:', url);
    });
  }

  saveWindowState() {
    if (this.mainWindow) {
      const bounds = this.mainWindow.getBounds();
      store.set('windowBounds', bounds);
    }
  }

  createTray() {
    if (process.platform === 'darwin' || process.platform === 'win32') {
      const iconPath = path.join(__dirname, 'assets/icon.png');
      this.tray = new Tray(iconPath);
      
      const contextMenu = Menu.buildFromTemplate([
        { label: 'Открыть Kernel', click: () => this.mainWindow.show() },
        { type: 'separator' },
        { label: 'Новая вкладка', accelerator: 'CmdOrCtrl+T', click: () => this.mainWindow.webContents.send('new-tab') },
        { label: 'Новое окно', click: () => new KernelBrowser() },
        { type: 'separator' },
        { label: 'Закладки', click: () => this.mainWindow.webContents.send('show-bookmarks') },
        { label: 'История', click: () => this.mainWindow.webContents.send('show-history') },
        { type: 'separator' },
        { label: 'Настройки', click: () => this.mainWindow.webContents.send('show-settings') },
        { type: 'separator' },
        { label: 'Выход', role: 'quit' }
      ]);

      this.tray.setToolTip('Kernel Browser');
      this.tray.setContextMenu(contextMenu);
      this.tray.on('click', () => this.mainWindow.show());
    }
  }

  setupIPC() {
    // Управление окном
    ipcMain.on('window-minimize', () => this.mainWindow.minimize());
    ipcMain.on('window-maximize', () => {
      if (this.mainWindow.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow.maximize();
      }
    });
    ipcMain.on('window-close', () => this.mainWindow.close());

    // Навигация
    ipcMain.on('navigate-to', (event, url) => {
      this.mainWindow.webContents.send('navigate', url);
    });

    // Вкладки
    ipcMain.on('create-tab', (event, data) => {
      this.mainWindow.webContents.send('create-tab', data);
    });

    ipcMain.on('close-tab', (event, tabId) => {
      this.mainWindow.webContents.send('close-tab', tabId);
    });

    // Настройки
    ipcMain.handle('get-settings', () => store.get());
    ipcMain.handle('save-settings', (event, settings) => {
      store.set(settings);
      return { success: true };
    });

    // Закладки
    ipcMain.handle('get-bookmarks', () => store.get('bookmarks'));
    ipcMain.handle('save-bookmark', (event, bookmark) => {
      const bookmarks = store.get('bookmarks');
      bookmarks.push(bookmark);
      store.set('bookmarks', bookmarks);
      return { success: true };
    });

    // История
    ipcMain.handle('add-history', (event, entry) => {
      const history = store.get('history');
      history.unshift(entry);
      if (history.length > 1000) history.length = 1000;
      store.set('history', history);
      return { success: true };
    });

    // Диалоги
    ipcMain.handle('show-dialog', async (event, options) => {
      const result = await dialog.showMessageBox(this.mainWindow, options);
      return result;
    });

    // Открыть в браузере по умолчанию
    ipcMain.on('open-external', (event, url) => {
      shell.openExternal(url);
    });
  }

  setupGlobalShortcuts() {
    app.on('ready', () => {
      globalShortcut.register('CommandOrControl+T', () => {
        this.mainWindow.webContents.send('new-tab');
      });
      globalShortcut.register('CommandOrControl+W', () => {
        this.mainWindow.webContents.send('close-current-tab');
      });
      globalShortcut.register('CommandOrControl+Shift+T', () => {
        this.mainWindow.webContents.send('restore-tab');
      });
      globalShortcut.register('F5', () => {
        this.mainWindow.webContents.send('reload');
      });
      globalShortcut.register('CommandOrControl+R', () => {
        this.mainWindow.webContents.send('reload');
      });
      globalShortcut.register('CommandOrControl+L', () => {
        this.mainWindow.webContents.send('focus-url');
      });
      globalShortcut.register('CommandOrControl+H', () => {
        this.mainWindow.webContents.send('go-home');
      });
    });

    app.on('will-quit', () => {
      globalShortcut.unregisterAll();
    });
  }

  setupSession() {
    const mainSession = session.fromPartition('persist:main');
    
    // Настройки безопасности
    mainSession.setPermissionRequestHandler((webContents, permission, callback) => {
      const allowedPermissions = ['media', 'geolocation', 'notifications', 'midiSysex'];
      callback(allowedPermissions.includes(permission));
    });

    // Блокировка рекламы
    if (store.get('adBlock')) {
      mainSession.webRequest.onBeforeRequest((details, callback) => {
        const adDomains = [
          'doubleclick.net',
          'googleads.g.doubleclick.net',
          'googlesyndication.com',
          'ads.google.com',
          'pagead2.googlesyndication.com',
          'adservice.google.com',
          'adsystem.com',
          'adnxs.com',
          'amazon-adsystem.com'
        ];
        
        if (adDomains.some(domain => details.url.includes(domain))) {
          callback({ cancel: true });
        } else {
          callback({ cancel: false });
        }
      });
    }

    // User-Agent
    mainSession.webRequest.onBeforeSendHeaders((details, callback) => {
      details.requestHeaders['User-Agent'] = 
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Kernel/1.0';
      callback({ requestHeaders: details.requestHeaders });
    });
  }
}

// Запуск
app.commandLine.appendSwitch('enable-features', 'HardwareMediaKeyHandling');
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
app.commandLine.appendSwitch('enable-unsafe-webgpu');

new KernelBrowser();