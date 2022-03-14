// various utility functions

function createParagraph(text, tooltip="") {
    let p = document.createElement("p");
    p.innerText = text;
    p.title = tooltip;

    return p
}
