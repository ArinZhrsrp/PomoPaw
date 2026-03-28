const path = require("node:path");
const { app, BrowserWindow, ipcMain, screen } = require("electron");

function withSenderWindow(event, callback) {
  const window = BrowserWindow.fromWebContents(event.sender);

  if (window && !window.isDestroyed()) {
    callback(window);
  }
}

function createWindow() {
  const { workAreaSize } = screen.getPrimaryDisplay();
  const width = Math.max(600, Math.round(workAreaSize.width * 0.31));
  const height = Math.max(470, Math.round(workAreaSize.height * 0.29));

  const window = new BrowserWindow({
    width,
    height,
    minWidth: 600,
    minHeight: 460,
    frame: false,
    maximizable: false,
    fullscreenable: false,
    autoHideMenuBar: true,
    backgroundColor: "#fffafb",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  window.removeMenu();
  window.loadFile("app.html");
  // window.webContents.openDevTools();
}

ipcMain.on("window:minimize", (event) => {
  withSenderWindow(event, (window) => {
    window.minimize();
  });
});

ipcMain.on("window:close", (event) => {
  withSenderWindow(event, (window) => {
    window.close();
  });
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
