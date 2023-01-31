const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');

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

exports.getAllTours = async (req, res) => {
    try {
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
    } catch (error) {
        res.status(404).json({
            status: 'fail',
            message: error,
        });
    }
};
exports.getTour = async (req, res) => {
    try {
        // Tour.findOne({_id: req.params.id})
        const tour = await Tour.findById(req.params.id);
        res.status(200).json({
            status: 'success',
            data: { tour },
        });
    } catch (error) {
        res.status(404).json({
            status: 'fail',
            message: error,
        });
    }
};
exports.createTour = async (req, res) => {
    try {
        /* const newTour = new Tour({});
        newTour.save(); */
        const newTour = await Tour.create(req.body);
        res.status(201).json({
            status: 'success',
            data: { tour: newTour },
        });
    } catch (error) {
        res.status(400).json({
            status: 'fail',
            message: error,
        });
    }
};
exports.updateTour = async (req, res) => {
    try {
        const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // return the modified document rather than the original
            runValidators: true,
        });
        res.status(200).json({
            status: 'success',
            data: { tour },
        });
    } catch (error) {
        res.status(404).json({
            status: 'fail',
            message: error,
        });
    }
};
exports.deleteTour = async (req, res) => {
    try {
        await Tour.findByIdAndDelete(req.params.id);
        // 204 is 'NO CONTENT'
        res.status(204).json({
            status: 'success',
            data: null,
        });
    } catch (error) {
        res.status(404).json({
            status: 'fail',
            message: error,
        });
    }
};

exports.getTourStats = async (req, res) => {
    try {
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
    } catch (error) {
        res.status(404).json({
            status: 'fail',
            message: error,
        });
    }
};

exports.getMonthlyPlan = async (req, res) => {
    try {
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
    } catch (error) {
        res.status(404).json({
            status: 'fail',
            message: error,
        });
    }
};
