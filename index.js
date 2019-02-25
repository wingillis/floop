const getDOIandTitle = require('./lib/pdfs.js')
const assert = require('assert');
const request = require('superagent');

// link to the crossref api
const crossref = 'https://api.crossref.org/works/';


async function getDataFromCrossref(doi) {
	return new Promise((resolve, reject) => {
			request.get(crossref + doi).end((err, res) => {
			let msg = res.body.message
			// the paper's title
			let worktitle = msg.title[0]
			let publisher = msg.publisher
			// console.log(msg)
			resolve({
				title: worktitle,
				publisher: publisher,
				year: msg.issued['date-parts'][0][0],
				authors: msg.author
			})
		})
	})
}


async function main() {
	// put in everything that I'll use to parse stuff here
	assert(process.argv.length > 2, 'Please specify an input file')
	let file = process.argv[2]
	console.log(file)
	let d = await getDOIandTitle(file)
	let thing = await getDataFromCrossref(d.doi)
	console.log(`title: "${d.title}"`)
	console.log(thing)
}

main()