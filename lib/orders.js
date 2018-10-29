/**
 * Orders module
 */
const ACCEPTABLE_METHODS = ['get','post','put','delete']

const stripe = require('./stripe')

 var lib = {}


lib.router = async(data,callback) => {
    try {
        if (ACCEPTABLE_METHODS.includes(data.method) ) {
            let response = await lib[data.method](data)
            callback(200, response)
        } else {
            throw {message: 'method not acceptable'}
        }
    } catch (error) {
        callback(400, {error: error.message})
    }
}



 lib.post = async(data) => new Promise( async(resolve,reject) => {
     
    try {
        let response = await stripe.makePayment( 1000, data.payload.token);
        //response = data
        
        resolve(response)

    } catch (error) {
        reject(error)
    }
 })


 module.exports = lib

    
    
    
 