let cards = []
let sum = 0
let hasBlackJack = false;
let isAlive = false;
let message = '';
let messageEL = document.getElementById('message-el');
let sumEL = document.getElementById('sum');
let cardsEL = document.getElementById('cards-el');

let player = {
    name: 'Joshua',
    chips: 145
}

let playerDetails = document.getElementById('player');
playerDetails.textContent = player.name + ': $' + player.chips

function getRandomCard() {
    let random = Math.floor(Math.random() * 13) + 1
    if (random > 10) {
        return 10
    }else if (random === 1) {
        return 11
    }else {
        return random
    }
}

function startGame() {
    let firstCard = getRandomCard()
    let secondCard = getRandomCard()
    cards = [firstCard, secondCard]
    sum = firstCard + secondCard
    isAlive = true
    hasBlackJack = false
    message = ''
    renderGame()
}

function renderGame() {
    document.querySelector('#sum').innerText = sum;
    cardsEL.textContent = 'Cards: '
    for (let i = 0; i < cards.length; i++) {
        cardsEL.textContent += cards[i] + ' '
    }

    sumEL.textContent = sum

    if(sum < 21) {
        message = 'Do you want to draw a new card?'
    } else if(sum === 21) {
        message = 'Wohoo! You have got Blackjack!'
        hasBlackJack = true
    } else {
        message = 'You are out of the game!'
        isAlive = false
    }
    messageEL.textContent = message;
}

function newCard() {
    if (isAlive === true && hasBlackJack === false) 
        {
    let card = getRandomCard()
    cards.push(card)
    sum += card
    renderGame()
    }
}