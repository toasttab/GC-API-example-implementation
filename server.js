const http = require('http')
const https = require('https')
const jwt = require('jsonwebtoken')

const cards = require('./cards')

// get the public key for JWT verification
var req = https.get(publicKeyUrl(), (res) => {
  var rawData = '';
  res.on('data', (chunk) => { rawData += chunk; });
  res.on('end', () => {
    try {
      publicKey = JSON.parse(rawData)['value'];
    } catch (e) {
      console.error(e.message);
    }
  });
});

var port = 18181;

// In a real implementation, HTTPS must be used
http.createServer((req, res) => {
  if (req.method != 'POST') return errorResponse(res);
  var transactionType = req.headers['Toast-Transaction-Type'.toLowerCase()]; // toLowerCase because the http module
  var transactionGuid = req.headers['Toast-Transaction-GUID'.toLowerCase()]; //     stores all headers as lowercase
  var restaurantGuid = req.headers['Toast-Restaurant-External-ID'.toLowerCase()];
  var token = req.headers['authorization'];
  // if one of the headers are null or invalid
  if ( !(transactionType && transactionGuid && restaurantGuid && token) ) {
    return errorResponse(res, 'ERROR_INVALID_INPUT_PROPERTIES');
  }
  // verify that the JWT is valid and from Toast
  try {
    var decoded = jwt.verify(token, publicKey, {algorithms: ['RS256']});
  } catch (e) {
    return errorResponse(res, 'ERROR_INVALID_TOKEN');
  }
  if (transactionType == null) return errorResponse(res, 'ERROR_INVALID_TOAST_TRANSACTION_TYPE');
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
      case 'GIFTCARD_ACTIVATE':
        try {
          info = getPropOrErr(body, 'activateTransactionInformation');
          identifier = getPropOrErr(info, 'giftCardIdentifier');
          amount = getPropOrErr(info, 'initialBalance');
          card = cards.activate(transactionGuid, identifier, amount);
          responseBody = {
            activateResponse: {
              currentBalance: parseFloat(card['balance']) //parseFloat because API requires double, not string
            }
          };
          return successResponse(res, responseBody);
        } catch (e) {
          return errorResponse(res, e);
        }
      case 'GIFTCARD_ADD_VALUE':
        try {
          info = getPropOrErr(body, 'addValueTransactionInformation');
          identifier = getPropOrErr(info, 'giftCardIdentifier');
          amount = getPropOrErr(info, 'additionalValue');
          card = cards.addValue(transactionGuid, identifier, amount);
          responseBody = {
            addValueResponse: {
              currentBalance: parseFloat(card['balance'])
            }
          };
          return successResponse(res, responseBody);
        } catch (e) {
          return errorResponse(res, e);
        }
      case 'GIFTCARD_GET_BALANCE':
        try {
          info = getPropOrErr(body, 'getBalanceTransactionInformation');
          identifier = getPropOrErr(info, 'giftCardIdentifier');
          var balance = cards.getBalance(identifier);
          responseBody = {
            getBalanceResponse: {
              currentBalance: parseFloat(balance)
            }
          };
          return successResponse(res, responseBody);
        } catch (e) {
          return errorResponse(res, e);
        }
      case 'GIFTCARD_REDEEM':
        try {
          info = getPropOrErr(body, 'redeemTransactionInformation');
          identifier = getPropOrErr(info, 'giftCardIdentifier');
          amount = getPropOrErr(info, 'redeemedValue');
          var origBalance = parseFloat(cards.find(identifier)['balance']);
          card = cards.redeem(transactionGuid, identifier, amount);
          responseBody = {
            redeemResponse: {
              currentBalance: parseFloat(card['balance']),
              redeemedValue: parseFloat((origBalance - parseFloat(card['balance'])).toFixed(2))
            }
          };
          return successResponse(res, responseBody);
        } catch (e) {
          return errorResponse(res, e);
        }
      case 'GIFTCARD_REVERSE':
        try {
          info = getPropOrErr(body, 'reverseTransactionInformation');
          identifier = getPropOrErr(info, 'giftCardIdentifier');
          var prevTxn = getPropOrErr(info, 'previousTransaction');
          card = cards.reverse(transactionGuid, prevTxn, identifier);
          responseBody = {
            reverseResponse: {
              currentBalance: parseFloat(card['balance'])
            }
          };
          return successResponse(res, responseBody);
        } catch (e) {
          return errorResponse(res, e);
        }
      default:
        return errorResponse(res, 'ERROR_INVALID_TOAST_TRANSACTION_TYPE');
    }
  });
}).listen(port);

console.log('Server is up and listening at localhost:' + port);

function successResponse(res, responseBody) {
  responseBody['transactionStatus'] = 'ACCEPT';
  responseBody = JSON.stringify(responseBody);
  res.writeHead(200, {'Content-Type': 'application/json'});
  console.log('Successful response: ' + responseBody)
  res.end(responseBody);
}

function errorResponse(res, transactionStatus) {
  res.writeHead(400, {'Content-Type': 'application/json'});
  console.log('Error response: ' + transactionStatus);
  if (transactionStatus != null) {
    res.end(JSON.stringify({
      transactionStatus: transactionStatus
    }));
  }
}

function getPropOrErr(info, infoProperty) {
  var prop = info[infoProperty];
  if (prop == null) {
    throw 'ERROR_INVALID_INPUT_PROPERTIES'
  }
  return prop;
}

function publicKeyUrl() {
  // get the publicKey URL, which can be supplied as an argument: `npm start <URL>` or `node server.js <URL>`
  // if it is not supplied as an argument it will default to the Toast sandbox public key
  if (process.argv[2] != null) {
    return process.argv[2];
  } else {
    return 'https://ws-sandbox-api.eng.toasttab.com/usermgmt/v1/oauth/token_key';
  }
}
