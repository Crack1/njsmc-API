/* Create and export configuration variables */

// Container for all the environments
var environments = {}

// Staging (default) environment
environments.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: 'staging',
  hashingSecret: 'thisIsASecret',
  maxChecks: 5,
  twilio: {
    accountSid: 'ACb32d411ad7fe886aac54c665d25e5c5d',
    authToken: '9455e3eb3109edc12e3d8c92768f7a67',
    fromPhone: ''
    /*fromPhone: '+15005550006'*/
  },
  templateGlobals: {
    appName: 'UptimeChecker',
    companyName: 'Not a real company',
    yearCreated: '2018',
    baseUrl: 'http://localhost:3000'
  }
}

// Production environment
environments.production = {
  port: 5000,
  envName: 'production',
  hashingSecret: 'thisIsASecret',
  maxChecks: 5,
  twilio: {
    accountSid: '',
    authToken: '',
    fromPhone: ''
  },
  templateGlobals: {
    appName: 'UptimeChecker',
    companyName: 'Not a real company',
    yearCreated: '2018',
    baseUrl: 'http://localhost:3001'
  }
}

//Determine  witch enviroment was passed as a command-line argument
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : ''

//Check that the current environment is one  of the environments above, default to staging
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging

module.exports = environmentToExport
