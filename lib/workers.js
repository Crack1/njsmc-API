/**
 * Workers related tasks
 */

// Dependencies
var path = require('path')
var fs = require('fs')
var _data = require('./data')
var http = require('http')
var https = require('https')
var helpers = require('./helpers')
var url = require('url')
var _logs = require('./logs')
var util = require('util')
var debug = util.debuglog('workers')



//Instantiate the work object
var workers = {}

// Lookup all checks, get their data, send to a validator
workers.gatherAllChecks = () => {
  // Get all the checks
  _data.list('checks', (err, checks) => {
    if (!err && checks && checks.length > 0) {
      checks.forEach(check => {
        // Read in the check data
        _data.read('checks', check, (err, originalCheckData) => {
          if (!err && originalCheckData) {
            // Pass it to the check validator, and let that function continue or log error
            workers.validateCheckData(originalCheckData)
          } else {
            debug(`Error reading one of the check's data`)
          }
        })
      });
    } else {
      debug(`Error: Could not find any checks to process`)
    }
  })
}

// Sanity-check the check data

workers.validateCheckData = (originalCheckData) => {

  originalCheckData = typeof originalCheckData == 'object' && originalCheckData !== null ? originalCheckData : false
  originalCheckData.id = typeof originalCheckData.id == 'string' && originalCheckData.id.trim().length == 20 ? originalCheckData.id.trim() : false
  originalCheckData.userPhone = typeof originalCheckData.userPhone == 'string' && originalCheckData.userPhone.trim().length == 10 ? originalCheckData.userPhone.trim() : false
  originalCheckData.protocol = typeof originalCheckData.protocol == 'string' && ['http', 'https'].indexOf(originalCheckData.protocol) > -1 ? originalCheckData.protocol : false
  originalCheckData.url = typeof originalCheckData.url == 'string' && originalCheckData.url.trim().length > 0 ? originalCheckData.url.trim() : false
  originalCheckData.method = typeof originalCheckData.method == 'string' && ['get', 'post', 'put', 'delete'].indexOf(originalCheckData.method) > -1 ? originalCheckData.method : false
  originalCheckData.successCodes = typeof originalCheckData.successCodes == 'object' && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.length > 0 ? originalCheckData.successCodes : false
  originalCheckData.timeoutSeconds = typeof originalCheckData.timeoutSeconds == 'number' && originalCheckData.timeoutSeconds % 1 === 0 && originalCheckData.timeoutSeconds >= 1 && originalCheckData.timeoutSeconds <= 5 ? originalCheckData.timeoutSeconds : false

  // Set the keys that may not be set (if the workers have never seen this check before)
  originalCheckData.state = typeof originalCheckData.state == 'string' && ['up', 'down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state : 'down'
  originalCheckData.lastChecked = typeof originalCheckData.lastChecked == 'number' && originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : false

  // If all the cheks pass, pass the data along to the next step in the process
  if (originalCheckData.id && originalCheckData.userPhone && originalCheckData.protocol && originalCheckData.url && originalCheckData.method && originalCheckData.successCodes && originalCheckData.timeoutSeconds) {
    workers.performCheck(originalCheckData)
  } else {
    debug(`Error: one of the checks is not properly formatted, Skipping it`)
  }
}
// Perform the check, send the originalCheckData and the outcome of the check process to the next stepin the process
workers.performCheck = (originalCheckData) => {
  //Prepare the initial check outcome
  var checkOutcome = {
    error: false,
    responseCode: false
  }
  // Mark that the outcome has not been sent yet
  var outcomeSent = false
  // Parse the hostname and the path out of the original check data 
  var parseUrl = url.parse(originalCheckData.protocol + '://' + originalCheckData.url, true)
  var hostName = parseUrl.hostname
  var path = parseUrl.path // Using path and not 'pathname' because we want the  query string//
  //Construct the request
  var requestDetails = {
    protocol: originalCheckData.protocol + ':',
    hostname: hostName,
    method: originalCheckData.method.toUpperCase(),
    path: path,
    timeout: originalCheckData.timeoutSeconds * 1000
  }
  // Instantiate the request object (using either the http or https module)
  var _moduleToUse = originalCheckData.protocol == 'http' ? http : https
  var req = _moduleToUse.request(requestDetails, (res) => {
    //Grab the status of the sent request
    var status = res.statusCode

    // Update the checkOutcome and pass the data along
    checkOutcome.responseCode = status;
    if (!outcomeSent) {
      workers.procesCheckOutcome(originalCheckData, checkOutcome)
      outcomeSent = true
    }
  })

  // Bind to the error event so it doesn't get thrown
  req.on('error', (e) => {
    // Update the checkOutcome and pass the data along
    checkOutcome.error = {
      'error': true,
      'value': e
    };
    if (!outcomeSent) {
      workers.procesCheckOutcome(originalCheckData, checkOutcome)
      outcomeSent = true
    }
  })

  //Bind to the timeout event
  req.on('timeout', (e) => {
    // Update the checkOutcome and pass the data along
    checkOutcome.error = {
      error: true,
      value: 'timeout'
    }
    if (!outcomeSent) {
      workers.procesCheckOutcome(originalCheckData, checkOutcome)
      outcomeSent = true
    }
  })
  //End the request
  req.end()

}

//Process the check outcome, update the check data as needed, trigger and alert id needed
//Special logic for accomodating a check thar has never been tested before (don't alert of that one)
workers.procesCheckOutcome = (originalCheckData, checkOutcome) => {
  debug(checkOutcome)
  //Decide if the check is consider up or down
  var state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down'

  // Decide if an alert is warranted
  var alertWarranted = originalCheckData.lastChecked && originalCheckData.state !== state ? true : false

  // Log the outcome
  var timeOfCheck = Date.now()
  workers.log(originalCheckData, checkOutcome, state, alertWarranted, timeOfCheck)

  // Update the check data
  var newCheckData = originalCheckData
  newCheckData.lastChecked = timeOfCheck


  // Save the updates
  _data.update('checks', newCheckData.id, newCheckData, (err) => {
    if (!err) {
      if (alertWarranted) {
        workers.alertUserToStatusChange(newCheckData)
      } else {
        debug(`Check outcome has not changed, no alert needed`)
      }
    } else {
      debug(`Error trying to save updates to one of the checks`)
    }
  })
}
//Alert the user as to a change in their check status
workers.alertUserToStatusChange = (newCheckData) => {
  var msg = 'Alert: Your check for ' + newCheckData.method.toUpperCase() + ' ' + newCheckData.protocol + '://' + newCheckData.url + ' is currently ' + newCheckData.state
  debug(msg)
  /* helpers.sendTwilioSms(newCheckData.userPhone, msg, (err) => {
     if (!err) {
       debug(`Success: User was alerted to a status change in their check, via sms `, msg)
     } else {
       debug(`Error: Could not send sms alert to user who had a state change in their check `)
     }
   })*/
}


workers.log = (originalCheckData, checkOutcome, state, alertWarranted, timeOfCheck) => {
  //Form the log data
  var logData = {
    check: originalCheckData,
    outcome: checkOutcome,
    state,
    alert: alertWarranted,
    time: timeOfCheck
  }
  //Convert data to string
  var logString = JSON.stringify(logData)
  //Determine the name of the log file
  var logFileName = originalCheckData.id
  //Append the loge string to the file
  _logs.append(logFileName, logString, (err) => {
    if (!err) {
      debug(`Logging to file successed`)
    } else {
      debug(`Logging to file failed`)
    }
  })
}

// Timer to execute the worker-process once per minute
workers.loop = () => {
  setInterval(() => {
    workers.gatherAllChecks()
  }, 1000 * 5)
}

//timer to execute the log rotation process per day
workers.logRotationLoop = () => {
  setInterval(() => {
    workers.rotateLogs()
  }, 1000 * 60 * 60 * 24)
}

//Rotate (compress) the logsfiles
workers.rotateLogs = () => {
  //List all the (non compressed) log files
  _logs.list(false, (err, logs) => {
    if (!err && logs && logs.length > 0) {
      logs.forEach(logName => {
        var logId = logName.replace('.log', '')
        var newFileId = logId + '-' + Date.now()
        _logs.compress(logId, newFileId, (err) => {
          if (!err) {
            // Truncate the log
            _logs.truncate(logId, (err) => {
              if (!err) {
                debug(`Success truncating logFile`)
              } else {
                debug(`Error truncating logFile`)
              }
            })
          } else {
            debug(`Error compressing one of the log files `, err)
          }
        })
      });
    } else {
      debug(`Error: could not find any logs to rotate`)
    }
  })
}

//Init Script
workers.init = () => {

  //send console, in yellow
  console.log('\x1b[33m%s\x1b[0m', 'Back in yellow')

  //Execute all the checks inmediately
  workers.gatherAllChecks()
  // Call the loop so the checks will execute later on
  workers.loop()

  // Compress all the logs immediately
  workers.rotateLogs()
  //Call the compression loop so logs will be compressed later on 
  workers.logRotationLoop()

}

module.exports = workers
