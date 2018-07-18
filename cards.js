const db = require('./db')

function activate(identifier, initialBalance) {
  setActivate(identifier, initialBalance, true);
}

function deactivate(){
  setActivate(identifier, initialBalance, false);
}

function addValue(identifier, amount) {
  var card = getCard(identifier);
  var origBalance = parseFloat(card['balance']);
  card['balance'] = (origBalance + parseFloat(amount)).toFixed(2);
  update(card);
}

function getBalance(identifier) {
  return getCard(identifier)['balance'].toString();
}

function redeem(identifier, amount) {
  var card = getCard(identifier);
  var origBalance = parseFloat(card['balance']);
  card['balance'] = (origBalance - parseFloat(amount)).toFixed(2);
  update(card);
}

function find(identifier){
  return getCard(identifier);
}


function setActivate(identifier, initialBalance, activate){
  var card = getCard(identifier)
  card['active'] = activate;
  if(initialBalance!=null){
    card['balance'] = initialBalance;
  }
  update(card);
}

function update(card){
  db.update('cards', card);
}

function getCard(identifier){
  return db.find('cards', {number: identifier});
}

module.exports = {activate, deactivate, addValue, getBalance, redeem, find};
