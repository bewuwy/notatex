// function's related to user data API


// saved notes functions
    /**
     * @deprecated since v0.2.2, use firebase.database() instead
     */
    function getSavedNotes(uid) {
        return fetch("/api/savedNotes", {
            method: "POST",
            headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
            body: JSON.stringify({userId: uid})}
        );
    }

    /**
     * @deprecated since v0.2.2, use firebase.database() instead
     */
    function unsaveNote(noteId, userToken) {
        return fetch("/api/deleteSavedNote", {
            method: "POST",
            headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
            body: JSON.stringify({userToken: userToken, note: noteId})}
        );
    }

    /**
     * @deprecated since v0.2.2, use firebase.database() instead
     */
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
            body: JSON.stringify({userToken: userToken})}
        );
    }
