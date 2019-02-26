const fs = require('fs')
const path = require('path')
const join = path.join

// find all items in `folder` that are pdfs
function scanFolder(folder) {
  let items = fs.readdirSync(folder)
  items = items.filter((val) => {
    return fs.lstatSync(join(folder, val)).isFile()
  }).filter((val) => {
    return val.toLowerCase().search(/pdf$/) != -1
  })
  items = items.map((val) => {
    return join(folder, val)
  })
  return items
}

// moves file to new directory, and makes the directory in case it doesn't exist
function moveItem(from, to) {
  let fname = path.basename(from)
  if (!fs.existsSync(to)) {
    console.log(`making dir ${to}`)
    fs.mkdirSync(to, {recursive: true})
  }
  fs.copyFileSync(from, join(to, fname))
  console.log(`copied file ${from} to ${to}`)
}

// rename file based on keys to call from specified in the json config
function renameFromSchema(file, data, schema) {

}

module.exports = {
  scanFolder,
  moveItem
}