const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) Global Middlewares
////////// Serving static files in Express,
/*
Then go to domain/overview.html
But why not domain/public/overview.html? Because when go to a route that doesn't exist in our defined routes, it will go to the public folder (since we USE it below), and then set the public folder as the root.
*/
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

////////// Set security HTTP headers
// app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'", 'data:', 'blob:', 'https:', 'ws:'],
                baseUri: ["'self'"],
                fontSrc: ["'self'", 'https:', 'data:'],
                scriptSrc: [
                    "'self'",
                    'https:',
                    'http:',
                    'blob:',
                    'https://*.mapbox.com',
                    'https://js.stripe.com',
                    'https://m.stripe.network',
                    'https://*.cloudflare.com',
                ],
                frameSrc: ["'self'", 'https://js.stripe.com'],
                objectSrc: ["'none'"],
                styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
                workerSrc: [
                    "'self'",
                    'data:',
                    'blob:',
                    'https://*.tiles.mapbox.com',
                    'https://api.mapbox.com',
                    'https://events.mapbox.com',
                    'https://m.stripe.network',
                ],
                childSrc: ["'self'", 'blob:'],
                imgSrc: ["'self'", 'data:', 'blob:'],
                formAction: ["'self'"],
                connectSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    'data:',
                    'blob:',
                    'https://*.stripe.com',
                    'https://*.mapbox.com',
                    'https://*.cloudflare.com/',
                    'https://bundle.js:*',
                    'ws://127.0.0.1:*/',
                ],
                upgradeInsecureRequests: [],
            },
        },
    })
);

////////// Development logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

////////// Rate limit
const limiter = rateLimit({
    max: 100,
    windowMs: 15 * 60 * 1000,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
});
app.use('/api', limiter);

////////// Body parser
// express.json() here is a middleware, which is basically a function that can modify the incoming request data.
// Its name stands for standing between the request and response.
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

////////// Data sanitization
// Against NoSQL query injection
app.use(mongoSanitize());
// Against XSS
app.use(xss());

////////// Prevent parameter pollution
app.use(
    hpp({
        whitelist: ['duration', 'ratingsAverage', 'ratingsQuantity', 'maxGroupSize', 'difficulty', 'price'],
    })
);

////////// Testing middleware
app.use((req, res, next) => {
    // console.log(req.headers);
    next();
});

// 3) Routes
app.use('/', viewRouter);
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
app.use('/api/v1/reviews', reviewRouter);

// If hits an undefined route:
// Must must must place this as the last route
// The app.all() function is used to routing all types of HTTP request. Like POST, GET, PUT, DELETE, etc.
app.all('*', (req, res, next) => {
    // If the next() function receives an argument, no matter what it is, Express will automatically assume it is an error (this mechanism applies to every middleware anywhere in our app). Then it will skip all the other middlewares in the middleware stack, and send the error to our global error handling middleware.
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// If next(error), then come here
// By specifying FOUR parameters, Express automatically knows that this is an error handling middleware
app.use(globalErrorHandler);

module.exports = app;
