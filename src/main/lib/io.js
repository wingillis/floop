const fs = require('fs')
const _ = require('lodash')
const path = require('path')
const md5 = require('md5-file/promise')
const join = path.join

// find all items in `folder` that are pdfs
function scanFolder (folder) {
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

function updateVersion (fname, version = 1) {
  let ext = path.extname(fname)
  let base = path.basename(fname, ext)
  let new_fname = join(path.dirname(fname), base + `.${version}${ext}`)
  if (!fs.existsSync(new_fname)) {
    return new_fname
  } else {
    return updateVersion(fname, version + 1)
  }
}

// moves file to new directory, and makes the directory in case it doesn't exist
async function moveItem (from, to) {
  let to_dir = path.dirname(to)
  if (!fs.existsSync(to_dir)) {
    console.log(`making dir ${to_dir}`)
    fs.mkdirSync(to_dir, {recursive: true})
  }
  if (fs.existsSync(to)) {
    // continue in HERE
    let from_hash = md5(from)
    let to_hash = md5(to)
    if (await from_hash !== await to_hash) {
      // update `to` filename
      to = updateVersion(to)
    } else {
      // delete file and recopy
      fs.unlinkSync(to)
    }
  }
  // after checking for duplicates, I can copy the file in peace
  fs.copyFileSync(from, to, fs.constants.COPYFILE_EXCL)
  // console.log(`copied file ${from} to ${to}`)
}

// rename file based on keys to call from specified in the json config
function renameFromSchema (data, schema, remove_spaces = false) {
  // remove illegal filename characters
  let fname = _.join(_.filter(_.map(schema, (v) => {
    return data[v]
  }), (v) => {
    return v != null
  }), ' - ')
  // removes illegal characters from pathname
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
