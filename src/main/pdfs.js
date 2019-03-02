const pdf = require('pdfjs-dist')
const fs = require('fs')
const _ = require('lodash')
const md5 = require('md5-file/promise')

function flatten_to_entries(obj) {
  let entries = _.entries(obj)
  let objs = _.filter(entries, (v) => {
    return _.isObject(v[1])
  })
  entries = _.filter(entries, (v) => {
    return !_.isObject(v[1])
  })
  for (let i=0; i < objs.length; i++) {
    entries = _.concat(entries, flatten_to_entries(objs[i][1]))
  }
  return entries
}

function searchForDOI(obj) {
  const entries = flatten_to_entries(obj)

  return entries.filter(([key, val]) => {
    return _.isString(val) && (val.search(/doi:/) != -1 || key.search(/doi:/) != -1)
  })
}

function searchForTitle(obj) {
  const entries = flatten_to_entries(obj)

  return entries.filter(([entry, val]) => {
    return _.isString(entry) && entry.search(/[Tt]itle/) != -1
  })
}

// remove doi from title section and return valid titles
function cleanTitles(titles) {
  // remove dois
  titles = _.filter(titles, ([key, val]) => {
    return val.search(/doi:/) == -1
  })
  // remove titles with just numbers or unintelligible things
  titles = _.filter(titles, ([key, val]) => {
    let tmp = val.replace(' ', '')
    let onlyNumbers = tmp.search(/^[^a-zA-Z]+$/) != -1
    let isUntitled = tmp.toLowerCase() === 'untitled'
    let isDocx = tmp.search(/\.doc[x]?$/) != -1
    let isWeirdNumName = tmp.search(/[a-z]+\.[0-9]{4}/) != -1
    let isEmpty = tmp.length == 0
    return !(isUntitled || isWeirdNumName || isDocx || onlyNumbers || isEmpty)
  })
  if (titles.length == 0) {
    return null
  } else {
    titles = _.uniqBy(titles, (val) => { return val[1] })
    if (titles.length > 0) {
      return titles[0][1]
    } else {
      return null
    }
  }
}

// remove redundant dois from list
function cleanDOIs(dois) {
  let matches = _.map(dois, ([key, val]) => {
    if (key.search(/doi/) != -1) {
      return val
    } else {
      let match = val.match(/doi:( )?.+\w/)
      return match[0]
    }
  })
  matches = _.map(matches, (val) => {
    return val.replace(/doi:( )?/, '')
  })
  return _.uniq(matches)
}

async function getDOIandTitle(fpath) {
  let data = await pdf.getDocument(fpath)
  let md = await data.getMetadata()
  // console.log(md)
  let dois = searchForDOI(md)
  // console.log(dois)

  let titles = searchForTitle(md)
  // console.log(titles)
  let title = cleanTitles(titles)
  // console.log(title)
  let doi = cleanDOIs(dois)

  if (doi.length == 0) {
    doi = null
    // console.log(md)
  }
  // replace doi with PII if available
  if (title != null && title.search(/PII/) != -1) {
    doi = title.replace(/PII:( )?/, '')
    title = 'pii'
  }

  hash = await md5(fpath)

  return {
    doi,
    title,
    md5: hash
  }

}

module.exports = getDOIandTitle
