const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const tourSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'A tour must have a name'],
            unique: true,
            trim: true,
            minlength: [8, 'Tour name must have equal or more than 8 characters'],
            maxlength: [50, 'Tour name must have equal or less than 50 characters'],
            // Use external validators
            // validate: [validator.isAlpha, 'Tour name must only contain characters'],
        },
        slug: String,
        duration: {
            type: Number,
            required: [true, 'A tour must have a duration'],
        },
        maxGroupSize: {
            type: Number,
            required: [true, 'A tour must have a max group size'],
        },
        difficulty: {
            type: String,
            required: [true, 'A tour must have a difficulty'],
            enum: {
                values: ['easy', 'medium', 'difficult'],
                message: 'Difficulty is either: easy, medium, difficult',
            },
        },
        ratingsAverage: {
            type: Number,
            default: 4.5,
            min: [1, 'Rating must be above 1.0'],
            max: [5, 'Rating must be below 5.0'],
        },
        ratingsQuantity: {
            type: Number,
            default: 0,
        },
        price: {
            type: Number,
            required: [true, 'A tour must have a price'],
        },
        priceDiscount: {
            type: Number,
            validate: {
                // 'val' refers to current field
                validator: function (val) {
                    // 'this' refers to current document, but only to a newly creating document, which means this validator doesn't work (will always return false) when updating
                    return val < this.price;
                },
                message: 'Discount price must be below original price',
            },
        },
        summary: {
            type: String,
            trim: true,
            required: [true, 'A tour must have a summary'],
        },
        description: {
            type: String,
            trim: true,
        },
        imageCover: {
            type: String,
            required: [true, 'A tour must have a cover image'],
        },
        images: [String],
        createdAt: {
            type: Date,
            default: Date.now(),
            select: false, // sensitive info, cannot select it
        },
        startDates: [Date],
        secretTour: {
            type: Boolean,
            default: false,
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual property, will be in schema but won't be saved into database
// the callback function cannot be an arrow function because we need this keyword
// virtual properties cannot be used in query
tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
});

// Mongoose has 4 types of middleware: document middleware, model middleware, aggregate middleware, and query middleware
// DOCUMENT MIDDLEWARE
// runs before .save() and .create(), NOT FOR .UPDATE()
tourSchema.pre('save', function (next) {
    // this refers to the document
    this.slug = slugify(this.name, { lower: true });
    next();
});
// tourSchema.post('save', function (doc, next) {
//     console.log(doc);
//     next();
// });

// QUERY MIDDLEWARE
// the command starts with 'find', i.e. find, findOne, findOneAndDelete, findOneAndUpdate
// keep in mind that findById executes based on findOne
tourSchema.pre(/^find/, function (next) {
    // this refers to the Mongoose query
    this.find({ secretTour: { $ne: true } });
    next();
});

// AGGREGATE MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
    next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
