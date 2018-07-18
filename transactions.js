const db = require('./db')
const cards = require('./cards')

function save(transaction){
  db.push('transactions', transaction);
}

function reverse(transactionGuid){
  var transaction = getTransaction(transactionGuid);
  var method = transaction['method'];
  var amount = transaction['amount'];
  var card = cards.find(transaction['cardNumber']);
  switch(method){
    case "activate":
      cards.deactivate(card);
      break;
    case "redeem":

      break;
    case "add_value":

      break;
  }
}

function getTransaction(transactionGuid){
  return db.find('transactions', {guid: transactionGuid});
}

module.exports = {save}
