const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('kernelAPI', {
  // Настройки
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  
  // Темы
  getThemes: () => ipcRenderer.invoke('get-themes'),
  setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),
  
  // Быстрые ссылки
  getQuickLinks: () => ipcRenderer.invoke('get-quick-links'),
  addQuickLink: (link) => ipcRenderer.invoke('add-quick-link', link),
  
  // Закладки
  getBookmarks: () => ipcRenderer.invoke('get-bookmarks'),
  addBookmark: (bookmark) => ipcRenderer.invoke('add-bookmark', bookmark),
  
  // История
  getHistory: () => ipcRenderer.invoke('get-history'),
  addHistory: (entry) => ipcRenderer.invoke('add-history', entry),
  
  // Управление окном
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  
  // События
  onThemeChanged: (callback) => ipcRenderer.on('theme-changed', (event, theme) => callback(theme)),
  onNavigate: (callback) => ipcRenderer.on('navigate', (event, url) => callback(url)),
  onNewTab: (callback) => ipcRenderer.on('new-tab', () => callback()),
  onOpenSettings: (callback) => ipcRenderer.on('open-settings', () => callback())
});

contextBridge.exposeInMainWorld('isElectron', true);
