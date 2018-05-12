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


// Instantiate the server module object
var server = {}

// @TODO GET RID OF THIS
/*helpers.sendTwilioSms('4158375309', 'Hello', (err) => {
  console.log(`this was a error ${err}`)
})*/

// Instantiate the HTTP server
server.httpServer = http.createServer(function(req, res) {
  server.unifiedServer(req, res);
});

// Start the HTTP server
server.httpServer.listen(config.httpPort, function() {
  console.log('The HTTP server is running on port ' + config.httpPort);
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
    //construct the data object to send to the handler
    var data = {
      'trimmedPath': trimmedPath,
      'queryStringObject': queryStringObject,
      'method': method,
      'headers': headers,
      'payload': helpers.parseJsonToObject(buffer)
    }

    //Route to request to handler specified in the router
    chosenHandler(data, (statusCode, payload) => {
      //Use status code called back by the handler, or default to 200
      status = typeof(statusCode) == 'number' ? statusCode : 200
      //Use the payload called back by the handler, or default to an empty object
      payload = typeof(payload) == 'object' ? payload : {}
      //convert the payload to a string
      var payloadString = JSON.stringify(payload)
      //returning a response
      res.setHeader('Content-Type', 'application/json')
      res.writeHead(statusCode)
      //send the response
      res.end(payloadString)
      console.log("Returnning the response: ", statusCode, payloadString)
    })
  })
}


server.router = {
  'ping': handlers.ping,
  users: handlers.users,
  tokens: handlers.tokens,
  checks: handlers.checks
}

// Init script
server.init = () => {
  //Start the http server
  server.httpServer.listen(config.httpPort, () => {
    console.log(`the server is listen the port ${config.httpPort} in ${config.envName} mode`)
  })
  // Start the HTTPS server
  server.httpsServer.listen(config.httpsPort, function() {
    console.log('The HTTPS server is running on port ' + config.httpsPort);
  });
}

// Export the module
module.exports = server
