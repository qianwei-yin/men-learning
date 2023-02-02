const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const catchAsyncError = require('../utils/catchAsyncError');
const { updateOne, deleteOne, createOne, getOne, getAll } = require('./handlerFactory');

// 2) Routes Handlers
exports.getAllTours = getAll(Tour);
exports.getTour = getOne(Tour, { path: 'reviews' });
exports.createTour = createOne(Tour);
exports.updateTour = updateOne(Tour);
exports.deleteTour = deleteOne(Tour);

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

    // This middleware does not return response, but others below do. So this one need next() according to the request-response cycle.
    next();
};

exports.getTourStats = catchAsyncError(async (req, res, next) => {
    const stats = await Tour.aggregate([
        { $match: { ratingsAverage: { $gte: 0 } } },
        {
            $group: {
                // This _id is not the _id in every document (row), it is the group key
                _id: '$difficulty',
                numTours: { $sum: 1 },
                numRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
            },
        },
    ]);

    res.status(200).json({ data: stats });
});

exports.getMonthlyPlan = catchAsyncError(async (req, res, next) => {
    const year = req.params.year * 1;

    const monthlyPlan = await Tour.aggregate([
        // $unwind will split an array, like if a document has a startDates(array) which containes 5 elements, then after unwinding it will become 5 documents with different startDates(not an array now) and other fields keeping the same
        { $unwind: '$startDates' },
        {
            $match: {
                startDates: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) },
            },
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numTourStarts: { $sum: 1 },
                tours: { $push: '$name' }, // $push will result into an array
            },
        },
        { $addFields: { month: '$_id' } }, // Add a field 'month' which equals _id
        { $project: { _id: 0 } }, // 0 means exclude this field
        { $sort: { numTourStarts: -1 } },
    ]);

    res.status(200).json({
        status: 'success',
        data: monthlyPlan,
    });
});

// /tours-within/:distance/center/:latlon/unit/:unit
// 47.582999, -122.225382
exports.getToursWithin = catchAsyncError(async (req, res, next) => {
    const { distance, latlon, unit } = req.params;
    const [lat, lon] = latlon.split(',');

    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

    if (!lat || !lon) {
        return next(new AppError('Please provide latitude and longitude in the format lat,lon', 400));
    }

    const tours = await Tour.find({
        startLocation: {
            $geoWithin: {
                $centerSphere: [[lon, lat], radius],
            },
        },
    });

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: { data: tours },
    });
});

exports.getDistances = catchAsyncError(async (req, res, next) => {
    const { latlon, unit } = req.params;
    const [lat, lon] = latlon.split(',');

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

    if (!lat || !lon) {
        return next(new AppError('Please provide latitude and longitude in the format lat,lon', 400));
    }

    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lon * 1, lat * 1],
                },
                distanceField: 'distance', // return unit in meters
                distanceMultiplier: multiplier,
            },
        },
        {
            $project: { distance: 1, name: 1 },
        },
    ]);

    res.status(200).json({
        status: 'success',
        data: { data: distances },
    });
});
