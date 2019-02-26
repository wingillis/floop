const getDOIandTitle = require('./lib/pdfs.js')
const io = require('./lib/io.js')
const assert = require('assert')
const request = require('superagent')
const path = require('path')
const _ = require('lodash')

// load in the config file

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

async function getCrossref(doi) {
  return await getDataFromCrossref(doi)
}

async function watchLoop (config) {
  let files = io.scanFolder(config.watch)
  for (let f in files) {
    let data = await getDOIandTitle(files[f])

    if (data.title === 'pii') {
      data.doi = await getDOIFromPII(data.doi)
      data.title = null
    }
    if (data.doi != null) {
      data = await getDataFromCrossref(data.doi)
      // eventually, search the mini json db for entries matching title, doi, etc
      // also rename file based on config
      let new_name = io.renameFromSchema(data, config.naming, config.removeSpaces)
      // move to the untagged dir
      io.moveItem(files[f], path.join(config.outputDirectory, 'untagged', new_name))
      console.log(new_name)
    } else if (data.doi == null && data.title == null) {
      // move these files to an 'unprocessed' folder
      io.moveItem(files[f], path.join(config.outputDirectory, 'unprocessed', path.basename(files[f])))
    } else {
      let new_name = io.renameFromSchema(data, ['title'], config.removeSpaces)
      console.log(new_name)
      io.moveItem(files[f], path.join(config.outputDirectory, 'untagged', new_name))
    }
  }
}


async function main() {
  // put in everything that I'll use to parse stuff here
  const config = require('./config.json')
  config.scanEvery = config.scanEvery * 1000 * 60
  watchLoop(config)

  // this is the watching interval
  // let intervalID = setInterval(watchLoop, config.scanEvery, config)

}

main()