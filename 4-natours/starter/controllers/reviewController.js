const Review = require('../models/reviewModel');
const { deleteOne, updateOne, createOne, getOne, getAll } = require('./handlerFactory');

exports.getAllReviews = getAll(Review);

exports.setBodyBeforeCreate = (req, res, next) => {
    req.body.tour = req.body.tour || req.params.tourId;
    req.body.user = req.user; // use user info from 'protect' middleware to override the user info, if has, in req.body. This prevents someone using others' userId to create review.
    next();
};
exports.createReview = createOne(Review);

exports.deleteReview = deleteOne(Review);
exports.updateReview = updateOne(Review);
exports.getReview = getOne(Review);
