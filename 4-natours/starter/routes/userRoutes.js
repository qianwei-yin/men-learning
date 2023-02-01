const express = require('express');
const {
    getAllUsers,
    createUser,
    getUser,
    updateUser,
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
} = require('../controllers/authController');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);

router.post('/forgetPassword', forgetPassword);
router.patch('/resetPassword/:token', resetPassword);
router.patch('/updatePassword', protect, updatePassword);

router.patch('/updateMe', protect, updateMe);
router.delete('/deleteMe', protect, deleteMe);

router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
