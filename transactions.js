const db = require('./db')

function create(type, transactionGuid, identifier, amount){
  if (transactionGuid == null) throw "ERROR_INVALID_INPUT_PROPERTIES";
  db.push('transactions', {
    guid: transactionGuid,
    method: type,
    amount: amount,
    cardNumber: identifier,
    reversed: false
  });
}

function update(transaction){
  if (transaction['guid'] == null) throw "ERROR_INVALID_INPUT_PROPERTIES";
  db.udpate('transactions', transaction);
}

function find(transactionGuid, cardNumber){
  var txn = db.find('transactions', {
    guid: transactionGuid,
    cardNumber: cardNumber
  });
  if (txn == null) throw "ERROR_TRANSACTION_DOES_NOT_EXIST";
  return txn;
}

module.exports = {create, update, find}
