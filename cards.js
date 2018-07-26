const db = require('./db')

function activate(identifier, initialBalance) {
  if(getCard(identifier)['active']) throw "ERROR_CARD_ALREADY_ACTIVATED";
  return setActivate(identifier, initialBalance, true);
}

function deactivate(identifier) {
  if(!getCard(identifier)['active']) throw "ERROR_CARD_NOT_ACTIVATED";
  return setActivate(identifier, "0.0", false);
}

function addValue(identifier, amount) {
  var card = getCard(identifier);
  if(!card['active']) throw "ERROR_CARD_NOT_ACTIVATED";
  var origBalance = parseFloat(card['balance']);
  card['balance'] = (origBalance + parseFloat(amount)).toFixed(2); // toFixed(2) will turn the double into a string with 2 places after the decimal
  return update(card);
}

function getBalance(identifier) {
  var card = getCard(identifier);
  if(!card['active']) throw "ERROR_CARD_NOT_ACTIVATED";
  return card['balance'];
}

function redeem(identifier, amount) {
  var card = getCard(identifier);
  if(!card['active']) throw "ERROR_CARD_NOT_ACTIVATED";
  var origBalance = parseFloat(card['balance']);
  var balance = origBalance - parseFloat(amount);
  if (balance < 0.0) balance = 0.0;
  card['balance'] = balance.toFixed(2);
  return update(card);
}

function find(identifier) {
  return getCard(identifier);
}


function setActivate(identifier, initialBalance, activate) {
  var card = getCard(identifier)
  card['active'] = activate;
  if(initialBalance!=null){
    card['balance'] = parseFloat(initialBalance).toFixed(2);
  }
  return update(card);
}

function update(card) {
  db.update('cards', card);
  return card;
}

function getCard(identifier) {
  var card = db.find('cards', {number: identifier});
  if (card == null) throw "ERROR_CARD_INVALID";
  return card;
}

module.exports = {activate, deactivate, addValue, getBalance, redeem, find};
