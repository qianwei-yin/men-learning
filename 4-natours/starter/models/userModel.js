const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A user must have a name'],
    },
    email: {
        type: String,
        required: [true, 'A user must have an email'],
        unique: true,
        lowercase: true, // This is not a validator, just transform
        validate: [validator.isEmail, 'Please provide a valid email'],
    },
    photo: {
        type: String,
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user',
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [8, 'Password must be more than 8 characters'],
        select: false,
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            // Custom validator only works when User.save()/User.create()
            validator: function (val) {
                return val === this.password;
            },
            message: 'Passwords are not the same.',
        },
    },
    passwordChangedAt: {
        type: Date,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false,
    },
});

// Encrypt password and remove passwordConfirm, including existed user changing password and new user creating
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    // Encryption / Hashing password
    this.password = await bcrypt.hash(this.password, 12); // hash() has a synchronous version, but obviously we don't want to do that because we shouldn't block other users from requesting.

    // We don't need it in database, and setting to undefined doesn't break the 'required' rule.
    this.passwordConfirm = undefined;

    next();
});
// if an existed user change password, then trigger
userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 3000; // Sometimes maybe the passwordChangedAt will be a bit later than JWT issued time
    next();
});

// inactive users only exist in the database, we should't find them through queries
userSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
});

// Instance method, will be available on every User documents.
userSchema.methods.comparePassword = async (candidate, reference) => await bcrypt.compare(candidate, reference);

userSchema.methods.changedPasswordAfterIssued = function (JWTIssuedAtTimestamp) {
    // If a user never changed his password, this field will not exist
    if (!this.passwordChangedAt) return false;

    const passwordChangedAtTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return passwordChangedAtTimestamp > JWTIssuedAtTimestamp;
};

userSchema.methods.createPasswordResetToken = function () {
    // Just because this token are less prone to security issues, so just use in-built module 'crypto'
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Why this step? Because we don't want to store the exact token which is actually sent to user
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    console.log(resetToken, this.passwordResetToken);

    this.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 mins

    return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
