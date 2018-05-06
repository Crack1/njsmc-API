/*Request Handlers */

//Dependencies
var _data = require('./data')
var helpers = require('./helpers')


//Define a handlers
var handlers = {}
//define a request router
//sample handlers


//------>USERS
handlers.users = (data, callback) => {
    var acceptableMethods = ['post', 'get', 'put', 'delete']

    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback)
    } else {
        callback(405)
    }
}
//container for the users submethods
handlers._users = {}

//Users - post
//Required data: firstName, lastname, phone, password, tosAgreement
//Optional Data: none 
handlers._users.post = (data, callback) => {
    //Check that all required fields are filled out
    var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false
    var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false
    var tosAgreement = typeof (data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false

    if (firstName && lastName && phone && password && tosAgreement) {
        //Make sure that the user doesn't already exist
        _data.read('users', phone, (err, data) => {
            if (err) {
                //Hash the password
                var hashedPassword = helpers.hash(password)
                if (hashedPassword) {
                    //create a user object
                    var userObject = {
                        firstName,
                        lastName,
                        phone,
                        hashedPassword,
                        tosAgreement: true
                    }
                    //store the user
                    _data.create('users', phone, userObject, (err) => {
                        if (!err) {
                            callback(200)
                        } else {
                            console.log(err)
                            callback(500, {
                                Error: 'Could not create the new user'
                            })
                        }
                    })
                } else {
                    callback(500, {
                        Error: 'Could not hash the User`s password '
                    })
                }
            } else {
                callback(400, {
                    'Error': 'A user with that phone number already exists'
                })
            }
        })
    } else {
        callback(400, {
            Error: 'Missing required fields'
        })
    }

}
//Users - get
// Required data: phone
// Optional data: none
// @TODO Only let an authenticated user access their object. Dont let then access anyone else
handlers._users.get = (data, callback) => {
    //Check that the phone numver is valid
    var phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false
    if (phone) {
        //Lookup the user
        _data.read('users', phone, (err, data) => {
            if (!err && data) {
                //Remove the hashed password from the user object before returnning it to the requestor
                delete data.hashedPassword
                callback(200, data)
            } else {
                callback(400)
            }
        })
    } else {
        callback(400, {
            Error: 'Missing Required field'
        })
    }
}
// Users - put
// Required Data: phone
// Optional Data: firstName, lastName, password (at least one must be specified)
// @TODO Only let authenticated user update their object,  Dont let then update anyone else
handlers._users.put = (data, callback) => {
    //Check that the phone numver is valid
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false

    //Check the optional fields
    var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false
    var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false

    if (phone) {
        //error is nothing is sent to update
        if (firstName || lastName || password) {
            // lookup the user
            _data.read('users', phone, (err, userData) => {
                if (!err && userData) {
                    //Update the required field
                    if (firstName) {
                        userData.firstName = firstName
                    }
                    if (lastName) {
                        userData.lastName = lastName
                    }
                    if (password) {
                        userData.hashedPassword = helpers.hash(password)
                    }
                    // Store the new updates
                    _data.update('users', phone, userData, (err) => {
                        if (!err) {
                            callback(200)
                        } else {
                            callback(500, {
                                Error: 'Could not update the user'
                            })
                        }
                    })
                } else {
                    callback(400, {
                        Error: 'The specified user does not exist'
                    })
                }
            })
        } else {
            callback(400, {
                Error: 'Missing fields to update'
            })
        }
    } else {
        callback(400, {
            Error: 'Missing Required field'
        })
    }

}
//Users - delete
// Required field: phone
//@TODO Only let an authenticated user delete their object. Dont let them delete anyone else
//@TODO Cleanup (delete) any other data files associated with this user
handlers._users.delete = (data, callback) => {
    // Check that the phone number is valid   
    //Check that the phone numver is valid
    var phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false
    if (phone) {
        //Lookup the user
        _data.read('users', phone, (err, data) => {
            if (!err && data) {
                _data.delete('users', phone, (err) => {
                    if (!err) {
                        callback(200)
                    } else {
                        callback(500, {
                            Error: 'Could not delete the specified user'
                        })
                    }
                })
            } else {
                callback(400, {
                    Error: 'Could not find the specified user'
                })
            }
        })
    } else {
        callback(400, {
            Error: 'Missing Required field'
        })
    }
}




//------>USERS
//////////////////////////////////////////////////////////////////////////////////////////////////
//------>TOKENS
handlers.tokens = (data, callback) => {
    var acceptableMethods = ['post', 'get', 'put', 'delete']

    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback)
    } else {
        callback(405)
    }
}

//Container for all the tokens methods
handlers._tokens = {}

//Tokens POST
// Required Data: phone, password
// Optional Data: none
handlers._tokens.post = (data, callback) => {
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false
    if (phone && password) {
        //Lookup the user who matches that phone number
        _data.read('users', phone, (err, userData) => {
            if (!err && userData) {
                // HASH the sent password and compare it to the password stored in the user object
                var hashedPassword = helpers.hash(password)
                if (hashedPassword == userData.hashedPassword) {
                    //If valid, create a new token with a random name. Set expiration date 1 hour in the future
                    var tokenID = helpers.createRandonString(20)
                    var expires = Date.now() + 100 * 60 * 60
                    var tokenObject = {
                        phone: phone,
                        id: tokenID,
                        expires: expires
                    }
                    //store the token
                    _data.create('tokens', tokenID, tokenObject, (err) => {
                        if (!err) {
                            callback(200, tokenObject)
                        } else {
                            callback(500, {
                                Error: 'Could not create the new token'
                            })
                        }
                    })
                } else {
                    callback(400, {
                        Error: 'Password did not match with specified user stored password'
                    })
                }
            } else {
                callback(400, {
                    Error: 'Could not find the specified user'
                })
            }
        })
    } else {
        callback(400, {
            Error: 'Missing required field(s)'
        })
    }
}
//Tokens GET
// Required Data: id
//Optional Dara: none
handlers._tokens.get = (data, callback) => {
    //Check that the id is valid
    var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false
    if (id) {
        //Lookup the token
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                callback(200, tokenData)
            } else {
                callback(400, {
                    Error: 'Wrong'
                })
            }
        })
    } else {
        callback(400, {
            Error: 'Missing Required field'
        })
    }
}
//Tokens PUT
// Required data: id, extend
// Optional data: none
handlers._tokens.put = (data, callback) => {
    var id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false
    var extend = typeof (data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false
    if (id && extend) {
        // Lockup the token 
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                // Check to the make sure the token isn't alreaddy expired
                if (tokenData.expires > Date.now()) {
                    // Set the expiration and hour from now
                    tokenData.expires = Date.now() + 1000 * 60 * 60
                    _data.update('tokens', id, tokenData, (err) => {
                        if (!err) {
                            callback(200)
                        } else {
                            callback(500, {
                                Error: 'Could not update the token\' expiration'
                            })
                        }
                    })
                } else {
                    callback(400, {
                        Error: 'The token has already expired, and cannot be extended'
                    })
                }
            } else {
                callback(400, {
                    Error: 'Specified token does not exist'
                })
            }
        })
    } else {
        callback(400, {
            Error: 'Missing Required field or field are invalid'
        })
    }
}
//Tokens DELETE
handlers._tokens.delete = (data, callback) => {}


//------>TOKENS

handlers.ping = (data, callback) => {
    //callback a http status code, and a payload object
    callback(200, {
        test: 'test'
    })
}

//not found handlers
handlers.notFound = (data, callback) => {
    callback(404)
}


module.exports = handlers
