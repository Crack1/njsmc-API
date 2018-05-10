/*
 * Helpers for various tasks
 */

//Dependencies
var crypto = require('crypto')
var config = require('./../config')
var https = require('https')

var querystring = require('querystring')



//Container for all the helpers
var helpers = {}

//Create a SHA256
helpers.hash = (str) => {
  if (typeof(str) == 'string' && str.length > 0) {
    var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex')
    return hash
  } else {
    return false
  }
}
//Parse a JSON  string to an object in all cases, without throwing
helpers.parseJsonToObject = (str) => {
  try {
    var obj = JSON.parse(str)
    return obj
  } catch (e) {
    return {}
  }
}

// Create a string of randon alphabetical character, of a given length
helpers.createRandonString = (strLength) => {
  strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false
  if (strLength) {
    //Define all the possible characteristic that could go into a string
    var possibleCharacters = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPLKJHGFDSAZXCVBNM0123456789'
    // Start the final string
    var str = ''
    for (i = 1; i <= strLength; i++) {
      // Get a randon character from the possibleCharacters string
      var randoCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length))
      // Append this character to the final string
      str += randoCharacter
    }
    // Return the final String
    return str
  } else {
    return false
  }
}

//Send a SMS message via Twilio
helpers.sendTwilioSms = (phone, msg, callback) => {
  //Validate parameters
  phone = typeof phone == 'string' && phone.trim().length == 10 ? phone.trim() : false
  msg = typeof msg == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false
  if (phone && msg) {
    //Configure the request payload
    var payload = {
      'From': config.twilio.fromPhone,
      'To': '+1' + phone,
      'Body': msg
    }
    //Stringtify the payload
    var stringPayload = querystring.stringify(payload)
    //Configure the request details
    var requestDetails = {
      'protocol': 'https:',
      'hostname': 'api.twilio.com',
      'method': 'POST',
      'path': '/2010-04-01/Accounts/' + config.twilio.accountSid + '/Message.json',
      'auth': config.twilio.accountSid + ':' + config.twilio.authToken,
      'headers': {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-length': Buffer.byteLength(stringPayload)
      }
    }

    //Instantiate the request object
    var req = https.request(requestDetails, (res) => {
      //Grab the status of the sent request
      var status = res.statusCode
      //Callback successfully if the request went through
      if (status == 200 || status == 201) {
        callback(false)
      } else {
        callback('Status code returned was ' + status)
      }
    })
    // Bind to the error event so it doesn't get thrown
    req.on('error', (e) => {
      callback(e)
    })
    //add the payload
    req.write(stringPayload)

    //end the request
    req.end()

  } else {
    callback('Given parameters were missing or invalid')
  }
}

module.exports = helpers
