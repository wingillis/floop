const fs = require('fs-extra')
const join = require('path').join

let folderPath = '/Users/wgillis/Library/Application Support/Electron'

fs.unlinkSync(join(folderPath, 'vuex.json'))
fs.removeSync(join(folderPath, 'Local Storage', 'leveldb'))
