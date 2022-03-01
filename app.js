const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// index
const indexRouter = require('./routes/index');
app.use('/', indexRouter);

// catch 404
app.use(function(req, res) {
  res.status(404).send('Bruh... 404...<br>' + req.url + " not found");
});

module.exports = app;

const PORT = process.env.PORT || 8080;
app.listen(PORT);
