const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400); // BAD REQUEST
};
const handleDuplicateFieldsDB = (err) => {
    // const value = err.errmsg.match(/"(.*?)"/);
    const message = `Duplicate field value: "${err.keyValue.name}". Please use another value.`;
    return new AppError(message, 400); // BAD REQUEST
};
const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);

    const message = `Invalid input data: ${errors.map((error, index) => `${index + 1}. ${error}.`).join(' ')}`;
    return new AppError(message, 400); // BAD REQUEST
};

const handleJWTError = () => new AppError('Invalid token! Please log in again.', 401);
const handleJWTExpiredError = () => new AppError('Your session has expired, please log in again', 401);

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
    });
};
const sendErrorProd = (err, res) => {
    // Only send exact error messages if the error is defined by ourselves
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }
    // else just send a generic message
    else {
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong',
        });
    }
};

module.exports = (err, req, res, next) => {
    // console.log(err.stack);
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === 'production') {
        // In the Error class, name/message property will be moved into the Object Prototype, so if destruct it, the name/message property won't be copied.
        // let error = { ...err };
        let error = Object.create(err);

        // Mostly: Invalid ID
        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error); // This error comes from MongoDB, but not Mongoose, si can't point to it using error.name
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError(error);

        sendErrorProd(error, res);
    }
};
