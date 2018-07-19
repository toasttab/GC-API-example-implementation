const db = require('./db')
const cards = require('./cards')

function save(transaction){
  db.push('transactions', transaction);
}

function reverse(transactionGuid){
  var transaction = getTransaction(transactionGuid);
  var method = transaction['method'];
  var amount = transaction['amount'];
  var cardNumber = transaction['cardNumber'];
  switch(method){
    case "activate":
      cards.deactivate(cardNumber);
      break;
    case "redeem":
      cards.addValue(cardNumber, amount);
      break;
    case "add_value":
      cards.redeem(cardNumber, amount);
      break;
  }
}

function getTransaction(transactionGuid){
  return db.find('transactions', {guid: transactionGuid});
}

module.exports = {save, reverse}
