const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsyncError = require('../utils/catchAsyncError');

// data from hard coded
// const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));

// MongoDB will automatically check invalid id
// exports.checkId = (req, res, next, val) => {
//     const tour = tours.find((el) => el.id === req.params.id * 1);
//     if (!tour) {
//         return res.status(404).json({
//             status: 'fail',
//             message: 'Invalid ID',
//         });
//     }
//     next();
// };

// exports.checkBody = (req, res, next) => {
//     console.log(req.body);
//     if (!req.body.name || !req.body.price) {
//         // 400 is 'BAD REQUEST'
//         return res.status(400).json({
//             status: 'fail',
//             message: 'Must have name and price property',
//         });
//     }
//     next();
// };

// 2) Routes Handlers
exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

    // This middleware does not return response, but others below do. So this one need next() according to the request-response cycle.
    next();
};

exports.getAllTours = catchAsyncError(async (req, res, next) => {
    // Get query
    const features = new APIFeatures(Tour.find(), req.query).filter().sort().limitFields().paginate();
    // Execute query
    const tours = await features.queryMong;

    // Send response
    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: { tours },
    });
});

exports.getTour = catchAsyncError(async (req, res, next) => {
    // Tour.findOne({_id: req.params.id})
    const tour = await Tour.findById(req.params.id);

    // If we pass in a valid ID (by changing a character in a real existing ID), then this is not an error, so we have to catch it.
    if (!tour) {
        return next(new AppError('No tour found with the ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: { tour },
    });
});

exports.createTour = catchAsyncError(async (req, res, next) => {
    const newTour = await Tour.create(req.body);
    res.status(201).json({
        status: 'success',
        data: { tour: newTour },
    });
});

exports.updateTour = catchAsyncError(async (req, res, next) => {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
        new: true, // return the modified document rather than the original
        runValidators: true,
    });

    // If we pass in a valid ID (by changing a character in a real existing ID), then this is not an error, it will return 200 with data is null, so we have to catch it.
    if (!tour) {
        return next(new AppError('No tour found with the ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: { tour },
    });
});

exports.deleteTour = catchAsyncError(async (req, res, next) => {
    const tour = await Tour.findByIdAndDelete(req.params.id);

    if (!tour) {
        return next(new AppError('No tour found with the ID', 404));
    }

    // 204 is 'NO CONTENT'
    res.status(204).json({
        status: 'success',
        data: null,
    });
});

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
