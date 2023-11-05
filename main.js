//npx electronmon for auto-refresh
const path = require("path");
const os = require("os");
const fs = require("fs");
const resizeImg = require('resize-img')
const { app, BrowserWindow, Menu, ipcMain, shell } = require("electron");

process.env.NODE_ENV = 'production'
const isDev = process.env.NODE_ENV !== "production";
const isMac = process.platform === "darwin";

let mainWindow

// создает главное окно
const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    title: "Image resizer app",
    width: isDev ? 1000 : 500,
    height: 600,
    webPreferences: {
      // 2 строки для интеграции скриптов из preload.js
      contextIsolation: true,
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  //открыть консоль разраба, если в режиме разработки
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.loadFile(path.join(__dirname, "./renderer/index.html"));
};

//открыть второе окно("about")
const createAboutWindow = () => {
  const aboutWindow = new BrowserWindow({
    title: " About image resizer app",
    width: 300,
    height: 300,
  });

  aboutWindow.loadFile(path.join(__dirname, "./renderer/about.html"));
};

//Происходит после запуска приложения
app.whenReady().then(() => {
  createMainWindow();

  // применить кастомное меню
  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);

  //убрать из памяти mainWidnow по закрытию
  mainWindow.on('closed', () => (mainWindow = null))

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

//шаблон меню
const menu = [
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            {
              label: "About",
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
  {
    role: "fileMenu",
  },
  ...(!isMac
    ? [
        {
          label: "Help",
          submenu: [
            {
              label: "About",
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
];

//Ответ на ipcRenderer
ipcMain.on("image: resize", (e, options) => {
  options.dest = path.join(os.homedir(), "resultOfImageResizerApp");
  resizeImage(options);
});

  const resizeImage =  async ({imgPath, width, height, dest}) => {
  try {
    const newPath = await resizeImg(fs.readFileSync(imgPath), {
      width: +width,
      height: +height
    })
    // для создания имени изображения
    const filename = path.basename(imgPath)

    //создание папки назначения, если ее не существует
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest)
    }

    //создание файла в папке назначения
    fs.writeFileSync(path.join(dest, filename), newPath)
    mainWindow.webContents.send('image:done')

    //автооткрытие папки назначения
    shell.openPath(dest)
  } catch (error) {
    console.log(error)
  }
}

app.on("window-all-closed", () => {
  if (!isMac) {
    app.quit();
  }
});
