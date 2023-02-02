const catchAsyncError = require('../utils/catchAsyncError');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
    catchAsyncError(async (req, res, next) => {
        // prevent a normal user deleting other users' reviews
        if (Model.modelName === 'Review') {
            const doc = await Model.findById(req.params.id);
            if (req.user.role === 'user' && !doc.user._id.equals(req.user._id)) {
                return next(new AppError('You do not have the permission to perform this action', 403));
            }
        }

        const doc = await Model.findByIdAndDelete(req.params.id);

        if (!doc) {
            return next(new AppError('No document found with the ID', 404));
        }

        // 204 is 'NO CONTENT'
        res.status(204).json({
            status: 'success',
            data: null,
        });
    });

exports.updateOne = (Model) =>
    catchAsyncError(async (req, res, next) => {
        const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // return the modified document rather than the original
            runValidators: true,
        });

        // If we pass in a valid ID (by changing a character in a real existing ID), then this is not an error, it will return 200 with data is null, so we have to catch it.
        if (!doc) {
            return next(new AppError('No document found with the ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: { data: doc },
        });
    });

exports.createOne = (Model) =>
    catchAsyncError(async (req, res, next) => {
        const newDoc = await Model.create(req.body);

        res.status(201).json({
            status: 'success',
            data: { data: newDoc },
        });
    });

exports.getOne = (Model, popOptions) =>
    catchAsyncError(async (req, res, next) => {
        let query = Model.findById(req.params.id);
        if (popOptions) query = query.populate(popOptions);

        const doc = await query;

        // If we pass in a valid but nonexistent ID (by changing a character in a real existing ID), note that this is not an error, so we have to catch it.
        if (!doc) {
            return next(new AppError('No document found with the ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: { data: doc },
        });
    });

exports.getAll = (Model) =>
    catchAsyncError(async (req, res, next) => {
        // This filter applies to getting all reviews of a certain tour, tourId comes from nested parent route so it won't affect other middlewares which use getAll()
        let filter = {};
        if (req.params.tourId) filter = { tour: req.params.tourId };

        // Get query
        const features = new APIFeatures(Model.find(filter), req.query).filter().sort().limitFields().paginate();
        // Execute query
        const doc = await features.queryMong;

        // Send response
        res.status(200).json({
            status: 'success',
            results: doc.length,
            data: { data: doc },
        });
    });
