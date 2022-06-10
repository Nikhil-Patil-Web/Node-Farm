const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user needs to have a name'],
  },
  email: {
    type: String,
    required: [true, ' A user needs to have a valid email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please enter correct/valid email'],
  },
  photo: String,
  password: {
    type: String,
    required: [true, 'A password is a must'],
    minlength: 8,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
