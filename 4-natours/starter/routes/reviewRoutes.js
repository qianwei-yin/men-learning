const express = require('express');
const {
    getAllReviews,
    getReview,
    setBodyBeforeCreate,
    createReview,
    deleteReview,
    updateReview,
} = require('../controllers/reviewController');
const { protect, restrictTo } = require('../controllers/authController');

// { mergeParams: true } ensures that reviewRouter can access params from 'parent' router, which is tourRouter
const router = express.Router({ mergeParams: true });

router.use(protect);

router.route('/').get(getAllReviews).post(restrictTo('user'), setBodyBeforeCreate, createReview);
router
    .route('/:id')
    .get(getReview)
    .patch(restrictTo('user', 'admin'), updateReview)
    .delete(restrictTo('user', 'admin'), deleteReview);

module.exports = router;
