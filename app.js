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
const { getDatabase } = require('firebase-admin/database');
const serviceAccount = process.env.FIREBASE_PRIVATE;

admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccount)),
    databaseURL: process.env.FIREBASE_DB
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
          if (error.response.status === 404) {
              res.status(404).send('Bruh... 404...<br>' + req.url + " not found");
          }
          else {
              console.error(error);
              res.send(error.toString());
          }
  });
});

// api/saveNote (user token, note id)
app.post("/api/saveNote", (req, res) => {
   const userToken = req.body.userToken;
   const noteId = req.body.note;

    if (typeof userToken == "undefined" || typeof noteId == "undefined") {
        return res.status(400).send({"Error": "Missing user token and note id in request body"});
    }

    admin.auth().verifyIdToken(userToken).then(user => {
        const db = getDatabase();
        const usersRef = db.ref('users');
        const userRef = usersRef.child(user.uid);
        const savedRef = userRef.child("savedNotes");

        savedRef.push().set(noteId).then(r => {
            return res.send({"success": "Saved note"});
        });
    }).catch((e) => {
        return res.status(400).send({"Error": "Wrong user token"});
    });
});

// api/deleteSavedNote (user token, note id)
app.post("/api/deleteSavedNote", (req, res) => {
   // TODO: add delete saved note
});

// api/savedNotes (userId)
app.post("/api/savedNotes", (req, res) => {
    const userId = req.body.userId;
    if (typeof userId == "undefined") {
        return res.status(400).send({"Error": "Missing user id in request body"});
    }

    const db = getDatabase();
    const usersRef = db.ref('users');
    const userRef = usersRef.child(userId);
    const savedRef = userRef.child("savedNotes");

    savedRef.once('value', (data) => {
        let savedData = data.val();

        if (savedData) {
            const savedValues = Object.keys(savedData).map(function (key) {
                return savedData[key];
            });

            return res.send(savedValues);
        }
        else {
            return res.send([null]);
        }

    }).catch((e) => {
        return res.status(400).send({"Error": e});
    });
});

// api/deleteAccount (userToken)
app.post("/api/deleteAccount", (req, res) => {
    const userToken = req.body.userToken;
    if (typeof userToken == "undefined") {
        return res.status(400).send({"Error": "Missing user token in request body"});
    }

    admin.auth().verifyIdToken(userToken).then(r => {
        const db = getDatabase();
        const usersRef = db.ref('users');
        const userRef = usersRef.child(r['uid']);

        userRef.remove().then(function () {
            admin.auth().deleteUser(r['uid']).then(r => {
                return res.status(400).send({"Success": "Deleted account"});
            }).catch((e) => {
                return res.status(400).send({"Error": e, "Response": r});
            });
        }).catch(e => {
            return res.status(400).send({"Error": e, "Response": r});
        });
    }).catch((e) => {
        return res.status(400).send({"Error": "Wrong user token"});
    });
});

// catch 404
app.use(function(req, res) {
  res.status(404).send('Bruh... 404...<br>' + req.url + " not found");
});

module.exports = app;

const PORT = process.env.PORT || 8080;
app.listen(PORT);
