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

module.exports = app;
