const crypto = require('crypto');
const { promisify } = require('util'); // const utils = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsyncError = require('../utils/catchAsyncError');
const sendEmail = require('../utils/email');

// The three variables are: payload, secret, lifetime
const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_LIFETIME });

/*
cookies is a small piece of text that a server can send to clients, when clients receive the cookies, it will automatically store it and send it back along with all future requests to the same server.
*/
const createAndSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_LIFETIME * 24 * 60 * 60 * 1000),
        httpOnly: true,
    };
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);

    user.password = undefined; // Not delete it from database since we don't save it, just for not showing in the response
    res.status(statusCode).json({
        status: 'success',
        token,
        data: { user },
    });
};

exports.signup = catchAsyncError(async (req, res, next) => {
    // This line below has a flaw: Anyone could do something to the req.body and register him as an admin.
    // const newUser = await User.create(req.body);

    // Only pass these four into the document, as for role, passwordChangedAt... Just edit them manually in the database.
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
    });

    createAndSendToken(newUser, 201, res);
});

exports.login = catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body;

    // 1) Check if email and password have input
    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }

    // 2) Check if user exists & password is correct
    const user = await User.findOne({ email }).select('+password'); // Because it is set to be false in the schema. And this does NOT mean we only get password field, just select password back.

    if (!user || !(await user.comparePassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401)); // 401 is UNAUTHORIZED
    }

    // 3) If everything ok, send token to client
    createAndSendToken(user, 200, res);
});

exports.protect = catchAsyncError(async (req, res, next) => {
    // 1) Getting token and check if it's there
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('You are not logged in.', 401));
    }

    // 2) Verification token: Is it unmodified (valid) or unexpired
    // jwt.verify() can be an asynchronous function if we give a callback function as the last parameter.
    // But we want to use our async-await pattern that can go to globalErrorHandler when promise is rejected.
    // So we use util.promisify() which can return a version of the same that returns a PROMISE instead of a callback.
    // And now promisify(jwt.verify)() is a new version of jwt.verify(), they are the same function. But the former one will return a promise.
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // decoded has 3 properties: info we passed in (in this case is id), issued time and expire time

    // 3) Check if user still exists (Imagine one log in to delete his account?)
    const stillUser = await User.findById(decoded.id);
    if (!stillUser) {
        return next(new AppError('The user belonging to current token does no longer exist.', 401));
    }

    // 4) Check if user changed password after the token was issued (Imagine token is leaked and someone change his password?)
    if (stillUser.changedPasswordAfterIssued(decoded.iat)) {
        return next(new AppError('User recently changed password. Please log in again.', 401));
    }

    // Then grant access to protected routes
    req.user = stillUser; // If we want some info be passed to next middleware, just pass it like so
    next();
});

// We cannot pass arguments into a middleware, so we first create a normal function and pass in the roles argument, then return a middleware
exports.restrictTo =
    (...roles) =>
    (req, res, next) => {
        // req.user comes from 'protect' middleware
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have the permission to perform this action', 403)); // 403 is FORBIDDEN
        }

        next();
    };

exports.forgetPassword = catchAsyncError(async (req, res, next) => {
    // 1) Get user based on the POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError('There is no user with this email address.', 404));
    }

    // 2) Generate a random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false }); // if keeping validators alive, then because in this scenario we don't have any user inputs, so the validations will fail since passwordConfirm are not passed in (we set to undefined after every saving). So turn it off.
    // Why no need to worry about data validation if turning off the validators?
    // Because /forgetPassword is a server-side action, there is no user inputs that need to be validated.

    // 3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.
    If you didn't forget, please ignore this email.`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token (valid for 30 min).',
            message,
        });

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!',
        });
    } catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('There was an error sending the email. Try again later.', 500));
    }
});

exports.resetPassword = catchAsyncError(async (req, res, next) => {
    // 1) Get user based on token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });

    // 2) If token has not expired and there is user, set the new password
    if (!user) {
        return next(new AppError('Token is invalid or has expired.', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Update changedPasswordAt property
    // 4) Log the user in, send JWT
    createAndSendToken(user, 200, res);
});

exports.updatePassword = catchAsyncError(async (req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user._id).select('+password');

    // 2) Check if POSTed current password is correct
    if (!(await user.comparePassword(req.body.oldPassword, user.password))) {
        return next(new AppError('Old password is not correct.', 401));
    }

    // 3) If so, update password
    user.password = req.body.newPassword;
    user.passwordConfirm = req.body.newPasswordConfirm;
    await user.save(); // User.findByIdAndUpdate won't trigger validators!

    // 4) Log user in, send JWT (by doing so will deny the previous JWT)
    createAndSendToken(user, 200, res);
});
