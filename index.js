const getDOIandTitle = require('./lib/pdfs.js')
const io = require('./lib/io.js')
const assert = require('assert')
const request = require('superagent')
const path = require('path')
const PouchDB = require('pouchdb')
const join = path.join
const fs = require('fs')
const _ = require('lodash')

// setup pouchdb
var db

// link to the crossref api
const crossref = 'https://api.crossref.org/works/';

function getDataFromCrossref(doi) {
  return new Promise((resolve, reject) => {
      // request.get(crossref + doi).end((err, res) => {
      request.get(crossref + doi).end((err, res) => {
      let msg = res.body.message
      // console.log(msg)
      // the paper's title
      let worktitle = msg.title[0]
      let publisher = msg['container-title']
      if (_.isArray(publisher)) {
        publisher = _.first(publisher)
      }
      resolve({
        title: worktitle,
        journal: publisher,
        year: msg.issued['date-parts'][0][0],
        authors: msg.author,
        doi: doi
      })
    })
  })
}

async function getDOIFromPII(pii) {
  pii = pii.replace(/[()-]/g, '')
  return new Promise((resolve, reject) => {
    request.get('https://api.crossref.org/works?query=' + pii).end((err, res) => {
      let msg = res.body.message
      if (msg.items.length == 1) {
        resolve(msg.items[0].DOI)
      } else {
        console.log(msg.items)
        reject('Too many parameters and I do not know how to deal with it yet')
      }
    })
  })
}

async function processFile (fname, config) {
  let data = await getDOIandTitle(fname)
  if (data.title === 'pii') {
    data.doi = await getDOIFromPII(data.doi)
    data.title = null
  }
  if (data.doi != null) {
    data = _.assign(data, await getDataFromCrossref(data.doi))
    // eventually, search the mini json db for entries matching title, doi, etc
    // also rename file based on config
    let new_name = io.renameFromSchema(data, config.naming, config.removeSpaces)
    // move to the untagged dir
    data.path = join(config.outputDirectory, 'untagged', new_name)
    data.tags = ['untagged']
    io.moveItem(fname, data.path)
  } else if (data.doi == null && data.title == null) {
    // move these files to an 'unprocessed' folder
    data.path = join(config.outputDirectory, 'unprocessed', path.basename(fname))
    data.tags = ['unprocessed']
    io.moveItem(fname, data.path)
  } else {
    let new_name = io.renameFromSchema(data, ['title'], config.removeSpaces)
    data.path = join(config.outputDirectory, 'untagged', new_name)
    data.tags = ['untagged']
    io.moveItem(fname, data.path)
  }
  return data
}

function setupDB(config) {
  if (!fs.existsSync(config.dbDirectory)) {
    fs.mkdirSync(config.dbDirectory)
  }
  return new PouchDB(join(config.dbDirectory, 'pdf-files.db'))
}

async function watchLoop (config) {
  let files = io.scanFolder(config.watch)
  // this makes the api calls async and faster
  let file_data = await Promise.all(files.map(async fname => {
    return processFile(fname, config)
  }))
  file_data.map((v) => {
    v._id = new Date().toJSON()
  })
  // TODO: do something with the file data here in the db
  if (db == null) {
    db = setupDB(config)
  }
  db.bulkDocs(file_data)

  return file_data
}


async function watching () {
  // put in everything that I'll use to parse stuff here
  const config = require('./config.json')
  db = setupDB(config)
  config.scanEvery = config.scanEvery * 1000 * 60
  let data = await watchLoop(config)
  console.log(data)
  // this is the watching interval
  // let intervalID = setInterval(watchLoop, config.scanEvery, config)

}

watching()