const express = require('express');
const morgan = require('morgan');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1) Middlewares
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}
// express.json() here is a middleware, which is basically a function that can modify the incoming request data.
// Its name stands for standing between the request and response.
app.use(express.json());
// Serving static files in Express, just an introduction, won't use in this project
/*
Then go to domain/overview.html
But why not domain/public/overview.html? Because when go to a route that doesn't exist in our defined routes, it will go to the public folder (since we USE it below), and then set the public folder as the root.
*/
app.use(express.static(`${__dirname}/public`));

// 3) Routes
/* version 1
app.get('/api/v1/tours', getAllTours);
app.get('/api/v1/tours/:id', getTour);
app.post('/api/v1/tours', createTour);
app.patch('/api/v1/tours/:id', updateTour);
app.delete('/api/v1/tours/:id', deleteTour);
*/
/* version 2
app.route('/api/v1/tours').get(getAllTours).post(createTour);
app.route('/api/v1/tours/:id').get(getTour).patch(updateTour).delete(deleteTour);

app.route('/api/v1/users').get(getAllUsers).post(createUser);
app.route('/api/v1/users/:id').get(getUser).patch(updateUser).delete(deleteUser);
*/
/* version 3 */
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// Must must must place this as the last route
// The app.all() function is used to routing all types of HTTP request. Like POST, GET, PUT, DELETE, etc.
app.all('*', (req, res, next) => {
    // res.status(404).json({
    //     status: 'fail',
    //     message: `Can't find ${req.originalUrl} on this server`,
    // });

    const err = new Error(`Can't find ${req.originalUrl} on this server`);
    err.status = 'fail';
    err.statusCode = 404;

    // If the next() function receives an argument, no matter what it is, Express will automatically assume it is an error (this mechanism applies to every middleware anywhere in our app). Then it will skip all the other middlewares in the middleware stack, and send the error to our global error handling middleware.
    next(err);
});

// By specifying FOUR parameters, Express automatically knows that this is an error handling middleware
app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
    });
});

module.exports = app;
