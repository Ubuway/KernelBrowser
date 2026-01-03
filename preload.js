const { contextBridge, ipcRenderer } = require('electron');

// Безопасный API для рендерера
const kernelAPI = {
  // Управление окном
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  
  // Навигация
  navigate: (url) => ipcRenderer.send('navigate-to', url),
  reload: () => ipcRenderer.send('reload'),
  goBack: () => ipcRenderer.send('go-back'),
  goForward: () => ipcRenderer.send('go-forward'),
  goHome: () => ipcRenderer.send('go-home'),
  
  // Вкладки
  createTab: (url) => ipcRenderer.send('create-tab', { url }),
  closeTab: (tabId) => ipcRenderer.send('close-tab', tabId),
  switchTab: (tabId) => ipcRenderer.send('switch-tab', tabId),
  
  // Настройки
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  
  // Закладки
  getBookmarks: () => ipcRenderer.invoke('get-bookmarks'),
  saveBookmark: (bookmark) => ipcRenderer.invoke('save-bookmark', bookmark),
  
  // История
  addHistory: (entry) => ipcRenderer.invoke('add-history', entry),
  
  // Диалоги
  showDialog: (options) => ipcRenderer.invoke('show-dialog', options),
  
  // Внешние ссылки
  openExternal: (url) => ipcRenderer.send('open-external', url),
  
  // События
  on: (channel, callback) => {
    const validChannels = [
      'navigate', 'create-tab', 'close-tab', 'switch-tab',
      'new-tab', 'close-current-tab', 'restore-tab',
      'reload', 'focus-url', 'go-home',
      'show-bookmarks', 'show-history', 'show-settings'
    ];
    
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },
  
  // Утилиты
  getPlatform: () => process.platform,
  getVersion: () => process.versions,
  isDev: () => process.argv.includes('--dev')
};

// Экспортируем API
contextBridge.exposeInMainWorld('kernelAPI', kernelAPI);
contextBridge.exposeInMainWorld('isElectron', true);