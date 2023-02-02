const express = require('express');
const {
    // checkId,
    // checkBody,
    aliasTopTours,
    getToursWithin,
    getDistances,
    getAllTours,
    getTour,
    createTour,
    updateTour,
    deleteTour,
    getTourStats,
    getMonthlyPlan,
} = require('../controllers/tourController');
const { protect, restrictTo } = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// Nested routes
// Like a review belongs to a tour, so when user want to create a review, his token should be there (authenticated)
// And he is in a tour (in the tour detail page and can easily get the tour id)
/*
// But this is a little weird because we define review route in a tour route
router.route('/:tourId/reviews').post(protect, restrictTo('user'), createReview);
*/
// Instead, we implement like this: (The same logic in app.js)
// When in the tourRouter, we encounter a route like '/:tourId/reviews', then use reviewRouter
router.use('/:tourId/reviews', reviewRouter);

// the route '/top-5-tours' must at the top, if put it at the bottom, Express will recognize 'top-5-tours' as an id
router.route('/top-5-tours').get(aliasTopTours, getAllTours);
router.route('/tour-stats').get(getTourStats);
router.route('/monthly-plan/:year').get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan);

router.route('/tours-within/:distance/center/:latlon/unit/:unit').get(getToursWithin);
router.route('/distances/:latlon/unit/:unit').get(getDistances);

router.route('/').get(getAllTours).post(protect, restrictTo('admin', 'lead-guide'), createTour);
router
    .route('/:id')
    .get(getTour)
    .patch(protect, restrictTo('admin', 'lead-guide'), updateTour)
    .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);

module.exports = router;
