//imports

// TODO: better index page
// TODO: api to add own notes
// TODO: optimize API code

const customRender = require("./customRender");

const express = require('express');
const path = require('path');

const cookieParser = require('cookie-parser');
const logger = require('morgan');

const axios = require('axios');

const {Remarkable} = require('remarkable');

const createDOMPurify = require('dompurify');
const {JSDOM} = require('jsdom');
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);


const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// themes
// TODO: add more themes
app.locals.themes = {
    "default": {"name": "Default theme"},
    "minimalist": {"class": "theme-minimalist", "source": "kepano/obsidian-minimal", "name": "Minimalist dark"},
    "primary": {
        "class": "theme-primary", "source": "ceciliamay/obsidianmd-theme-primary", "name": "Primary",
        "fonts": ["https://fonts.googleapis.com/css2?family=Karla:wght@600&display=swap"]
    },
}

// firebase admin setup
const admin = require('firebase-admin');
const {getDatabase} = require('firebase-admin/database');
const {getAuth} = require("firebase-admin/auth");
const serviceAccount = process.env.FIREBASE_PRIVATE;

admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccount)),
    databaseURL: process.env.FIREBASE_DB,
});


function renderView(req, res, view, args = {}, code = 200) {
    let defArgs = {"theme": req.cookies.theme || "default"};

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
app.get('/note/:uid/:nid', (req, res) => {
    const userId = req.params["uid"];
    const noteId = req.params["nid"];

    const db = getDatabase();
    const ref = db.ref("/users/" + userId + "/info");
    let gitRawUrl;
    let userName;

    getAuth().getUser(userId).then(userRecord => {
        userName = userRecord.displayName;

        ref.once("value", snapshot => {
            let data = snapshot.toJSON();

            if (data) {
                gitRawUrl = `https://raw.githubusercontent.com/${data["notesGithub"]}/main/${noteId}.md`;
            } else {
                return renderView(req, res, "404", {}, 404);
            }
        }).then(() => {
            // get note from github repo
            if (gitRawUrl) {
                axios.get(gitRawUrl)
                    .then(aRes => {
                        let note = DOMPurify.sanitize(aRes.data.toString());
                        const md = new Remarkable({html: true, breaks: true});

                        note = customRender.renderAdNotes(note);
                        note = md.render(note);
                        note = DOMPurify.sanitize(note);

                        const title = noteId.toString().replace(/-/g, " ");

                        return renderView(req, res, "note", {
                            "title": title, "userName": userName, "uid": userId,
                            "content": note
                        });
                    })
                    .catch(error => {
                        console.log(error);

                        if (error.response.status === 404) {
                            return renderView(req, res, "404", {}, 404);
                        } else {
                            console.error(error);
                            return res.send("Server error");  // res.send(error.toString());
                        }
                    });
            }
        });
    });
});


// user
app.get("/user/:user", (req, res) => {
    // TODO: custom URLs like /user/bewu
    const userId = req.params["user"];
    const db = getDatabase();
    const userRef = db.ref("users").child(userId);

    let userName;
    let created;

    getAuth().getUser(userId).then(userRecord => {
        // console.log(userRecord);

        userName = userRecord.displayName;
        created = new Date(userRecord.metadata.creationTime);
        created = `${created.getDate()}/${created.getMonth() + 1}/${created.getFullYear()}`;

        let userInfo;
        let notesList;

        userRef.child("/info").once("value", snapshot => {
            userInfo = snapshot.toJSON();

            if (userInfo && userInfo["notesGithub"]) {
                notesList = `https://api.github.com/repos/${userInfo["notesGithub"]}/git/trees/main`;
            }
        }).then(() => {
            let verified = false;
            if (userInfo) {
                verified = userInfo.verified;
            }

            function empty() {
                return renderView(req, res, "user",
                    {"uid": userId, "user": userName, "verified": verified, "created": created, "noteList": []});
            }

            if (!notesList) {
                return empty();
            }
            axios.get(notesList).catch(function (error) {
                if (error.response.status === 404) {
                    return empty();
                } else {
                    console.error(error);
                    return res.send(`Server error ${error.response.status}`);
                }
            }).then(r => {
                if (!r || !r.data || !r.data["tree"]) {
                    return empty();
                }

                let noteList = [];
                for (const dataKey in r.data['tree']) {
                    const n = r.data['tree'][dataKey]["path"].split(".md")[0];
                    noteList.push(n);
                }

                return renderView(req, res, "user", {
                    "uid": userId, "user": userName, "verified": verified, "created": created, "noteList": noteList
                });
            });
        });
    }).catch(e => {
        console.log(e);
        return renderView(req, res, "404", {}, 404);
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
        } else {
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
app.use(function (req, res) {
    return renderView(req, res, "404", {}, 404);
});

module.exports = app;

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
});
