// custom render functions

module.exports = {
    renderAdNotes: function (note) {
        const blockIcons = {
            ["note"]: '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>',
            ["hint, tip"]: '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd" /></svg>',
            ["info"]: '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
            ["quote"]: '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 32 24"><path fill="white" d="M0 0v12h8c0 4.41-3.586 8-8 8v4c6.617 0 12-5.383 12-12V0H0zm20 0v12h8c0 4.41-3.586 8-8 8v4c6.617 0 12-5.383 12-12V0H20z"/></svg>'
        };

        // blocks with titles
        let adNoteRegex = new RegExp(/```ad-([\w\-]+)(?:.*|\n*)title: (.*)((?:.|\n)*?)```/g);
        let matches = note.matchAll(adNoteRegex);

        for (const match of matches) {
            adNoteRegex = new RegExp(/```ad-([\w\-]+)(?:.*|\n*)title: (.*)((?:.|\n)*?)```/g);
            const groups = adNoteRegex.exec(match[0]);

            const type = groups[1];
            const title = groups[2];
            const content = groups[3];
            let icon;

            for (const blockKey in blockIcons) {
                if (blockKey.includes(type)) {
                    icon = blockIcons[blockKey];
                    break;
                }
            }

            const r = `<div class="${type}-block rounded-2xl px-4 pb-2 pt-0.5 my-3 bg-gray-900">` +
                      '<p class="b-title">' + icon + title + '</p>' + '\n\n' + content + "</div>";

            note = note.replace(match[0], r);
        }

        // blocks without titles  TODO: do it in a better way than two regexs
        adNoteRegex = new RegExp(/```ad-([\w\-]+)((?:.|\n)*?)```/g);
        matches = note.matchAll(adNoteRegex);

        for (const match of matches) {
            adNoteRegex = new RegExp(/```ad-([\w\-]+)((?:.|\n)*?)```/g);
            const groups = adNoteRegex.exec(match[0]);

            const type = groups[1];
            const content = groups[2];
            let icon;

            for (const blockKey in blockIcons) {
                if (blockKey.includes(type)) {
                    icon = blockIcons[blockKey];
                    break;
                }
            }

            const r = `<div class="${type}-block rounded-2xl px-4 pb-2 pt-0.5 my-3 bg-gray-900">` +
                      '<p class="b-title">' + icon + '</p>' + '\n\n' + content + "</div>";

            note = note.replace(match[0], r);
        }

        return note
    }
}
