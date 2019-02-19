const fs = require('fs');
const pdf = require('pdf-parse');
const request = require('superagent');

const crossref = 'https://api.crossref.org/works/';

let file = '/Users/wgillis/Desktop/1-s2.0-S0959438808000767-main.pdf'
let databuffer = fs.readFileSync(file);

console.log(process.argv)

pdf(databuffer).then(function(data) {
	console.log(data.info);
	let title = data.info.Title;
	if (title.includes('doi')) {
		let re = /doi:/;
		doi = title.replace(re, '');
		console.log('Searching for title');
		request.get(crossref + doi).end((err, res) => {
			let msg = res.body.message;
			let worktitle = msg.title[0];
			console.log(worktitle);
			console.log(msg);
			console.log(msg.issued['date-parts'][0][0]);
		});
	}
});
