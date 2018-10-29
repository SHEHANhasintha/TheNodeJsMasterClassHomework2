"use strict"
const _helpers = require('./helpers' )
const _data = require('./data')
const USERS_TABLE = 'users'
const TOKENS_TABLE = 'tokens'
const TOKEN_LENGTH = 20
const TOKEN_EXPIRED_TIME = 1000*60*60
const ACCEPTABLE_METHODS = ['get','post','put','delete']


var lib = {}

lib.router = async (data,callback) => {
        try {
            if ( ACCEPTABLE_METHODS.includes(data.method ) ) {
    
                let response = await lib[data.method](data)
                callback(200, response )
    
            } else {
                throw  {message: 'method not acceptable'}
            }
        } catch (error) {
            console.log(error)
            
            callback(400, {error:error.message})        
        }
    
    }

lib.post = async (data) => new  Promise(async (resolve, reject) => {

    try {
        // Validation
        let email = (typeof (data.payload.email) == 'string' && data.payload.email.trim().length > 3 && data.payload.email.includes('@') && data.payload.email.includes('.')) ? data.payload.email.trim() : false
        let password = (typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0) ? data.payload.password : false

        if (!email || !password) throw {message: 'email or password missing'}
        
        let hasedPassword = _helpers.hashPassword(password)
        
        // Get user
        let user = (await _data.read(USERS_TABLE, email)).data
        
        // Check that password match to the stored password.
        if (hasedPassword != user.hashedPassword) throw {message: 'password not match to email'}
        
        // Genrate token object.
        let token = {}
        token.id = _helpers.createRandomString(TOKEN_LENGTH)
        token.expired = Date.now() + TOKEN_EXPIRED_TIME
        token.email = email

        await _data.create(TOKENS_TABLE, token.id, token)

        resolve(token)

    } catch (error) {
        reject( error )
    }

})

/**
 * Get the token object
 * @param {object} data - tokenId string from the queryStringObject
 */
lib.get = async( data ) => new Promise( async(resolve,reject) => {
    
    try {
        
        // Validation
        let tokenId =  ((typeof(data.queryStringObject.tokenId )=='string' && data.queryStringObject.tokenId.trim().length == TOKEN_LENGTH )) ? data.queryStringObject.tokenId.trim() : false
        if (!tokenId) throw {message: 'missing token id, or token id is not valid'}

        // Get token obj
        let tokenObj  = (await _data.read(TOKENS_TABLE, tokenId)).data
        
        resolve(tokenObj)

    } catch (error) {
        reject(error)
    }
})

/**
 * Extend the token time.
 * @param {object} data - token Id from the query string
 *                 - extend - boolean from the body
 */
lib.put = async( data ) => new Promise( async(resolve,reject)=> {
  
    try {
        // Validation
        let tokenId =  ((typeof(data.queryStringObject.tokenId )=='string' && data.queryStringObject.tokenId.trim().length == TOKEN_LENGTH )) ? data.queryStringObject.tokenId.trim() : false
        let extend  = ( typeof(data.payload.extend) == 'boolean' && data.payload.extend === true ) ? true : false

        if(!tokenId || !extend) throw {message: 'missing tokenId or extend was false'}

        // Read the exists token
        let tokenObj =( await  _data.read( TOKENS_TABLE , tokenId )).data
        tokenObj.expired = Date.now() + TOKEN_EXPIRED_TIME

        // Update the extened token in DB
        await _data.update( TOKENS_TABLE , tokenId , tokenObj )

        resolve(tokenObj)

    } catch (error) {
        reject(error)
    }
})

/**
 * Delete the token 
 * @param {object} data - tokenId in the queryStringObject
 */
lib.delete = async( data ) => new Promise( async(resolve,reject) => {
    try {
        // Validation
        let tokenId =  ((typeof(data.queryStringObject.tokenId )=='string' && data.queryStringObject.tokenId.trim().length == TOKEN_LENGTH )) ? data.queryStringObject.tokenId.trim() : false

        if(!tokenId ) throw {message: 'missing tokenId'}

        // Delete
        await _data.delete( TOKENS_TABLE , tokenId )

        resolve({})

    } catch (error) {
        reject(error)
    }
})

/**
 * Verify that token belongs to this email and is still valid
 * @param {string} tokenId 
 * @param {string} email 
 */
lib.verifyToken = async( tokenId, email) => new Promise( async(resolve,reject) => {
    try {
        // Validation
        let tokenIdValid = (typeof(tokenId)=='string' && tokenId.trim().length == TOKEN_LENGTH ) ? true : false
        let emailVaid    = ( typeof(email) == 'string' && email.trim().length >=3 && email.includes('@')) ? true : false

        if (!tokenIdValid || !emailVaid) throw {message: 'tokenId or email  not valid'}

        // Check token
        let tokenObj =   (await _data.read( TOKENS_TABLE , tokenId )).data
        let currentTime = Date.now()
        
        if (tokenObj.email === email && tokenObj.expired >= currentTime ) {
            resolve(true)
        }
        else 
        {
            reject({message: 'token not valid, try to login again'})
        }
        
    } catch (error) {
        console.log("verifyToken error : ", error);
        reject( {message: 'token is not valid'})
    }
})


lib.getEmailFromToken = async(tokenId) => new Promise( async(resolve,reject)=>{
    try {
        let tokenObj = (await _data.read( TOKENS_TABLE, tokenId )).data
        resolve(tokenObj.email)

    } catch (error) {
        reject(error)
    }
})



module.exports = lib
