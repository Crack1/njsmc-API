//DEPENDENCIES
var http = require('http')
var https = require('https');
var url = require('url')
var StringDecoder = require('string_decoder').StringDecoder
const config = require('./config')
var _data = require('./lib/data')
var handlers = require('./lib/handlers')
var helpers = require('./lib/helpers')

// @TODO GET RID OF THIS
helpers.sendTwilioSms(1234666, 'Hello', (err) => {
  console.log(`this was a error ${err}`)
})

//the server should respond to all request with a string
var server = http.createServer(function(req, res) {

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
    var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound
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
})

server.listen(config.httpPort, () => {
  console.log(`the server is listen the port ${config.httpPort} in ${config.envName} mode`)
})



var router = {
  'ping': handlers.ping,
  users: handlers.users,
  tokens: handlers.tokens,
  checks: handlers.checks
}
