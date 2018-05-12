//Dependencies
var server = require('./lib/server')
var workers = require('./lib/workers')

//// Declare de app
var app = {}

// Init function
app.init = () => {
  // Start the server
  server.init()

  // Start the workers
  workers.init()
}

//Execute
app.init()

module.exports = app
