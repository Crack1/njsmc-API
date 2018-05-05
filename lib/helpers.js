/*
 * Helpers for various tasks
 */

//Dependencies
var crypto = require('crypto')
var config = require('./../config')



//Container for all the helpers
var helpers = {}

//Create a SHA256
helpers.hash = (str) => {
    if (typeof (str) == 'string' && str.length > 0) {
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
    strLength = typeof (strLength) == 'number' && strLength > 0 ? strLength : false
    if (strLength) {
        //Define all the possible characteristic that could go into a string
        var possibleCharacters = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPLKJHGFDSAZXCVBNM0123456789'
        // Start the final string
        var str = ' '
        for (i = 1; i < strLength; i++) {
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
module.exports = helpers
