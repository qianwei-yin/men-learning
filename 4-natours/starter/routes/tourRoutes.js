const express = require('express');
const {
	checkId,
	checkBody,
	getAllTours,
	getTour,
	createTour,
	updateTour,
	deleteTour,
} = require('../controllers/tourController.js');

const router = express.Router();

// When the route has id param, then check id
router.param('id', checkId);

router.route('/').get(getAllTours).post(checkBody, createTour);
router.route('/:id').get(getTour).patch(updateTour).delete(deleteTour);

module.exports = router;
