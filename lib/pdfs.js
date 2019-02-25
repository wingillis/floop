const pdf = require('pdfjs-dist')
const fs = require('fs')
const _ = require('lodash')

function flatten_to_entries(obj) {
	let entries = Object.entries(obj)
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

	return entries.filter((entry) => {
		let value = entry[1]
		return _.isString(value) && value.search(/doi:/) != -1
	})
}

function searchForTitle(obj) {
	const entries = flatten_to_entries(obj)

	return entries.filter(([entry, val]) => {
		return _.isString(entry) && entry.search(/[Tt]itle/) != -1
	})
}

async function getDOIandTitle(fpath) {
	let data = await pdf.getDocument(fpath)
	let md = await data.getMetadata()
	console.log(md)
	let dois = searchForDOI(md)
	console.log(dois)
	let title = searchForTitle(md)
	let nondoi_title = _.filter(title, ([key, val]) => {
		return val.search(/doi:/) == -1
	})
	if (nondoi_title != null) {
		nondoi_title = _.uniqBy(nondoi_title, (val) => { return val[1] })[0][1]
	}
	let doi = _.uniq(_.map(dois, ([key, val]) => {
		return val.match(/doi: .+\w/)[0]
	}))[0]
  	// print the information about the pdf, i.e. title, etc.
  	// console.log(data.info);
  	// let title = data.info.Title;
  	// if (title.includes('doi')) {
  	// 	let re = /doi:/;
  	// 	// remove doi from the title name
  	// 	doi = title.replace(re, '');
  	// 	console.log('Searching for title');
  		// use crossref api to get actual pdf title name
  		// request.get(crossref + doi).end((err, res) => {
  		// 	let msg = res.body.message;
  		// 	// the paper's title
  		// 	let worktitle = msg.title[0];
  		// 	console.log(worktitle);
  		// 	// this is everything that crossref sends back
  		// 	console.log(msg);
  		// 	// this is the year the paper was published
  		// 	console.log(msg.issued['date-parts'][0][0]);
  		// });
  return {
    doi: doi,
    title: nondoi_title 
  }

}

module.exports = getDOIandTitle