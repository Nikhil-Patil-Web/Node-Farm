const express = require('express');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const hpp = require('hpp');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const userRouter = require('./routes/userRoutes');
const tourRouter = require('./routes/tourRoutes');
const reviewRouter = require('./routes/reviewRoutes');

const app = express();

const newLocal = process.env.NODE_ENV === 'development';
// MiddleWare

//SET SECURITY HTTP HEADERS
app.use(helmet());

//Development logging
if (newLocal) {
  app.use(morgan('dev'));
}

//Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowsMS: 60 * 60 * 1000,
  message: 'Too many requests from one IP, please try again in an hour!',
});
app.use('/api', limiter);

//Body parser reading data from body into req.body

app.use(express.json({ limit: '10kb' }));

//Data Sanitization against NoSQL Query injection
app.use(mongoSanitize());

//Data sanitization against XSS
app.use(xss());

//Preventing Parameter Pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

//Serving the static files
app.use(express.static(`${__dirname}/public`));

//Some test middleware
app.use((req, res, next) => {
  // console.log(req.headers);
  req.requestTime = new Date().toISOString();
  next();
});
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  // const err = new Error(`Can't find the ${req.originalUrl} on this server`);
  // err.status = 'fail';
  // err.statusCode = 404;
  next(new AppError(`Can't find the ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
