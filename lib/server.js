/**
 * Server-related Tasks
 * 
 */

//DEPENDENCIES
var http = require('http')
var https = require('https');
var url = require('url')
var StringDecoder = require('string_decoder').StringDecoder
const config = require('../config')
var fs = require('fs');
var _data = require('./data')
var handlers = require('./handlers')
var helpers = require('./helpers')
var path = require('path')
var util = require('util')
var debug = util.debuglog('server')


// Instantiate the server module object
var server = {}

// @TODO GET RID OF THIS
/*helpers.sendTwilioSms('4158375309', 'Hello', (err) => {
  debug(`this was a error ${err}`)
})*/

// Instantiate the HTTP server
server.httpServer = http.createServer(function(req, res) {
  server.unifiedServer(req, res);
});


// Instantiate the HTTPS server
server.httpsServerOptions = {
  'key': fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
  'cert': fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
};
server.httpsServer = https.createServer(server.httpsServerOptions, function(req, res) {
  server.unifiedServer(req, res);
});



//the server should respond to all request with a string
server.unifiedServer = function(req, res) {
  //Get the URL and parse It
  var parsedUrl = url.parse(req.url, true)
  //Get the path
  var path = parsedUrl.pathname
  var trimmedPath = path.replace(/^\/+|\/+$/g, '')

  //Get the query string as an object
  //parsedUrl.query ->  { phone: '1234567899' }
  var queryStringObject = parsedUrl.query

  //Get the Http Method
  var method = req.method.toLowerCase()

  //Get the headers as an object
  var headers = req.headers

  //get the payloads, if any
  var decoder = new StringDecoder('utf-8')
  var buffer = ''
  req.on('data', (data) => {
    buffer += decoder.write(data)
  })

  req.on('end', (data) => {
    buffer += decoder.end()
    //choose where this request should go to. If one is not found, use the notFound handler
    var chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound

    // if the request is within the public directory, use thepublica handler instead
    chosenHandler = trimmedPath.indexOf('public/') > -1 ? handlers.public : chosenHandler

    //construct the data object to send to the handler
    var data = {
      'trimmedPath': trimmedPath,
      'queryStringObject': queryStringObject,
      'method': method,
      'headers': headers,
      'payload': helpers.parseJsonToObject(buffer)
    }
    //Route to request to handler specified in the router
    chosenHandler(data, (statusCode, payload, contentType) => {
      // Determine the type of response (fallback to JSON)
      contentType = typeof(contentType) == 'string' ? contentType : 'json';

      // Use the status code returned from the handler, or set the default status code to 200
      statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

      // Return the response parts that are content-type specific
      var payloadString = '';
      if (contentType == 'json') {
        res.setHeader('Content-Type', 'application/json');
        payload = typeof(payload) == 'object' ? payload : {};
        payloadString = JSON.stringify(payload);
      }
      if (contentType == 'html') {
        res.setHeader('Content-Type', 'text/html');
        payloadString = typeof(payload) == 'string' ? payload : '';
      }
      // the payload string comes from a buffer so these are not string
      if (contentType == 'favicon') {
        res.setHeader('Content-Type', 'image/x-icon');
        payloadString = typeof(payload) !== 'undefined' ? payload : '';
      }
      if (contentType == 'css') {
        res.setHeader('Content-Type', 'text/css');
        payloadString = typeof(payload) !== 'undefined' ? payload : '';
      }
      if (contentType == 'png') {
        res.setHeader('Content-Type', 'image/png');
        payloadString = typeof(payload) !== 'undefined' ? payload : '';
      }
      if (contentType == 'jpg') {
        res.setHeader('Content-Type', 'image/jpg');
        payloadString = typeof(payload) !== 'undefined' ? payload : '';
      }
      if (contentType == 'plain') {
        res.setHeader('Content-Type', 'text/plain');
        payloadString = typeof(payload) !== 'undefined' ? payload : '';
      }

      res.writeHead(statusCode)
      //send the response
      res.end(payloadString)

      //If the response is  200, print green otherwise print red
      if (statusCode == 200) {
        debug('\x1b[32m%s\x1b[0m', method.toUpperCase() + ' /' + trimmedPath + ' ' + statusCode)
      } else {
        debug('\x1b[31m%s\x1b[0m', method.toUpperCase() + ' /' + trimmedPath + ' ' + statusCode)
      }

    })
  })
}


server.router = {
  '': handlers.index,
  'account/create': handlers.accountCreate,
  'account/edit': handlers.accountEdit,
  'account/deleted': handlers.accountDeleted,
  'session/create': handlers.sessionCreate,
  'session/deleted': handlers.sessionDeleted,
  'checks/all': handlers.checksList,
  'checks/create': handlers.checksCreate,
  'checks/edit': handlers.checksEdit,
  'ping': handlers.ping,
  users: handlers.users,
  tokens: handlers.tokens,
  checks: handlers.checks,
  'favicon.ico': handlers.favicon,
  public: handlers.public

}

// Init script
server.init = () => {
  //Start the http server
  server.httpServer.listen(config.httpPort, () => {
    console.log('\x1b[35m%s\x1b[0m', `the server is listen the port ${config.httpPort} in ${config.envName} mode`)
  })
  // Start the HTTPS server
  /*server.httpsServer.listen(config.httpsPort, function() {
    console.log('\x1b[36m%s\x1b[0m', 'The HTTPS server is running on port ' + config.httpsPort);
  });*/
}

// Export the module
module.exports = server
