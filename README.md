# Toast Gift Card API example implementation

This repository represents an example of how to implement the Toast Gift Card Integration API.

It's a basic server written in Node.js that handles requests from Toast.

`db.json` represents a database. This is where the gift cards and transactions are stored. You can also edit and view the data just like any other json file. Gift card, transaction, and database related functions can be found in `cards.js`, `transactions.js`, and `db.js` respectively. These files are less important however some of the required error responses are thrown in `cards.js` and `transactions.js`.

**The majority of the logic can be found in `server.js`.** This is where incoming requests are handled and dealt with accordingly. It is also where JWT verification is handled.

## How to run it

**First, You have to have `node` and `npm` installed.**

Clone the repository and `cd` into it.

Install all the node dependencies with:
```
npm install
```

Then start the server with:
```
npm start
```
Now the server will be running at `localhost:18181`

By default it will use the public key (for JWT verification) from the Toast sandbox environment. However you can change the URL of the public key by supplying it as an argument to `npm install`. So if I wanted to use the public key from the Toast production environment I would supply run the server like so:
```
npm start https://ws-api.toasttab.com/usermgmt/v1/oauth/token_key
```
