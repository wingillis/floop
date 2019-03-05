'use strict'

import fs from 'fs'
import path from 'path'
import * as request from 'superagent'
import io from './io'
import { getDOIandTitle } from './pdfs'

const join = path.join
const PouchDB = require('pouchdb')
const _ = require('lodash')

// link to the crossref api
const crossref = 'https://api.crossref.org/works'
// const crossrefQuery = 'https://api.crossref.org/works?query='

async function getDataFromCrossref (doi) {
  let res = await request.get(`${crossref}/${doi}`)
  let msg = res.body.message
  let publisher = msg['container-title']
  if (_.isArray(publisher)) {
    publisher = _.first(publisher)
  }
  return {
    title: msg.title[0],
    journal: publisher,
    year: msg.issued['date-parts'][0][0],
    authors: msg.author,
    doi: doi
  }
}

async function getDOIFromPII (pii) {
  // replace text that won't be used in html search
  pii = pii.replace(/[()-]/g, '')
  try {
    let res = await request.get(crossref).query({query: pii})
    let msg = res.body.message
    if (msg.items.length === 1) {
      return msg.items[0].DOI
    } else {
      throw new Error('cannot handle multiple dois')
    }
  } catch (error) {
    console.error(error)
    throw new Error(error)
  }
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
    let newName = io.renameFromSchema(data, config.naming, config.removeSpaces)
    // move to the untagged dir
    data.path = join(config.outputDirectory, 'untagged', newName)
    data.tags = ['untagged']
    io.moveItem(fname, data.path, config.move)
  } else if (data.doi == null && data.title == null) {
    // move these files to an 'unprocessed' folder
    data.path = join(config.outputDirectory, 'unprocessed', path.basename(fname))
    data.tags = ['unprocessed']
    io.moveItem(fname, data.path, config.move)
  } else {
    let newName = io.renameFromSchema(data, ['title'], config.removeSpaces)
    data.path = join(config.outputDirectory, 'untagged', newName)
    data.tags = ['untagged']
    io.moveItem(fname, data.path, config.move)
  }
  if (data.title == null) {
    data.title = path.basename(data.path.toLowerCase(), '.pdf')
  }
  return data
}

function setupDB (config) {
  if (!fs.existsSync(config.dbDirectory)) {
    fs.mkdirSync(config.dbDirectory)
  }
  return new PouchDB(join(config.dbDirectory, 'pdf-files.db'))
}

async function processFolder (config) {
  let files = io.scanFolder(config.watch)
  // this makes the api calls async and faster
  let fileData = await Promise.all(files.map(async fname => {
    return processFile(fname, config)
  }))
  fileData.map((v) => {
    v.created_date = new Date().toJSON()
    v._id = v.md5
  })
  // TODO: do something with the file data here in the db
  return fileData
}

export default {
  setupDB,
  processFile,
  processFolder
}
