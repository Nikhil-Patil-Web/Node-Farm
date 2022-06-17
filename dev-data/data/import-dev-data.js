/* eslint-disable no-console */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
// eslint-disable-next-line import/extensions
const Tour = require('../../models/tourmodels.js');
const Review = require('../../models/reviewModels');
const User = require('../../models/userModels');

dotenv.config({ path: './../../config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB CONNECTION SUCCESSFUL!'));

//READ THE JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

//IMPORT DATA INTO DB

const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews, { validateBeforeSave: false });
    console.log('Data loaded successfully');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

//DELETE ALL DATA FROM DB COLLECTION
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Database deleted successfully');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

console.log(process.argv);
