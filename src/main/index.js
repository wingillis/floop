'use strict'

import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'
import worker from './lib/worker'
import store from '../renderer/store'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = path.join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
let database, userConfig, workerID

const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 563,
    useContentSize: true,
    width: 1200,
    webPreferences: {
      nodeIntegration: true
    }
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
    clearInterval(workerID)
    database.close()
  })

  let configPath = path.resolve(path.join(__dirname, '..', '..', 'config.json'))
  userConfig = JSON.parse(fs.readFileSync(configPath))

  store.dispatch('addConfig', userConfig)
  store.dispatch('initDB', userConfig.dbDirectory)

  // start scanning process
  workerID = setInterval(updateFiles, userConfig.scanEvery * 1000 * 60, userConfig)
  // run `updateFiles` once on app opening
  updateFiles(userConfig)
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    store.dispatch('closeDB')
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

ipcMain.on('refresh', async (event, arg) => {
  // check files
  if (userConfig != null) {
    let fileData = await worker.processFolder(userConfig)
    database.bulkDocs(fileData)
  }
})

// ipcMain.on('load-db', async (event, arg) => {
//   let files = await database.allDocs({include_docs: true})
//   event.sender.send('on-load-db', files.rows)
// })

async function updateFiles (config) {
  if (userConfig != null) {
    let fileData = await worker.processFolder(config)
    store.dispatch('addPdfs', fileData)
  }
}

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
