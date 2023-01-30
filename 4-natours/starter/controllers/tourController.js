const { json } = require('express');
const fs = require('fs');

const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));

exports.checkId = (req, res, next, val) => {
	const tour = tours.find((el) => el.id === req.params.id * 1);
	if (!tour) {
		return res.status(404).json({
			status: 'fail',
			message: 'Invalid ID',
		});
	}
	next();
};

exports.checkBody = (req, res, next) => {
	console.log(req.body);
	if (!req.body.name || !req.body.price) {
		// 400 is 'BAD REQUEST'
		return res.status(400).json({
			status: 'fail',
			message: 'Must have name and price property',
		});
	}
	next();
};

// 2) Routes Handlers
// Seperate all the handler functions / callback functions out
exports.getAllTours = (req, res) => {
	res.status(200).json({
		status: 'success',
		results: tours.length,
		data: { tours },
	});
};
exports.getTour = (req, res) => {
	const tour = tours.find((el) => el.id === req.params.id * 1);
	res.status(200).json({
		status: 'success',
		data: { tour },
	});
};
exports.createTour = (req, res) => {
	const newId = tours[tours.length - 1].id + 1;
	// The Object.assign() method is to copy the values and properties from one or more source objects to a target object
	const newTour = Object.assign({ id: newId }, req.body);

	tours.push(newTour);
	fs.writeFile(`${__dirname}/../dev-data/data/tours-simple.json`, JSON.stringify(tours), (err) => {
		// 201 is 'CREATED'
		res.status(201).json({
			status: 'success',
			data: { newTour },
		});
	});
};
exports.updateTour = (req, res) => {
	res.status(200).json({
		status: 'success',
		data: { tour: '<Updated tour here...>' },
	});
};
exports.deleteTour = (req, res) => {
	// 204 is 'NO CONTENT'
	res.status(204).json({
		status: 'success',
		data: null,
	});
};
