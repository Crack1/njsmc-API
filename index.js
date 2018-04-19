//DEPENDENCIES
var http = require('http')
var url = require('url')


//the server should respond to all request with a string 
var server = http.createServer(function (req, res) {

    //Get the URL and parse It
    var parsedUrl = url.parse(req.url, true)
    //Get the path
    var path = parsedUrl.pathname
    var trimmedPath = path.replace(/^\/+|\/+$/g, '')

    //Get the query string as an object
    var queryStringObject = parsedUrl.query

    //Get the Http Method
    var method = req.method.toLowerCase()

    //Get the headers as an object
    var headers = req.headers
    //send the response
    res.end('hello world\n')

    //Log the request path
    console.log(`Request received on path: ${trimmedPath} with the method: ${method} and with this query string parameters:`, queryStringObject)
    console.log('We are using the next headers: ', headers)

})


server.listen(3000, () => {
    console.log(`the server is listen the port 3000 now`)
})
