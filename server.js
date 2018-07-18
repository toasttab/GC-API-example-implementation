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
    body = JSON.parse(body) // converting body string to JSON
    var info;
    var identifier;
    var amount;
    switch(transactionType) {
      case "GIFTCARD_ACTIVATE":
        info = body['activateTransactionInformation'];
        identifier = info['giftCardIdentifier'];
        amount = info['initialBalance']
        cards.activate(identifier, amount);
        transactions.save({
          guid: transactionGuid,
          method: "activate",
          amount: amount,
          cardNumber: identifier
        });
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end();
        break;
      case "GIFTCARD_ADD_VALUE":
        info = body['addValueTransactionInformation'];
        identifier = info['giftCardIdentifier'];
        amount = info['additionalValue'];
        cards.addValue(identifier, amount);
        transactions.save({
          guid: transactionGuid,
          method: "add_value",
          amount: amount,
          cardNumber: identifier
        });
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end();
        break;
      case "GIFTCARD_GET_BALANCE":
        info = body['getBalanceTransactionInformation'];
        identifier = info['giftCardIdentifier'];
        var balance = cards.getBalance(identifier);
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(balance);
        res.end();
        break;
      case "GIFTCARD_REDEEM":
        info = body['redeemTransactionInformation'];
        identifier = info['giftCardIdentifier'];
        amount = info['redeemedValue'];
        cards.redeem(info['giftCardIdentifier'], amount);
        transactions.save({
          guid: transactionGuid,
          method: "redeem",
          amount: amount,
          cardNumber: identifier
        });
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end();
        break;
      case "GIFTCARD_REVERSE":
        info = body['reverseTransactionInformation'];
        identifier = info['giftCardIdentifier'];
        var transactionToReverse = info['previousTransaction'];
    }
  });
}).listen(8080);

function errorResponse(res, transactionStatus){
  res.writeHead(400, {'Content-Type': 'text/html'});
  res.write(JSON.stringify({
    transactionStatus: transactionStatus
  }));
  res.end();
}
