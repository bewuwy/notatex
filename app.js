//imports

// TODO: better index page

const customRender = require("./customRender");
const userAdmin = require("./userAdmin");

const express = require("express");
const path = require("path");

const cookieParser = require("cookie-parser");
const logger = require("morgan");
const axios = require("axios");
const MarkdownIt = require('markdown-it')

const createDOMPurify = require("dompurify");
const {JSDOM} = require("jsdom");
const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

const app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// themes TODO: add more themes
app.locals.themes = {
    default: {name: "Default theme"},
    minimalist: {
        class: "theme-minimalist",
        source: "kepano/obsidian-minimal",
        name: "Minimalist dark"
    },
    primary: {
        class: "theme-primary",
        source: "ceciliamay/obsidianmd-theme-primary",
        name: "Primary",
        fonts: [
            "https://fonts.googleapis.com/css2?family=Karla:wght@600&display=swap"
        ]
    }
};

app.locals.latestVer = {};

// firebase admin setup
const admin = require("firebase-admin");
const {getDatabase} = require("firebase-admin/database");
const {getAuth} = require("firebase-admin/auth");
const serviceAccount = process.env.FIREBASE_PRIVATE;

admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccount)),
    databaseURL: process.env.FIREBASE_DB
});

function renderView(req, res, view, args = {}, code = 200) {
    let defArgs = {theme: req.cookies.theme || "default"};
    for (const key in args) {
        defArgs[key] = args[key];
    }

    const lastUserVer = req.cookies.lastVer;

    const verPromise = new Promise((resolve, reject) => {
        const lCache = app.locals.latestVer;
        if (
            Object.keys(lCache).length > 0 &&
            lCache.tag &&
            lCache.tagDate &&
            (new Date().getTime() - lCache.cacheDate.getTime()) / 1000 < 60 * 60
        )
            resolve(lCache.tag);
        else {
            // get latest changelog
            axios
                .get("https://api.github.com/repos/bewuwy/notatex/releases/latest")
                .catch((e) => {
                    console.error(e);
                    res.send("Server error");
                })
                .then((gRes) => {
                    console.log("Fetched latest version from github");

                    app.locals.latestVer = {
                        tag: gRes.data.tag_name,
                        tagDate: new Date(gRes.data.published_at),
                        changelog: gRes.data.body,
                        cacheDate: new Date()
                    };

                    resolve(gRes.data.tag_name);
                });
        }
    });

    verPromise.then((r) => {
        const latestVer = app.locals.latestVer.tag;
        const updateDate = app.locals.latestVer.tagDate
            .toISOString()
            .split("T")[0];
        const changelog = app.locals.latestVer.changelog;

        if (lastUserVer !== latestVer) {
            const md = new MarkdownIt();

            defArgs["popup"] = {
                title: "Changelog",
                sub: `${latestVer} - ${updateDate}`,
                content: md.render(changelog)
            };
            res.cookie("lastVer", latestVer, {maxAge: 7776000 * 1000}); // 3 months
        }

        res.status(code);
        return res.render(view, defArgs);
    });
}

// index
app.get("/", (req, res) => {
    const db = getDatabase();
    const featured_ref = db.ref("global").child("featured");
    let featured;

    featured_ref.orderByKey().once("value", (snapshot) => {
        let ft_data = snapshot.toJSON();

        featured = Object.keys(ft_data).map(function (k) {
            return ft_data[k];
        });
    }).then((r) => {
        renderView(req, res, "index", {featured: featured});
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

// note view
app.get("/note/:uid/:nid", (req, res) => {
    const userId = req.params["uid"];
    const noteId = req.params["nid"];

    userAdmin.getUserByID(userId).then((user) => {
        if (!user) {
            return renderView(req, res, "404", {}, 404);
        }

        const db = getDatabase();
        const ref = db.ref("/users/" + user.uid + "/info");

        let gitRawUrl;
        let userName = user.displayName;

        ref.once("value", (snapshot) => {
            let data = snapshot.toJSON();

            if (data) {
                gitRawUrl = `https://raw.githubusercontent.com/${data["notesGithub"]}/main/${noteId}.md`;
            } else {
                return renderView(req, res, "404", {}, 404);
            }
        }).then(() => {
            // get note from github repo
            if (gitRawUrl) {
                axios.get(gitRawUrl).then((aRes) => {
                    let note = DOMPurify.sanitize(aRes.data.toString());
                    const md = MarkdownIt({
                        html: true,
                        breaks: true
                    });
                    
                    md.use(require('markdown-it-anchor'));
                    md.use(require("markdown-it-table-of-contents"));

                    note = "\n [[toc]] \n" + note;
                    note = customRender.renderAdNotes(note);
                    note = md.render(note);
                    note = DOMPurify.sanitize(note);

                    const title = noteId.toString().replace(/-/g, " ");

                    return renderView(req, res, "note", {
                        title: title,
                        userName: userName,
                        uid: userId,
                        content: note,
                    });

                }).catch((error) => {
                    console.log(error);

                    if (error.response.status === 404) {
                        return renderView(req, res, "404", {}, 404);
                    } else {
                        console.error(error);
                        return res.send("Server error"); // res.send(error.toString());
                    }
                });
            }
        });
    });
});

// user
app.get("/user/:user", (req, res) => {
    const userId = req.params["user"];

    userAdmin.getUserByID(userId).then((user) => {
        if (!user) {
            return renderView(req, res, "404", {}, 404);
        }

        const db = getDatabase();
        const userRef = db.ref("users").child(user.uid);

        let userName;
        let created;

        userName = user.displayName;
        created = new Date(user.metadata.creationTime);
        created = `${created.getDate()}/${created.getMonth() + 1}/${created.getFullYear()}`;

        let userInfo;
        let notesList;

        userRef.child("/info").once("value", (snapshot) => {
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
                return renderView(req, res, "user", {
                    uid: userId,
                    user: userName,
                    verified: verified,
                    created: created,
                    noteList: []
                });
            }

            if (!notesList) {
                return empty();
            }
            axios.get(notesList).catch(function (error) {
                if (error.response.status === 404) {
                    return empty();
                } else {
                    console.error(error);
                    return res.send(
                        `Server error ${error.response.status}`
                    );
                }
            }).then((r) => {
                if (!r || !r.data || !r.data["tree"]) {
                    return empty();
                }

                let noteList = [];
                for (const dataKey in r.data["tree"]) {
                    const n = r.data["tree"][dataKey]["path"].split(
                        ".md"
                    )[0];
                    noteList.push(n);
                }

                return renderView(req, res, "user", {
                    uid: userId,
                    user: userName,
                    verified: verified,
                    created: created,
                    noteList: noteList
                });
            });
        }).catch((e) => {
            console.log(e);
            return renderView(req, res, "404", {}, 404);
        });
    });
});

// notatex learn view
// app.get('/learn/:title', (req, res) => {
//     const testNote = [
//         {"title": "Skutki kolonializmu",
//         "content":
//             "- rozwinęło się ||**niewolnictwo**||,\n" +
//             "- zaszły zmiany w strukturze:\n" +
//             "\t- ||odmian ludzkich — wśród rdzennych mieszkańców biali ludzie||,\n" +
//             "\t- ||wyznaniowej — wzrósł udział religii dominującej w imperium kolonialnym||,\n" +
//             "\t- językowej — wprowadzano język kraju kolonizującego,\n" +
//             "- narzucane zostały **europejskie style życia** → wypieranie elementów kultury i tradycji rdzennej ludności,\n" +
//             "- intensywnie **eksploatowano surowce naturalne**."},
//         {"title": "Dekolonizacja",
//         "content": "głównie w **XIX i XX w.** \n" +
//             "\n" +
//             "- Najpierw doszło do niej w **Ameryce Północnej**, w *XVIII w.* — 13 brytyjskich kolonii uległo przekształceniu w niepodległe Stany Zjednoczone.\n" +
//             "- Następnie w **Ameryce Łacińskiej**, na skutek walk przeciw Hiszpanii i Portugalii większość krajów odzyskała niepodległość.\n" +
//             "- Po *II wojnie światowej* w **Azji**: Filipiny, Indie, Pakistan.\n" +
//             "- Najpóźniejsza dekolonizacja była w **Afryce**, w *1960 roku* powstało najwięcej krajów (17), dlatego nazwano go **Rokiem Afryki**."},
//         {"title": "Funkcje twojej starej bla bla haha jestem długim tytułem, ale tak frrrrr długim essa z tobą byniu",
//         "content": "O nie, to był ||długi tytuł||"},
//         {"title": "Krótki",
//         "content": "Mam krótki ||tytuł||, ale pierwszą linijkę już nie hahahahahahahahaahahah nie masz starego lore impus weksel weksel weksel rodo rodo rdo usuwam dane ha ha ha ha ha brak starrego"}
//     ]

//     const md = new MarkdownIt();
//     const parserRules = [
//         { pattern: /\|\|(.*?)\|\|/g, replacement: '<span class="spoiler">$1</span>' },
//         // { pattern: "<h\d>(.*?)<\/h\d>/g", replacement: '<b>$1</b>' },
//     ];

//     for (const testNoteKey in testNote) {
//         testNote[testNoteKey]["content"] = md.render(testNote[testNoteKey]["content"]);

//         for (const k in parserRules) {
//             testNote[testNoteKey]["content"] = testNote[testNoteKey]["content"]
//                 .replace(parserRules[k].pattern, parserRules[k].replacement);
//         }
//     }

//     let title = req.params["title"].toString().replace(/-/g, " ");

//     renderView(req, res, "learn", {"title": title, "cards": testNote, "id": req.params['title']});
//     // res.render("learnNote", { title: title, cards: testNote })

//     // // get note from github repo
//     // axios
//     //     .get(`https://raw.githubusercontent.com/bewu-ib/digital-garden/master/_notes/${req.params["title"]}.md`)
//     //     .then(aRes => {
//     //         let title = req.params["title"].toString().replace(/-/g, " ");
//     //
//     //         const md = new MarkdownIt();
//     //         let note = md.render(aRes.data);
//     //
//     //         note = note.toString().split("<h1>");
//     //
//     //         console.log(note);
//     //         res.render("note", { title: title, content: note.join("<br>") });
//     //     })
//     //     .catch(error => {
//     //         if (error.response.status === 404) {
//     //             res.status(404).send('Bruh... 404...<br>' + req.url + " not found");
//     //         }
//     //         else {
//     //             console.error(error);
//     //             res.send(error.toString());
//     //         }
//     //     });
// });

/**
 * @deprecated since v0.2.2, use firebase.database() instead
 * api/saveNote (user token, note id)
 */
app.post("/api/saveNote", (req, res) => {
    const userToken = req.body.userToken;
    const noteId = req.body.note;

    if (typeof userToken == "undefined" || typeof noteId == "undefined") {
        return res
            .status(400)
            .send({Error: "Missing user token and note id in request body"});
    }

    admin
        .auth()
        .verifyIdToken(userToken)
        .then((user) => {
            const db = getDatabase();
            const usersRef = db.ref("users");
            const userRef = usersRef.child(user.uid);
            const savedRef = userRef.child("savedNotes");

            savedRef.push(noteId).then((r) => {
                return res.send({success: "Saved note"});
            });
        })
        .catch((e) => {
            return res.status(400).send({Error: "Wrong user token"});
        });
});

/**
 * @deprecated since v0.2.2, use firebase.database() instead
 * api/deleteSavedNote (user token, note id)
 */
app.post("/api/deleteSavedNote", (req, res) => {
    const userToken = req.body.userToken;
    const noteId = req.body.note;

    if (typeof userToken == "undefined" || typeof noteId == "undefined") {
        return res
            .status(400)
            .send({Error: "Missing user token and note id in request body"});
    }

    admin
        .auth()
        .verifyIdToken(userToken)
        .then((user) => {
            const db = getDatabase();
            const usersRef = db.ref("users");
            const userRef = usersRef.child(user.uid);
            const savedRef = userRef.child("savedNotes");
            let noteRef;

            savedRef
                .orderByValue()
                .equalTo(noteId)
                .once("value", (snapshot) => {
                    noteRef = Object.keys(snapshot.toJSON())[0];
                })
                .then((r) => {
                    savedRef
                        .child(noteRef)
                        .remove()
                        .then((r) => {
                            return res.send({success: "Unsaved note"});
                        });
                });
        })
        .catch((e) => {
            return res.status(400).send({Error: "Wrong user token"});
        });
});

// api/savedNotes (userId)
app.post("/api/savedNotes", (req, res) => {
    const userId = req.body.userId;
    if (typeof userId == "undefined") {
        return res.status(400).send({Error: "Missing user id in request body"});
    }

    const db = getDatabase();
    const usersRef = db.ref("users");
    const userRef = usersRef.child(userId);
    const savedRef = userRef.child("savedNotes");

    savedRef.once("value", (data) => {
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
        return res.status(400).send({Error: e});
    });
});

// api/setCustomId (userToken, customId)
app.post("/api/setCustomId", (req, res) => {
    const userToken = req.body.userToken;
    const customId = req.body.customID;
    if (typeof userToken == "undefined" || typeof customId == "undefined") {
        throw res.status(400).send({Error: "Missing user token and/or custom ID in request body"});
    }

    let e = false;  // TODO: a better way to break a promise chain
    admin.auth().verifyIdToken(userToken)
        .then((user) => {
            const db = getDatabase();

            if (customId === "") {
                let oldCustom;
                db.ref(`/users/${user.uid}/info/customID`).once("value", (snapshot) => {
                    oldCustom = snapshot.toJSON();
                }).then(r => {
                    db.ref(`/users/${user.uid}/info/customID`).remove().then(r => db.ref(`/customID/${oldCustom}`).remove());
                });

                return res.status(200).send({Message: "Success"});
            }

            const idRef = db.ref(`/customID/${customId}`);
            idRef.once("value", (snapshot) => {
                if (snapshot.toJSON()) {  // if custom id is taken
                    e = true;
                    return res.status(400).send({Error: "Custom id taken!"});
                }
            }).then(r => {
                if (e) {
                    return
                }

                const userRef = db.ref(`/users/${user.uid}/info/customID`);

                new Promise((resolve, reject) => {
                    userRef.once("value", (snapshot) => {
                        if (snapshot.toJSON()) {  // user had an old custom ID
                            db.ref(`/customID/${snapshot.toJSON()}`).remove().then(r => resolve());
                        } else {
                            resolve();
                        }
                    })
                }).then(r => {
                    userRef.set(customId).then(r => {
                        idRef.set(user.uid).then(r => {
                            return res.status(200).send({Message: "Success"});
                        });
                    });
                });
            });
        });
});

// api/deleteAccount (userToken)
app.post("/api/deleteAccount", (req, res) => {
    const userToken = req.body.userToken;
    if (typeof userToken == "undefined") {
        return res.status(400).send({Error: "Missing user token in request body"});
    }

    admin.auth().verifyIdToken(userToken)
        .then((r) => {
            const db = getDatabase();
            const usersRef = db.ref("users");
            const userRef = usersRef.child(r["uid"]);

            userRef.remove().then(function () {
                admin.auth().deleteUser(r["uid"]).then((r) => {
                    return res
                        .status(400)
                        .send({Success: "Deleted account"});
                }).catch((e) => {
                    return res
                        .status(400)
                        .send({Error: e, Response: r});
                });
            }).catch((e) => {
                return res.status(400).send({Error: e, Response: r});
            });
        }).catch((e) => {
        return res.status(400).send({Error: "Wrong user token"});
    });
});

// catch 404 or load note
app.use(function (req, res) {
    console.log(req.path.split("/"));

    if (req.path.split("/").length === 3) {
        userAdmin.getUserByID(req.path.split("/")[1]).then(user => {
            if (user) {
                return res.redirect(`/note/${req.path.split("/")[1]}/${req.path.split("/")[2]}`);
            }
            else {
                return renderView(req, res, "404", {}, 404);
            }
        });
    }
    else {
        return renderView(req, res, "404", {}, 404);
    }
});

module.exports = app;

const PORT = parseInt(process.env.PORT) || 8080;
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
