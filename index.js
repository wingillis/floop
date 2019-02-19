const fs = require('fs');
const pdf = require('pdf-parse');
const request = require('superagent');

// link to the crossref api
const crossref = 'https://api.crossref.org/works/';

// I have a file on my desktop for testing
let file = '/Users/wgillis/Desktop/1-s2.0-S0959438808000767-main.pdf'
// contains the pdf file in memory now
let databuffer = fs.readFileSync(file);

//console.log(process.argv)

// parse the pdf then ...
pdf(databuffer).then(function(data) {
	// print the information about the pdf, i.e. title, etc.
	console.log(data.info);
	let title = data.info.Title;
	if (title.includes('doi')) {
		let re = /doi:/;
		// remove doi from the title name
		doi = title.replace(re, '');
		console.log('Searching for title');
		// use crossref api to get actual pdf title name
		request.get(crossref + doi).end((err, res) => {
			let msg = res.body.message;
			// the paper's title
			let worktitle = msg.title[0];
			console.log(worktitle);
			// this is everything that crossref sends back
			console.log(msg);
			// this is the year the paper was published
			console.log(msg.issued['date-parts'][0][0]);
		});
	}
});
