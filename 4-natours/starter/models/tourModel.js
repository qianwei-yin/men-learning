const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');

const tourSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'A tour must have a name'],
            unique: true, // unique is not a validator
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
            set: (val) => val.toFixed(1),
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
                    // 'this' refers to current document, but only apply to a newly creating document, which means this validator doesn't work (will always return false) when updating
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
        startLocation: {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point'],
            },
            coordinates: [Number], // lon, lat
            address: String,
            description: String,
        },
        locations: [
            {
                type: {
                    type: String,
                    default: 'Point',
                    enum: ['Point'],
                },
                coordinates: [Number],
                address: String,
                description: String,
                day: Number,
            },
        ],
        // guides: Array,
        guides: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
            },
        ],
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Make price and rating also an index (We already have _id and name), and this index is in ascending order (1)
// Since price and rating are the most often fields that people use to sort, filter, so we can add an index to them, so Mongo will only do a little work on querying price and rating
// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// Virtual property, will be in schema but won't be saved into database
// the callback function cannot be an arrow function because we need this keyword
// virtual properties cannot be used in query
tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
});

// Virtual populate (For situation: Tour is parent, Review is child, And they have parent references, which means In the Tour there is no review property, only by virtual populate can access a tour's reviews)
// To turn it on, go to controller and populate() in a query.
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id',
});

// Mongoose has 4 types of middleware: document middleware, model middleware, aggregate middleware, and query middleware
// DOCUMENT MIDDLEWARE
// runs before .save() and .create(), NOT FOR .UPDATE()
tourSchema.pre('save', function (next) {
    // this refers to the document
    this.slug = slugify(this.name, { lower: true });
    next();
});

// Embedding guides into a tour
/*
tourSchema.pre('save', async function (next) {
    const guidesPromises = this.guides.map(async (id) => await User.findById(id));
    this.guides = await Promise.all(guidesPromises);
    next();
});
*/

// QUERY MIDDLEWARE
// the command starts with 'find', i.e. find, findOne, findOneAndDelete, findOneAndUpdate
// keep in mind that findById executes based on findOne
tourSchema.pre(/^find/, function (next) {
    // this refers to the Mongoose query
    this.find({ secretTour: { $ne: true } });
    next();
});

// query reference
tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt',
    });
    next();
});

// AGGREGATE MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
    // $geoNear must be the first stage in the pipeline
    if (Object.keys(this.pipeline()[0])[0] === '$geoNear') {
        this.pipeline().push({ $match: { secretTour: { $ne: true } } });
    } else {
        this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
    }
    next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
