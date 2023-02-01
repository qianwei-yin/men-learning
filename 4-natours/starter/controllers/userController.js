const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsyncError = require('../utils/catchAsyncError');
const filterObj = require('../utils/filterObject');

exports.getAllUsers = catchAsyncError(async (req, res, next) => {
    const users = await User.find();

    // Send response
    res.status(200).json({
        status: 'success',
        results: users.length,
        data: { users },
    });
});

exports.getUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'No',
    });
};
exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'No',
    });
};
exports.updateUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'No',
    });
};

exports.updateMe = catchAsyncError(async (req, res, next) => {
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('This route is not for password updates. Please use /updatePassword.', 400));
    }

    // 2) filter out the fields that do not allowed to be updated, like role
    const filteredBody = filterObj(req.body, 'name', 'email');

    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
        new: true,
        runValidators: true, // update validators only run on the paths specified in the update, in this case is the filteredBody
    });

    res.status(200).json({
        status: 'success',
        data: { user: updatedUser },
    });
});

exports.deleteUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'No',
    });
};

exports.deleteMe = catchAsyncError(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user._id, { active: false });

    // 204 is NO CONTENT
    res.status(204).json({
        status: 'success',
        data: null,
    });
});
