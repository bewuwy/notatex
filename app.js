//imports

// TODO: better index page
// TODO: api to add own notes
// TODO: optimize API code

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

// themes
// TODO: add more themes
app.locals.themes = {
    "default": {"name": "Default theme"},
    "minimalist": {"class": "theme-minimalist", "source": "kepano/obsidian-minimal", "name": "Minimalist dark"},
    "primary": {"class": "theme-primary", "source": "ceciliamay/obsidianmd-theme-primary", "name": "Primary",
        "fonts": ["https://fonts.googleapis.com/css2?family=Karla:wght@600&display=swap"]},
}

// firebase admin setup
const admin = require('firebase-admin');
const { getDatabase } = require('firebase-admin/database');
const { getAuth } = require("firebase-admin/auth");
const serviceAccount = process.env.FIREBASE_PRIVATE;

admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccount)),
    databaseURL: process.env.FIREBASE_DB,
});


function renderView(req, res, view, args={}, code=200) {
    let defArgs = { "theme": req.cookies.theme || "default" };

    for (const key in args) {
        defArgs[key] = args[key];
    }

    res.status(code);
    return res.render(view, defArgs);
}


// index
app.get("/", (req, res) => {
    const db = getDatabase();
    const featured_ref = db.ref("global").child("featured");
    let featured;

    // TODO: change getting featured notes to on change from once
    featured_ref.orderByKey().once('value', snapshot => {
        let ft_data = snapshot.toJSON();

        featured = Object.keys(ft_data).map(function (k) {
            return ft_data[k];
        });
    }).then(r => {
        renderView(req, res, "index", {"featured": featured})
    });
});


// login
app.get("/login", (req, res) => {
    renderView(req, res, "login");
});


// account
app.get("/account", (req, res) => {
    renderView(req, res, "account");
});


// settings
app.get("/settings", (req, res) => {
    renderView(req, res, "settings");
});


// notes
app.get('/note/:title', (req, res) => {
  // get note from github repo
  axios
      .get(`https://raw.githubusercontent.com/bewu-ib/digital-garden/master/_notes/${req.params["title"]}.md`)
      .then(aRes => {
          let note = DOMPurify.sanitize(aRes.data.toString());
          const md = new Remarkable({html: true, breaks: true});

          // notes with titles
          note = note.replace(/```ad-([\w\-]+)(?:.*|\n*)title:(.*)((?:.|\n)*?)```/g,
              '<div class="$1-block rounded-2xl px-4 pb-2 pt-0.5 my-3 bg-gray-900">' +
              '<p class="b-title">' +
              '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 pen hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">\n' +
              '  <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />\n' +
              '</svg>' +
              '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 fire hidden" viewBox="0 0 20 20" fill="currentColor">\n' +
              '  <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd" />\n' +
              '</svg>' +
              '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 info hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">\n' +
              '  <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />\n' +
              '</svg>' +
              '$2</p>' +
              '\n\n$3' +
              '</div>');

          // notes without titles
          note = note.replace(/```ad-([\w\-]+)((?:.|\n)*?)```/g,
              '<div class="$1-block rounded-2xl px-4 pb-2 pt-0.5 my-3 bg-gray-900">' +
              '<p class="b-title">' +
              '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 pen hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">\n' +
              '  <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />\n' +
              '</svg>' +
              '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 fire hidden" viewBox="0 0 20 20" fill="currentColor">\n' +
              '  <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd" />\n' +
              '</svg>' +
              '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 info hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">\n' +
              '  <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />\n' +
              '</svg>' +
              'Note</p>' +
              '\n\n$2' +
              '</div>');

          note = md.render(note);
          note = DOMPurify.sanitize(note);

          let title = req.params["title"];
          title = title.toString().replace(/-/g, " ");

          renderView(req, res, "note", {"title": title, "content": note});
      })
      .catch(error => {
          console.log(error);

          if (error.response.status === 404) {
              res.status(404).send('Bruh... 404...<br>' + req.url + " not found");
          }
          else {
              console.error(error);
              res.send(error.toString());
          }
  });
});


// user
app.get("/user/:user", (req, res) => {
    const notesList = "https://api.github.com/repos/bewu-ib/digital-garden/git/trees/2b9764451c79a5a9f52632423318ee2d96bf2270";

    const db = getDatabase();
    const userRef = db.ref("users").child(req.params["user"]);

    let user;
    let created;

    getAuth().getUser(req.params["user"]).then(userRecord => {
        // console.log(userRecord);

        user = userRecord.displayName;
        created = new Date(userRecord.metadata.creationTime);
        created = `${created.getDate()}/${created.getMonth()}/${created.getFullYear()}`;

        let userData;
        userRef.once("value", snapshot => {
           userData = snapshot.toJSON();
        }).then(() => {
            let verified = false;
            if (userData && userData.info) {
                verified = userData.info.verified;
            }

            axios.get(notesList).then(r => {
                let noteList = [];
                for (const dataKey in r.data['tree']) {
                    const n = r.data['tree'][dataKey]["path"].split(".md")[0];
                    noteList.push(n);
                }

                return renderView(req, res, "user", {"user": user, "verified": verified, "created": created,
                    "noteList": noteList});
            });
        });
    }).catch(e => {
        user = "User not found";
        console.log(e);

        return renderView(req, res, "404");
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

        savedRef.push(noteId).then(r => {
            return res.send({"success": "Saved note"});
        });
    }).catch((e) => {
        return res.status(400).send({"Error": "Wrong user token"});
    });
});

// api/deleteSavedNote (user token, note id)
app.post("/api/deleteSavedNote", (req, res) => {
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
        let noteRef;

        savedRef.orderByValue().equalTo(noteId).once('value', snapshot => {
            noteRef = Object.keys(snapshot.toJSON())[0];
        }).then(r => {
            savedRef.child(noteRef).remove().then(r => {
                return res.send({"success": "Unsaved note"});
            });
        });
    }).catch((e) => {
        return res.status(400).send({"Error": "Wrong user token"});
    });
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
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
});
