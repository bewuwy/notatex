const express = require('express');
const path = require('path');

const cookieParser = require('cookie-parser');
const logger = require('morgan');

const axios = require('axios');

const { Remarkable } = require('remarkable');

const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

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

// notes
app.get('/note/:title', (req, res) => {
  // get note from github repo
  axios
      .get(`https://raw.githubusercontent.com/bewu-ib/digital-garden/master/_notes/${req.params["title"]}.md`)
      .then(aRes => {
          const md = new Remarkable();

          let note = md.render(aRes.data);
          note = DOMPurify.sanitize(note);

          let title = req.params["title"];
          title = title.toString().replace(\-\g, " ");

          res.render("note", { title: title, content: note });
      })
      .catch(error => {
          console.error(error);
          res.send(error.toString());
  });
});

// catch 404
app.use(function(req, res) {
  res.status(404).send('Bruh... 404...<br>' + req.url + " not found");
});

module.exports = app;

const PORT = process.env.PORT || 8080;
app.listen(PORT);
