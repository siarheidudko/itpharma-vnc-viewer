// Modules to control application life and create native browser window
const {app, BrowserWindow, Menu, ipcMain, dialog} = require('electron');
const path = require('path');
const os = require('os');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow, mainMenu, settingsWindow;

function createWindow () {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: 360,
		height: 750,
		resizable: true,
		center: true,
		icon: path.join(__dirname, 'ITPharmaVNCViewer.ico'),
		skipTaskbar: false,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js')
		}
	});

	// and load the index.html of the app.
	mainWindow.loadFile('index.html');

	// Open the DevTools.
	// mainWindow.webContents.openDevTools()

	// Emitted when the window is closed.
	mainWindow.on('closed', function () {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null;
	});
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) createMainMenu();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

mainMenu = Menu.buildFromTemplate([
	{
		label: 'Настройки',
		submenu: [
			{
				label: 'Настройки соединения',
				click: function(){
					mainWindow.webContents.send('openSettingsConnWindow');
				}
			},
			{
				label: 'Настройки синхронизации',
				click: function(){
					mainWindow.webContents.send('openSettingsWindow');
				}
			},
			{
				label: 'Обновить список соединений',
				click: function(){
					mainWindow.webContents.send('reloadConnections');
				}
			},
			{
				label: 'Экспорт настроек',
				click: function(){
					dialog.showSaveDialog(mainWindow, {
						title: 'Экспорт настроек',
						defaultPath: os.homedir(),
						filters: [
							{ name: 'Файлы настроек (*.itpvnc)', extensions: ['itpvnc'] },
							{ name: 'Все файлы', extensions: ['*'] }
						]
					}).then(function(res){
						if(res.filePath) { mainWindow.webContents.send('exportSettings', [res.filePath]); }
					}).catch(function(err){});
				}
			},
			{
				label: 'Импорт настроек',
				click: function(){
					dialog.showOpenDialog(mainWindow, {
						title: 'Импорт настроек',
						defaultPath: os.homedir(),
						filters: [
							{ name: 'Файлы настроек (*.itpvnc)', extensions: ['itpvnc'] },
							{ name: 'Все файлы', extensions: ['*'] }
						],
						properties: ['openFile']
					}).then(function(res){
						if(Array.isArray(res.filePaths) && (res.filePaths.length > 0)) { mainWindow.webContents.send('importSettings', [res.filePaths[0]]); }
					}).catch(function(err){});
				}
			}
		]
	},
	{
		label: 'Прочее',
		submenu: [
			{
				label: 'Запустить VNCViewer',
				click: function(){
					mainWindow.webContents.send('execVNCViewer');
				}
			},
			{
				label: 'О программе',
				click: function(){
					mainWindow.webContents.send('aboutVNCViewer');
				}
			}
		]
	}
]);
Menu.setApplicationMenu(mainMenu);