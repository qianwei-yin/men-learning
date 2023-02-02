const express = require('express');
const {
    getAllUsers,
    createUser,
    getUser,
    updateUser,
    getMe,
    updateMe,
    deleteUser,
    deleteMe,
} = require('../controllers/userController');
const {
    protect,
    signup,
    login,
    forgetPassword,
    resetPassword,
    updatePassword,
    restrictTo,
} = require('../controllers/authController');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgetPassword', forgetPassword);
router.patch('/resetPassword/:token', resetPassword);

// Because middlewares run in sequence, so
router.use(protect); // Then all of the routes below this line will first run a protect

router.patch('/updatePassword', updatePassword);
router.get('/me', getMe, getUser);
router.patch('/updateMe', updateMe);
router.delete('/deleteMe', deleteMe);

router.use(restrictTo('admin')); // Only administrator can perform these below...

router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
