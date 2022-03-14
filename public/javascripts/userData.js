// function's related to user data API


// saved notes functions
    function getSavedNotes(uid) {
        return fetch("/api/savedNotes", {
            method: "POST",
            headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
            body: JSON.stringify({userId: uid})}
        );
    }

    function unsaveNote(noteId, userToken) {
        return fetch("/api/deleteSavedNote", {
            method: "POST",
            headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
            body: JSON.stringify({userToken: userToken, note: noteId})}
        );
    }

    function saveNote(noteId, userToken) {
        return fetch("/api/saveNote", {
            method: "POST",
            headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
            body: JSON.stringify({userToken: userToken, note: noteId})}
        );
    }


// account management functions
    function deleteAccount(userToken) {
        return fetch("/api/deleteAccount", {
            method: "POST",
            headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
            body: JSON.stringify({userToken: userToken })}
        );
    }
