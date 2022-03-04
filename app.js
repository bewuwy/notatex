//imports

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


// firebase admin setup
const admin = require('firebase-admin');
const serviceAccount = process.env.FIREBASE_PRIVATE;

admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccount))
});


// index
app.get("/", (req, res) => {
    res.render('index');
});


// login
app.get("/login", (req, res) => {
    res.render("login");
});


// account
app.get("/account", (req, res) => {
    res.render("account");
});


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
          title = title.toString().replace(/-/g, " ");

          res.render("note", { title: title, content: note });
      })
      .catch(error => {
          console.error(error);
          res.send(error.toString());
  });
});

// api/savedNotes (userId)
app.post("/api/savedNotes", (req, res) => {
    const userId = req.body.userId;
    if (typeof userId == "undefined") {
        res.status(400).send({"Error": "Missing user id in request body"})
    }

    <!-- TODO: add real saved notes -->

    res.send(["PP-Finanse-Firm", "twoja stara", userId.toString()]);
});

// api/deleteAccount
app.post("/api/deleteAccount", (req, res) => {
    const userId = req.body.userId;
    if (typeof userId == "undefined") {
        res.status(400).send({"Error": "Missing user id in request body"})
    }

    admin.auth().verifyIdToken()

    res.send({"Success": "Deleted account"});
});

// catch 404
app.use(function(req, res) {
  res.status(404).send('Bruh... 404...<br>' + req.url + " not found");
});

module.exports = app;

const PORT = process.env.PORT || 8080;
app.listen(PORT);
