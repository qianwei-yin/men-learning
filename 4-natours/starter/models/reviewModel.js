const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            required: [true, 'Review can not be empty'],
        },
        rating: {
            type: Number,
            min: [1, 'Rating must be above 1'],
            max: [5, 'Rating must be below 5'],
        },
        createdAt: {
            type: Date,
            default: Date.now(),
        },
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            required: [true, 'Review must belong to a tour'],
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to a user'],
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Set a compound index, so one user cannot write multiple reviews on the same tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
    // If want to populate multiple fields
    /*
    this.populate({
        path: 'tour',
        select: 'name',
    }).populate({
        path: 'user',
        select: 'name photo',
    });
    */
    this.populate({
        path: 'user',
        select: 'name photo',
    });
    next();
});

// Static methods, apply to the Schema (whereas instance methods apply to each document)
// How to call? Schema.functionName()
reviewSchema.statics.calcRatings = async function (tourId) {
    const stats = await this.aggregate([
        { $match: { tour: tourId } },
        {
            $group: {
                _id: '$tour',
                numRating: { $sum: 1 },
                avgRating: { $avg: '$rating' },
            },
        },
    ]);

    if (stats[0]) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsAverage: stats[0].avgRating,
            ratingsQuantity: stats[0].numRating,
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsAverage: 4.5, // default rating
            ratingsQuantity: 0,
        });
    }
};

// Everytime there is a new review:
// post doesn't have next()
reviewSchema.post('save', async function () {
    // In the pre/post, 'this' keyword points to document, use this.constructor to get the Schema
    await this.constructor.calcRatings(this.tour);
});

// Everytime there is a review being updated or deleted
reviewSchema.post(/^findOneAnd/, async (doc) => {
    await doc.constructor.calcRatings(doc.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
