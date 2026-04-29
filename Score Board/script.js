let hscore = 0;
let gscore = 0;
let homescore = document.getElementById('home-score');
let guestscore = document.getElementById('guest-score');

function homePlus0neBtn() {
    hscore += 1
    homescore.textContent = hscore
}

function homePlusTwoBtn() {
    hscore += 2
    homescore.textContent = hscore
}

function homePlusThreeBtn() {
    hscore += 3
    homescore.textContent = hscore
}

function guestPlus0neBtn() {
    gscore += 1
    guestscore.textContent = gscore
}

function guestPlusTwoBtn() {
    gscore += 2
    guestscore.textContent = gscore
}

function guestPlusThreeBtn() {
    gscore += 3
    guestscore.textContent = gscore
}

function reset() {
    hscore = 0
    gscore = 0
    homescore.textContent = hscore
    guestscore.textContent = gscore
}