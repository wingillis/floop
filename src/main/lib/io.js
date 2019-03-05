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
    return val.toLowerCase().search(/pdf$/) !== -1
  })
  items = items.map((val) => {
    return join(folder, val)
  })
  return items
}

async function updateVersion (fname, comparator, version = 1) {
  let ext = path.extname(fname)
  let base = path.basename(fname, ext)
  let newFname = join(path.dirname(fname), base + `.${version}${ext}`)
  if (!fs.existsSync(newFname)) {
    return newFname
  } else if (await checkHash(comparator, newFname)) {
    return newFname
  } else {
    return updateVersion(fname, comparator, version + 1)
  }
}

async function checkHash (f1, f2) {
  return await md5(f1) === await md5(f2)
}

// moves file to new directory, and makes the directory in case it doesn't exist
async function moveItem (from, to, move = false) {
  // if they're the same, don't move
  if (from === to) {
    return to
  }
  let toDir = path.dirname(to)
  // make the copy directory
  if (!fs.existsSync(toDir)) {
    console.log(`making dir ${toDir}`)
    fs.mkdirSync(toDir, {recursive: true})
  }
  // if file exists, check if it's the same as the file already present
  if (fs.existsSync(to) && !await checkHash(from, to)) {
    // if the hash's aren't the same, they are different files, so we should
    // update the version number
    to = await updateVersion(to, from)
    if (fs.existsSync(to)) {
      // delete file and recopy
      fs.unlinkSync(to)
    }
  } else if (fs.existsSync(to)) {
    fs.unlinkSync(to)
  }
  // move file if move flag set to true else copy it
  if (move) {
    fs.renameSync(from, to)
  } else {
    // after checking for duplicates, I can copy the file in peace
    // don't overwrite the file if it's already present
    fs.copyFileSync(from, to, fs.constants.COPYFILE_EXCL)
    // console.log(`copied file ${from} to ${to}`)
  }
  return to
}

/**
 * makes a symlink of one file in a new directory, checking to make sure that
 * the checksum matches if overwriting a file. Otherwise, it will update the
 * filename
 * @param {PathLike} linked the file to make a symlink with
 * @param {PathLike} linkPath the new path where the symlink will reside
 */
async function linkItem (linked, linkPath) {
  let toDir = path.dirname(linkPath)
  if (!fs.existsSync(toDir)) {
    fs.mkdirSync(toDir, { recursive: true })
  }
  // if there is a linkPath file update name
  if (fs.existsSync(linkPath) && !await checkHash(linked, linkPath)) {
    linkPath = await updateVersion(linkPath, linked)
  }
  fs.linkSync(linked, linkPath)
  return linkPath
}

// rename file based on keys to call from specified in the json config
function renameFromSchema (data, schema, removeSpaces = false) {
  // remove illegal filename characters
  let fname = _.join(_.filter(_.map(schema, (v) => {
    return data[v]
  }), (v) => {
    return v != null
  }), ' - ')
  // removes illegal characters from pathname
  fname = fname.replace(/[/\\?%*:|"<>]/g, '-') + '.pdf'
  if (removeSpaces) {
    fname = fname.replace(' ', '-')
  }
  return fname
}

export default {
  scanFolder,
  moveItem,
  linkItem,
  renameFromSchema
}
