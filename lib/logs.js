/**
 * Library for storing and rotating logs
 */

//Dependencies
var fs = require('fs')
var path = require('path')
var zlib = require('zlib')

//Container for the module
var lib = {}

lib.baseDir = path.join(__dirname, '/../.logs/')

//Append a string to a file, Create a file if it not exist
lib.append = (file, str, callback) => {
  //Opening the file for appending
  fs.open(lib.baseDir + file + '.log', 'a', (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      // Append to the file and close it
      fs.appendFile(fileDescriptor, str + '\n', (err) => {
        if (!err) {
          callback(false)
        } else {
          callback('Error closing file that was being appending')
        }
      })
    } else {
      callback('Could not open the file for appending')
    }
  })
}

// List all the logs and optionally include the compressed logs
lib.list = (includeCompressedLogs, callback) => {
  fs.readdir(lib.baseDir, (err, data) => {
    if (!err && data && data.length > 0) {
      var trimmedFilesNames = []
      data.forEach(fileName => {
        //add the .log files
        if (fileName.indexOf('.log') > -1) {
          trimmedFilesNames.push(fileName.replace('.log', ''))
        }
        // Add on the .gz files 
        if (fileName.indexOf('.gz.b64') > -1 && includeCompressedLogs) {
          trimmedFilesNames.push(fileName.replace('.gz.b64'), '')
        }
      })
      callback(false, trimmedFilesNames)
    } else {
      callback(err, data)
    }
  })
}

// Compress the content of one .log file into a .gz.b64 file within the same directory
lib.compress = (logId, newFileId, callback) => {
  var sourceFile = logId + '.log'
  var destFile = newFileId + '.gz.b64'
  //Read the source file
  fs.readFile(lib.baseDir + sourceFile, 'utf8', (err, inputString) => {
    // Compress the data using gzip
    zlib.gzip(inputString, (err, buffer) => {
      if (!err && buffer) {
        //send the data to the destination file
        fs.open(lib.baseDir + destFile, 'wx', (err, fileDescriptor) => {
          if (!err && fileDescriptor) {
            //Write to the destination file
            fs.writeFile(fileDescriptor, buffer.toString('base64'), (err) => {
              if (!err) {
                //Close the destination file
                fs.close(fileDescriptor, (err) => {
                  if (!err) {
                    callback(false)
                  } else {
                    callback(err)
                  }
                })
              } else {
                callback(err)
              }
            })
          } else {
            callback(err)
          }
        })
      } else {
        callback(err)
      }
    })
  })
}

//Decompress the content of a .gz.b64 file into a string variable
lib.decompress = (fileId, callback) => {
  var fileName = fileId + '.gz.b64'
  fs.readFile(lib.baseDir + fileName, 'utf-8', (err, str) => {
    if (!err && str) {
      //Decompress the data
      var inputBuffer = Buffer.from(str, 'base64')
      zlib.unzip(inputBuffer, (err, outputBuffer) => {
        if (!err && outputBuffer) {
          //Callback
          var str = outputBuffer.toString()
          callback(false, str)
        } else {
          callback(err)
        }
      })
    } else {
      callback(err)
    }
  })
}

//Truncate a log file
lib.truncate = (logId, callback) => {
  fs.truncate(lib.baseDir + logId + '.log', 0, (err) => {
    if (err) {
      callback(false)
    } else {
      callback(err)
    }
  })
}

//Export the module
module.exports = lib
