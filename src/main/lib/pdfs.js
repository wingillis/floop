const pdf = require('pdfjs-dist')
const _ = require('lodash')
const md5 = require('md5-file/promise')

function flattenEntries (obj) {
  let entries = _.entries(obj)
  let objs = _.filter(entries, (v) => {
    return _.isObject(v[1])
  })
  entries = _.filter(entries, (v) => {
    return !_.isObject(v[1])
  })
  for (let i = 0; i < objs.length; i++) {
    entries = _.concat(entries, flattenEntries(objs[i][1]))
  }
  return entries
}

function searchForDOI (obj) {
  const entries = flattenEntries(obj)

  return entries.filter(([key, val]) => {
    return _.isString(val) && (_.toLower(val).search(/doi:/) !== -1 || _.toLower(key).search(/doi:/) !== -1)
  })
}

/**
 * search for DOIs in the pdf. this is mostly to accomodate science mag articles
 * @param {pdf} data
 */
async function pdfDOIsearch (data) {
  let candidates = []
  let numPages = data.numPages
  while (numPages > 0) {
    let page = await data.getPage(numPages)
    let text = await page.getTextContent()
    candidates = text.items.filter(v => { return v.str.search(/\d{2}\.\d{4}\/science\.[a-z\d]{7}/g) !== -1 })
    if (candidates.length > 0) break
    numPages--
  }
  if (candidates.length === 0) {
    return null
  } else {
    candidates = candidates.map(v => {
      return _.toLower(v.str).match(/\d{2}\.\d{4}\/science\.[a-z\d]{7}/g)[0]
    })
    // console.log(candidates)
    return _.first(_.uniq(candidates))
  }
}

function searchForTitle (obj) {
  const entries = flattenEntries(obj)

  return entries.filter(([entry, val]) => {
    return _.isString(entry) && entry.search(/[Tt]itle/) !== -1
  })
}

// remove doi from title section and return valid titles
function cleanTitles (titles) {
  // remove dois
  titles = _.filter(titles, ([key, val]) => {
    return val.search(/doi:/) === -1
  })
  // remove titles with just numbers or unintelligible things
  titles = _.filter(titles, ([key, val]) => {
    let tmp = val.replace(' ', '')
    let onlyNumbers = tmp.search(/^[^a-zA-Z]+$/) !== -1
    let isUntitled = tmp.toLowerCase() === 'untitled'
    let isDocx = tmp.search(/\.doc[x]?$/) !== -1
    let isWeirdNumName = tmp.search(/[a-z]+\.[0-9]{4}/) !== -1
    let isEmpty = tmp.length === 0
    return !(isUntitled || isWeirdNumName || isDocx || onlyNumbers || isEmpty)
  })
  if (titles.length === 0) {
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
function cleanDOIs (dois) {
  let matches = _.map(dois, ([key, val]) => {
    if (_.toLower(key).search(/doi/) !== -1) {
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

async function getDOIandTitle (fpath) {
  let hash = md5(fpath)
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

  if (doi.length === 0) {
    // try looking in the pdf
    doi = await pdfDOIsearch(data)
  }
  // replace doi with PII if available
  if (title != null && title.search(/PII/) !== -1) {
    doi = title.replace(/PII:( )?/, '')
    title = 'pii'
  }

  return {
    doi,
    title,
    md5: await hash
  }
}

export {
  getDOIandTitle
}
