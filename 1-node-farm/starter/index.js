// Core modules
const fs = require('fs');
const http = require('http');
const url = require('url');

// 3rd party modules
const slugify = require('slugify');

// Our own created modules
const replaceTemplate = require('./modules/replaceTemplate');

///////////////////////
// create a simple web server

const tempOverview = fs.readFileSync(`${__dirname}/templates/template-overview.html`, 'utf-8');
const tempCard = fs.readFileSync(`${__dirname}/templates/template-card.html`, 'utf-8');
const tempProduct = fs.readFileSync(`${__dirname}/templates/template-product.html`, 'utf-8');

const data = fs.readFileSync(`${__dirname}/dev-data/data.json`, 'utf-8');
const dataObj = JSON.parse(data);

const server = http.createServer((req, res) => {
	const { query, pathname: pathName } = url.parse(req.url, true);

	// Overview
	if (pathName === '/' || pathName === '/overview') {
		res.writeHead(200, { 'Content-type': 'text/html' });

		const cardsHtml = dataObj.map((el) => replaceTemplate(tempCard, el)).join('');
		const output = tempOverview.replace(/{%PRODUCT_CARDS%}/g, cardsHtml);

		res.end(output);
	}
	// Product detail
	else if (pathName === '/product') {
		const product = dataObj[query.id];
		const output = replaceTemplate(tempProduct, product);
		res.writeHead(200, { 'Content-type': 'text/html' });
		res.end(output);
	}
	// API
	else if (pathName === '/api') {
		res.writeHead(200, { 'Content-type': 'application/json' });
		res.end(data);
	}
	// 404
	else {
		res.writeHead(404, {
			'Content-type': 'text/html',
		});
		res.end('<h1>Page not found</h1>');
	}
});

server.listen(8000, '127.0.0.1', () => {
	console.log('Listening to requests on port 8000');
});
