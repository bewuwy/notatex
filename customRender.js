// custom render functions

module.exports = {
    renderAdNotes: function (note) {
        // ad-notes with titles
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

        // ad-notes without titles
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

        return note
    }
}