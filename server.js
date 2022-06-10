const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXCEPTION!!!! Shutting down..........');
  process.exit(1);
});

dotenv.config({ path: './config.env' });

const app = require('./app');
const { trace } = require('./app');

console.log(app.get('env'));

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('DB has been Connected!');
  });

const port = 3000;
const server = app.listen(port, () => {
  console.log(`App is running on port ${port}.....`);
});

//SAVE
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION!!!! Shutting down..........');
  server.close(() => {
    process.exit(1);
  });
});
