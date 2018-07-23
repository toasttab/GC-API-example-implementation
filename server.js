const http = require('http');
const cards = require('./cards')
const transactions = require('./transactions')

http.createServer(function (req, res) {
  if(req.method != 'POST') return errorResponse(res);
  var transactionType = req.headers['Toast-Transaction-Type'.toLowerCase()]; // toLowerCase because the http module
  var transactionGuid = req.headers['Toast-Transaction-GUID'.toLowerCase()]; //     stores all headers as lowercase
  if(transactionType == null) return errorResponse(res, "ERROR_INVALID_TOAST_TRANSACTION_TYPE");
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString(); // converting body buffer to string
  });
  req.on('end', () => {
    console.log('Request recieved: ' + body);
    body = JSON.parse(body) // converting body string to JSON
    var info;
    var identifier;
    var amount;
    var card;
    var responseBody;
    switch(transactionType) {
      case "GIFTCARD_ACTIVATE":
        try {
          info = getPropOrErr(body, 'activateTransactionInformation');
          identifier = getPropOrErr(info, 'giftCardIdentifier');
          amount = getPropOrErr(info, 'initialBalance');
          card = cards.activate(identifier, amount);
        } catch (e) {
          errorResponse(res, e);
          return
        }
        transactions.save({
          guid: transactionGuid,
          method: "activate",
          amount: amount,
          cardNumber: identifier
        });
        responseBody = {
          activateResponse: {
            currentBalance: card['balance']
          }
        };
        successResponse(res, responseBody);
        return;
      case "GIFTCARD_ADD_VALUE":
        try {
          info = getPropOrErr(body, 'addValueTransactionInformation');
          identifier = getPropOrErr(info, 'giftCardIdentifier');
          amount = getPropOrErr(info, 'additionalValue');
          card = cards.addValue(identifier, amount);
        } catch (e) {
          errorResponse(res, e);
          return;
        }
        transactions.save({
          guid: transactionGuid,
          method: "add_value",
          amount: amount,
          cardNumber: identifier
        });
        responseBody = {
          addValueResponse: {
            currentBalance: card['balance']
          }
        };
        successResponse(res, responseBody);
        return;
      case "GIFTCARD_GET_BALANCE":
        try {
          info = getPropOrErr(body, 'getBalanceTransactionInformation');
          identifier = getPropOrErr(info, 'giftCardIdentifier');
          var balance = cards.getBalance(identifier);
        } catch (e) {
          errorResponse(res, e);
          return;
        }
        responseBody = {
          getBalanceResponse: {
            currentBalance: balance
          }
        };
        successResponse(res, responseBody);
        return;
      case "GIFTCARD_REDEEM":
        try {
          info = getPropOrErr(body, 'redeemTransactionInformation');
          identifier = getPropOrErr(info, 'giftCardIdentifier');
          amount = getPropOrErr(info, 'redeemedValue');
          var origBalance = parseFloat(cards.find(info['giftCardIdentifier'])['balance']);
          card = cards.redeem(info['giftCardIdentifier'], amount);
        } catch (e) {
          errorResponse(res, e);
          return;
        }
        transactions.save({
          guid: transactionGuid,
          method: "redeem",
          amount: amount,
          cardNumber: identifier
        });
        responseBody = {
          redeemResponse: {
            currentBalance: card['balance'],
            redeemedValue: (origBalance - parseFloat(card['balance'])).toFixed(2)
          }
        };
        successResponse(res, responseBody);
        return;
      case "GIFTCARD_REVERSE":
        try {
          info = getPropOrErr(body, 'reverseTransactionInformation');
          identifier = getPropOrErr(info, 'giftCardIdentifier');
          var prevTxn = getPropOrErr(info, 'previousTransaction');
          // logic for reversing a transaction is handled in transactions.js
          var balance = transactions.reverse(prevTxn, identifier);
        } catch (e) {
          errorResponse(res, e);
          return;
        }
        responseBody = {
          reverseResponse: {
            currentBalance: balance
          }
        };
        successResponse(res, responseBody);
    }
  });
}).listen(18181);

function successResponse(res, responseBody) {
  responseBody['transactionStatus'] = "ACCEPT";
  responseBody = JSON.stringify(responseBody);
  res.writeHead(200, {'Content-Type': 'application/json'});
  console.log('Successful response: ' + responseBody)
  res.end(responseBody);
}

function errorResponse(res, transactionStatus) {
  res.writeHead(400, {'Content-Type': 'application/json'});
  console.log('Error response: ' + transactionStatus);
  res.end(JSON.stringify({
    transactionStatus: transactionStatus
  }));
}

function getPropOrErr(info, infoProperty) {
  var prop = info[infoProperty];
  if (prop == null) {
    throw "ERROR_INVALID_INPUT_PROPERTIES"
  }
  return prop;
}
