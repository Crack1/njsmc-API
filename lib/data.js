//Dependencies
var fs = require('fs')
var path = require('path')
var helpers = require('./helpers')


//Container for the module (tobe exported)
var lib = {}

lib.basDir = path.join(__dirname, '/../.data/')

//write data to a file
lib.create = (dir, file, data, callback) => {
  //Open the file for writen
  fs.open(lib.basDir + dir + '/' + file + '.json', 'wx', (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      //convert data to string
      var stringData = JSON.stringify(data)
      //Write to file and close it
      fs.writeFile(fileDescriptor, stringData, (err) => {
        if (!err) {
          if (!err) {
            callback(false)
          } else {
            callback('Error closing new File')
          }
        } else {
          callback('Error to write to new File')
        }
      })
    } else {
      callback('Could not create a new file, it way already exist')
    }
  })
}

//Read data from a file
lib.read = (dir, file, callback) => {
  fs.readFile(lib.basDir + dir + '/' + file + '.json', 'utf-8', (err, data) => {
    if (!err && data) {
      var parsedData = helpers.parseJsonToObject(data)
      callback(err, parsedData)
    } else {

      callback(err, data)
    }
  })
}

//Update data inside a file
lib.update = (dir, file, data, callback) => {
  fs.open(lib.basDir + dir + '/' + file + '.json', 'r+', (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      //Convert data to a string
      var stringData = JSON.stringify(data)
      //Truncate the file
      fs.truncate(fileDescriptor, (err) => {
        if (!err) {
          fs.writeFile(fileDescriptor, stringData, (err) => {
            if (!err) {
              fs.close(fileDescriptor, (err) => {
                if (!err) {
                  callback(false)
                } else {
                  callback('Error clossing existing file')
                }
              })
            } else {
              callback('Error writing to existing file')
            }
          })
        } else {
          callback('Error truncating file')
        }
      })
    } else {
      callback('Could not open the file for updating, it may not exist yet')
    }
  })
}

//Delete a file
lib.delete = (dir, file, callback) => {
  //Unlink the file
  fs.unlink(lib.basDir + dir + '/' + file + '.json', (err) => {
    callback(err)
  })
}


module.exports = lib
