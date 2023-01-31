const express = require('express');
const {
    // checkId,
    // checkBody,
    aliasTopTours,
    getAllTours,
    getTour,
    createTour,
    updateTour,
    deleteTour,
    getTourStats,
    getMonthlyPlan,
} = require('../controllers/tourController');

const router = express.Router();

// When the route has id param, then check id
// router.param('id', checkId);

// the route '/top-5-tours' must at the top, if put it at the bottom, Express will recognize 'top-5-tours' as an id
router.route('/top-5-tours').get(aliasTopTours, getAllTours);
router.route('/tour-stats').get(getTourStats);
router.route('/monthly-plan/:year').get(getMonthlyPlan);

router.route('/').get(getAllTours).post(createTour);
router.route('/:id').get(getTour).patch(updateTour).delete(deleteTour);

module.exports = router;
