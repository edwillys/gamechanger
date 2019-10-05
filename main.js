// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, dialog, shell } = require('electron')
const fs = require('fs');
const path = require('path')
const { ipcMain } = require('electron')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let gc;
let isMac = process.platform === 'darwin';

const template = [
    // { role: 'appMenu' }
    ...(isMac ? [{
        label: app.getName(),
        submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideothers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' }
        ]
    }] : []),
    // { role: 'fileMenu' }
    {
        label: 'File',
        submenu: [
            {
                label: 'Open',
                accelerator: 'CmdOrCtrl+O',
                click: function () {
                    dialog.showOpenDialog(
                        mainWindow,
                        {
                            properties: ['openFile'],
                            filters: [
                                { name: 'JSON', extensions: ['json'] }
                            ]
                        },
                        function (file) {
                            if (file) {
                                mainWindow.webContents.send('open', file[0]);
                                //var currTitle = mainWindow.getTitle();
                                //mainWindow.setTitle(currTitle.split(' - ')[0] + ' - ' + file);
                            }
                        }
                    )
                }
            },
            {
                label: 'Save',
                accelerator: 'CmdOrCtrl+S',
                click: function () {
                    mainWindow.webContents.send('save');
                    ipcMain.once('save-reply', (event, currFile, currJson) => {
                        if (currFile) {
                            orderAndSave(currFile, currJson);
                        } else {
                            dialog.showSaveDialog(
                                mainWindow,
                                {
                                    defaultPath: app.getPath('documents'),
                                    properties: ['createDirectory'],
                                    filters: [
                                        { name: 'JSON', extensions: ['json'] }
                                    ],
                                },
                                function (file) {
                                    if (file) {
                                        orderAndSave(file, currJson);
                                    }
                                }
                            )
                        }
                    })
                }
            },
            {
                label: 'Save As',
                click: function () {
                    dialog.showSaveDialog(
                        mainWindow,
                        {
                            defaultPath: app.getPath('documents'),
                            properties: ['createDirectory'],
                            filters: [
                                { name: 'JSON', extensions: ['json'] }
                            ],
                        },
                        function (file) {
                            if (file) {
                                mainWindow.webContents.send('saveas');
                                ipcMain.once('saveas-reply', (event, currJson) => {
                                    orderAndSave(file, currJson);
                                })
                            }
                        }
                    )
                }
            },
            isMac ? { role: 'close' } : { role: 'quit' }
        ]
    },
    // { role: 'editMenu' }
    {
        label: 'Edit',
        submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'copy' },
            { role: 'paste' },
            ...(isMac ? [
                { role: 'pasteAndMatchStyle' },
                { role: 'delete' },
                { type: 'separator' },
                {
                    label: 'Speech',
                    submenu: [
                        { role: 'startspeaking' },
                        { role: 'stopspeaking' }
                    ]
                }
            ] : [
                    { role: 'delete' },
                    { type: 'separator' },
                ])
        ]
    },
    // { role: 'viewMenu' }
    {
        label: 'View',
        submenu: [
            { role: 'reload' },
            { role: 'forcereload' },
            { role: 'toggledevtools' },
            { type: 'separator' },
            { type: 'separator' },
            { role: 'togglefullscreen' }
        ]
    },
    // { role: 'windowMenu' }
    {
        label: 'Window',
        submenu: [
            { role: 'minimize' },
            ...(isMac ? [
                { type: 'separator' },
                { role: 'front' },
                { type: 'separator' },
                { role: 'window' }
            ] : [
                    { role: 'close' }
                ])
        ]
    },
    {
        role: 'help',
        submenu: [
            {
                label: 'Learn More',
                click: async () => {
                    await shell.openExternal('https://gamechanger.music-man.com')
                }
            }
        ]
    }
]

function orderAndSave(file, json) {
    orderedJson = {};
    Object.keys(json).sort().forEach(function (key) {
        orderedJson[key] = json[key];
    });
    var jso = JSON.stringify(orderedJson, null, 4);
    //file = file.split(".json")[0] + ".json"
    fs.writeFile(file, jso, (err) => {
        if (err) {
            let options  = {
                type : "error",
                buttons: ["Ok"],
                message: "An error ocurred creating the file " + err.message
            }
            dialog.showMessageBox(options);
        } else {
            // open the file just saved, in order to update things
            // TODO: replace by callback to clean up dirty things
            mainWindow.webContents.send('open', file);
        }
    });
}

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 700,
        minWidth: 1200,
        minHeight: 700,
        icon: 'media/static/icon_logo.png',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true
        }
    })

    // and load the index.html of the app.
    mainWindow.loadFile('app.html');
    mainWindow.maximize();

    // set up menu
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)

    // assign GC variables
    //gc = mainWindow.gc;

    // Open the DevTools.
    //mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) createWindow()
})