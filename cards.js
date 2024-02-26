const db = require('./db')
const transactions = require('./transactions')

function activate(transactionGuid, identifier, initialBalance) {
  var card = find(identifier)
  if(card['active']) throw "ERROR_CARD_ALREADY_ACTIVATED";
  card['active'] = true;
  if(initialBalance!=null){
    card['balance'] = parseFloat(initialBalance).toFixed(2);
  }
  transactions.create('activate', transactionGuid, identifier, initialBalance);
  return update(card);
}

function addValue(transactionGuid, identifier, amount) {
  var card = find(identifier);
  if(!card['active']) throw "ERROR_CARD_NOT_ACTIVATED";
  var origBalance = parseFloat(card['balance']);
  card['balance'] = (origBalance + parseFloat(amount)).toFixed(2); // toFixed(2) will turn the double into a string with 2 places after the decimal
  transactions.create('add_value', transactionGuid, identifier, amount);
  return update(card);
}

function getBalance(identifier, verificationCode) {
  var card = find(identifier);
  validateVerificationCode(verificationCode, identifier, card);
  if(!card['active']) throw "ERROR_CARD_NOT_ACTIVATED";
  return card['balance'];
}

function redeem(transactionGuid, identifier, verificationCode, amount) {
  var card = find(identifier);
  validateVerificationCode(verificationCode, identifier, card);
  if(!card['active']) throw "ERROR_CARD_NOT_ACTIVATED";
  var requestedAmount = parseFloat(amount);
  var origBalance = parseFloat(card['balance']);
  var balance = origBalance - requestedAmount;
  var actualAmount;
  if (balance < 0.0) {
    actualAmount = origBalance;
    balance = 0.0;
  } else {
    actualAmount = requestedAmount;
  }
  card['balance'] = balance.toFixed(2);
  transactions.create('redeem', transactionGuid, identifier, actualAmount);
  return update(card);
}

function reverse(newTransactionGuid, oldTransactionGuid, identifier) {
  var card = find(identifier);
  if(!card['active']) throw "ERROR_CARD_NOT_ACTIVATED";
  var transaction = transactions.find(oldTransactionGuid, identifier);
  if (transaction['reversed']) throw "ERROR_TRANSACTION_ALREADY_REVERSED"
  var currentBalance = parseFloat(card['balance']);
  var transactionAmount = parseFloat(transaction['amount']);
  switch(transaction['method']){
    case "activate":
      // If the current balance is different than the original balance, that means there have
      // already been transactions on the card, which means it's too late to reverse the activate
      if (currentBalance != transactionAmount) throw "ERROR_TRANSACTION_CANNOT_BE_REVERSED"
      card['active'] = false;
      card['balance'] = '0.00';
      break;
    case "redeem":
      card['balance'] = (currentBalance + transactionAmount).toFixed(2);
      break;
    case "add_value":
      if (currentBalance < transactionAmount) throw "ERROR_TRANSACTION_CANNOT_BE_REVERSED"
      card['balance'] = (currentBalance - transactionAmount).toFixed(2);        
      break;
    default:
      throw "ERROR_TRANSACTION_CANNOT_BE_REVERSED"
  }
  transaction['reversed'] = true;
  transactions.update(transaction);
  transactions.create('reverse', newTransactionGuid, identifier, -1 * transactionAmount);
  return update(card);
}

function find(identifier) {
  var card = db.find('cards', {number: identifier});
  if (card == null) throw "ERROR_CARD_INVALID";
  return card;
}

function update(card) {
  db.update('cards', card);
  return card;
}

function validateVerificationCode(verificationCode, identifier, card) {
  if (verificationCode['source'] === 'VERIFIED' || identifier['source'] === 'SWIPE') { return }

  if (!verificationCode || !verificationCode['value'] || verificationCode.length === 0) {
    throw "ERROR_VERIFICATION_REQUIRED";
  }

  if (verificationCode['value'] !== card['verificationCode']) {
    throw "ERROR_VERIFICATION_FAILED";
  }
}

module.exports = {activate, addValue, getBalance, redeem, reverse, find};
