const fs = require('fs')
const _ = require('lodash')
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
  let to_dir = path.dirname(to)
  if (!fs.existsSync(to_dir)) {
    console.log(`making dir ${to_dir}`)
    fs.mkdirSync(to_dir, {recursive: true})
  }
  fs.copyFileSync(from, to)
  console.log(`copied file ${from} to ${to}`)
}

// rename file based on keys to call from specified in the json config
function renameFromSchema(data, schema, remove_spaces=false) {
  // remove illegal filename characters
  let fname = _.join(_.filter(_.map(schema, (v) => {
    return data[v]
  }), (v) => {
    return v != null
  }), ' - ')
  fname = fname.replace(/[/\\?%*:|"<>]/g, '-') + '.pdf'
  if (remove_spaces) {
    fname = fname.replace(' ', '-')
  }
  return fname
}

module.exports = {
  scanFolder,
  moveItem,
  renameFromSchema
}