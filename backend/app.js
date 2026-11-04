// This is the main file for the backend

// import functionalities
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');

const cors = require('cors');
// allow using a .env file
require('dotenv').config(); //require the dotenv

// creates a new instance of express application
const app = express();

// add cors header to the server
app.use(
  cors({
    origin: '*'
  })
);

// suppress mongoose warning to prepare for new version
mongoose.set('strictQuery', false);

// sets up mongoose for the mongoDB connection
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log('Database connection Success!');
  })
  .catch((err) => {
    console.error('Mongo Connection Error', err);
  });

// declare port number for the api
const PORT = process.env.PORT || 3000;

// setup and access request body
app.use(express.json());
app.use(morgan('dev'));

// root endpoint so opening the API base URL returns a status instead of a 404
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// browsers request this automatically when opening the API base URL
app.get('/favicon.ico', (req, res) => res.sendStatus(204));

// setup middle ware for routes
app.use('/clients', require('./routes/clients'));
app.use('/events', require('./routes/events'));
app.use('/org', require('./routes/org'));
app.use('/services', require('./routes/services'));
app.use('/users', require('./routes/users'));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// error handler
app.use(function (err, req, res, next) {
  // logs error to console. Not the whole request, since its headers contain the user's token
  console.error(err.message);
  // missing or invalid values in a request are the caller's mistake, not a server failure
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    err.statusCode = 400;
  }
  if (!err.statusCode) {
    err.statusCode = 500;
  }
  res.status(err.statusCode).send(err.message);
});
