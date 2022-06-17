const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModels');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  res.cookie('jwt', token, cookieOptions);
  //Remove the password
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
    passwordCurrent: req.body.passwordCurrent,
  });
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  console.log(email);
  console.log(password);
  //Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!!', 400));
  }

  //Check if user exists and password is correct
  const user = await User.findOne({ email }).select('+password');
  console.log(user);
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  //If every thing is ok return a token to the client
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  //Getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access', 401)
    );
  }

  //Verification of the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //Check if user still exist and is not deleted
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to the token does not exist', 401)
    );
  }
  //Check if user has changed password by any means
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please login again', 401)
    );
  }
  //Grant Access to protected route
  req.user = currentUser;
  next();
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permisson to perform this', 403)
      );
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //Get the user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that eamil id!', 404));
  }
  //Generate the password reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //Send it to users email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a patch request with your new password
   and passwordConfirm to ${resetURL}.\nIf you didn't forget password, please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token valid for 10 mins only',
      message,
    });
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('There was an error sending the email, try again later', 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //If token has not expired, and there is a user, change the password
  if (!user) {
    return next(new AppError('Token has expired or is invalid', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  //Update the changedPasswordAt Property
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //Log the user in
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //Get the user from the collection
  const user = await User.findById(req.user.id).select('+password');
  //Check if posted current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }
  //If yes, current password is correct then update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //Log in user, send JWT
  createSendToken(user, 200, res);
});
