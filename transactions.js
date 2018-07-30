const db = require('./db')
const cards = require('./cards')

function save(transaction){
  if (transaction['guid'] == null) throw "ERROR_INVALID_INPUT_PROPERTIES";
  db.push('transactions', transaction);
}

function reverse(transactionGuid, cardNumber){
  var transaction = getTransaction(transactionGuid, cardNumber);
  var method = transaction['method'];
  var amount = transaction['amount'];
  var cardNumber = transaction['cardNumber'];
  var card;
  switch(method){
    case "activate":
      card = cards.deactivate(cardNumber);
      break;
    case "redeem":
      card = cards.addValue(cardNumber, amount);
      break;
    case "add_value":
      card = cards.redeem(cardNumber, amount);
      break;
  }
  return card['balance'];
}

function getTransaction(transactionGuid, cardNumber){
  var txn = db.find('transactions', {
    guid: transactionGuid,
    cardNumber: cardNumber
  });
  if (txn == null) throw "ERROR_TRANSACTION_TO_REVERSE_DOES_NOT_EXIST";
  return txn;
}

module.exports = {save, reverse}
