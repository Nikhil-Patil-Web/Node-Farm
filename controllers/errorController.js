const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value);
  const message = `Duplicate Field Value: ${value}. Please use another value`;
  return new AppError(message, 400);
};
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join(',')}`;
  return new AppError(message, 400);
};

const handleJWTError = new AppError('Invalid token! Please login again', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const handleJWTExpiredError = new AppError(
  'Your token has expired!Please log in again!',
  401
);

const sendErrorProd = (err, res) => {
  //Operational, trusted error: send message to the client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    //Programming or unknown error
  } else {
    //Log the error
    console.error('ERROR!!!', err);
    //Send a generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong',
    });
  }
};

module.exports = (err, req, res, next) => {
  //   console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    if (error.name === 'CastError') {
      // eslint-disable-next-line no-const-assign
      error = handleCastErrorDB(error);
    }
    if (error.code === 11000) {
      // eslint-disable-next-line no-const-assign
      error = handleDuplicateFieldsDB(error);
    }
    if (error.name === 'ValidationError') {
      // eslint-disable-next-line no-const-assign
      error = handleValidationErrorDB(error);
    }
    if (error.name === 'JsonWebTokenError') {
      // eslint-disable-next-line no-const-assign
      error = handleJWTError(error);
    }
    if (error.name === 'TokenExpiredError') {
      // eslint-disable-next-line no-undef
      error = handleJWTExpiredError();
    }
    sendErrorProd(error, res);
  }
};
