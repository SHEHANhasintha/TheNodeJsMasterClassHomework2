/**
 * Users module.
 */

const _data = require('./data')
const _helpers = require('./helpers')
const _tokens  = require('./tokens')
const ACCEPTABLE_METHODS = ['get','post','put','delete']
const NO_ERROR = { error: false }
const USERS_TABLE = 'users'


 let lib = {}

 //#region methods

 lib.router = async (data, callback) => {
    try {
        if ( ACCEPTABLE_METHODS.includes(data.method ) ) {

            let response = await lib[data.method](data)
            callback(200, response )

        } else {
            throw  {message: 'method not acceptable'}
        }
    } catch (error) {
        console.log(error)
        
        callback(400, { error: error.message})        
    }
 }

lib.post  = async(data) => new Promise( async function createUser (resolve,reject) {

    try {
        
        let user = await _getValidatedUserFromData(data)
        await _data.create(USERS_TABLE,user.email ,user)
        resolve(user)    

    } catch (error) {
        reject(error)    
    }
})

lib.get  = async(data) => new Promise( async function readUser (resolve, reject) {

    try {
        // Validation
        let email = (typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 3 && data.queryStringObject.email.includes('@') && data.queryStringObject.email.includes('.') ) ? data.queryStringObject.email.trim() : false
        if (!email) throw 'missing email of user of email not validated'
        
        // check token validation
        if ( await _tokens.verifyToken(data.headers.tokenid , email) === false ) throw 'token is not valid'

        let raw = await _data.read(USERS_TABLE,email)
        let user = raw.data
        delete user.hashedPassword
        resolve(user)

    } catch (error) {
        reject(error)
    }
})

lib.put = async(data) => new Promise( async function updateUser(resolve,reject) {
    try {
        let email = (typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 3 && data.queryStringObject.email.includes('@') && data.queryStringObject.email.includes('.') ) ? data.queryStringObject.email.trim() : false
        if (!email) throw {message: 'missing email of user of email not validated' }
        
        // check token validation
        if ( await _tokens.verifyToken(data.headers.tokenid , email) === false ) throw { message: 'token is not valid' }

        let existsUser = (await _data.read(USERS_TABLE , email )).data
        
        let updatedUser = {}
        // email can't be changed because it is the primary key.
        //updatedUser.email = (typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 4 ) ? data.payload.email.trim() : existsUser.email
        updatedUser.name  = (typeof(data.payload.name) == 'string' && data.payload.name.trim().length >= 2 ) ? data.payload.name.trim() : existsUser.name
        updatedUser.street= (typeof(data.payload.street) == 'string' && data.payload.street.trim().length > 0) ? data.payload.street.trim() : existsUser.street
        updatedUser.hashedPassword = (typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 3 ) ? _helpers.hashPassword(data.payload.password.trim()) : existsUser.hashedPassword

        await _data.update(USERS_TABLE,existsUser.email,updatedUser)
        resolve(NO_ERROR)

    } catch (error) {
        reject(error)
    }
})

lib.delete = async(data) => new Promise( async function deleteUser(resolve,reject) {
    try {
        let email = (typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 3 && data.queryStringObject.email.includes('@') && data.queryStringObject.email.includes('.') ) ? data.queryStringObject.email.trim() : false
        if (!email) throw 'missing email of user of email not validated'

        // check token validation
        if ( await _tokens.verifyToken(data.headers.tokenid , email) === false ) throw { message: 'token is not valid'}


        _data.delete(USERS_TABLE , email)
        resolve(NO_ERROR)

    } catch (error) {
        reject(error)
    }
})



//#endregion

//#region private functions 
const _getValidatedUserFromData = (data) => new Promise(  async(resolve, reject ) => {
    try {
        let user = {}
        user.email = (typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 4 ) ? data.payload.email.trim() : false
        user.name  = (typeof(data.payload.name) == 'string' && data.payload.name.trim().length >= 2 ) ? data.payload.name.trim() : false
        user.street= (typeof(data.payload.street) == 'string' && data.payload.street.trim().length > 0) ? data.payload.street.trim() : false
        user.hashedPassword = (typeof(data.payload.password) == 'string' && data.payload.password.trim().length>0 ) ? _helpers.hashPassword(data.payload.password.trim()) : false

        if(user.email && user.name && user.street && user.hashedPassword) {
            resolve(user)
        } else { 
            if (!user.email) throw 'email missing or not validated'
            if (!user.name)  throw 'name missing or not validated'
            if (!user.street) throw 'street missing or not validated'
            if (!user.hashedPassword) throw 'password missing or not validated'

        }
        
    } catch (error) {
        reject({error:error})
    }
})

//#endregion
 module.exports = lib