/**
 * Various helpers.
 */

const crypto = require('crypto')
const _config= require('./config')
 // Container
 let helpers = {}
 

helpers.parseJsonStringToObject = function parseJsonStringToObject(str) 
{
    let x = {}

    try {
    
        x = JSON.parse(str)
        
    } catch (error) {

        x = {}
    }

    return x
}

helpers.hashPassword = function hashPassword(str) 
{
    if(typeof(str) == 'string' && str.length > 0) {
        let hash = crypto.createHmac('sha256',_config.hashingSecret).update(str).digest('hex')
        return hash
    } else {
        return false
    }
}


helpers.createRandomString = function(strLength) {

    // Validate the string length
    stringLength = (typeof(strLength) == 'number' && strLength > 0) ? strLength : false

    if(stringLength) {

        // Define set of characters
        // Will be used to generate the string
        var possibleCharacters = 'abcdefghijklmnopqrstuvwz1234567890'
        var str = ''

        // Generate the string
        for (let i = 0; i < stringLength; i++) {
            
            str += possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length))
            
        }
        
        return str

    } else { 
        return false
    }
}






 // Exports moudle
 module.exports = helpers