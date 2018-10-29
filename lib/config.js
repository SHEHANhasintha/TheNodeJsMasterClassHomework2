/**
 * Configurations for different enviorments
 */

var path = require('path')
var fs   = require('fs')

config = {}

config.configPath = path.join(__dirname,'../enviorments/')


config.currentEnviorment = () => {

    // Pull the current enviorment from enviorment variable.
    let env = ( typeof(process.env.APP_ENV) == 'string' && process.env.APP_ENV.length > 0 ) ? process.env.APP_ENV.trim() : 'test'

    return env

}

config.currentConfiguration =  () => {

    // Define the file name
    let filename  = config.configPath + config.currentEnviorment() + '.json'
    let data = {}
 
    // Check if a mathced file exist for this enviorment
    if(fs.existsSync(filename)) 
    {
        // Read the config
        data =   require(filename)
        
    } 
    else
    {
        // If there is not any configuration, so error will be thrown
        throw 'ERROR: Missing configuration file.'
    }

    return data
}



 module.exports =  config.currentConfiguration()