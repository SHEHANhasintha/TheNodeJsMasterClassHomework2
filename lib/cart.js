/**
 * Shoping cart module.
 */
const ACCEPTABLE_METHODS = ['get','put','post','delete']
const _data = require('./data')
const _menu = require('./menu')
const   _tokens = require('./tokens')
const _helpers=require('./helpers')
const CART_TABLE = 'cart'
const NO_ERROR = { error: false }

const CART_ID_LENGTH = 20
let lib = {}



lib.router = async ( data,callback) => {
    try {
        if (ACCEPTABLE_METHODS.includes(data.method)) {
            let result = await lib[data.method](data)
            callback(200, result)
        } else {
            throw {message: 'method not acceptable'}
        }
    } catch (error) {
        console.log(error)
        callback(400,{error:error.message})
    }
}

/**
 * Insert new order with items
 * Item Id must be from the menu
 * @param {array of menu item with Quantity} data.payload.items 
 * @param {string} data.payload.email 
 */
lib.post = async( data ) => new Promise( async(resolve,reject) => {
    try {
        
        let email   =  ( typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 3 && data.payload.email.includes('@')) ? data.payload.email.trim() : false
        let items   = ( typeof(data.payload.items) == 'object' && data.payload.items instanceof Array && data.payload.items.length > 0 ) ? data.payload.items : false
    
        if ( await _tokens.verifyToken(data.headers.tokenid , email) === false ) throw  {message: 'token is not valid'}
        if ( !email || !items ) throw { message: 'email/items missing or not validated'}

        // Create order id
        let cart = {}
        cart.id = _helpers.createRandomString(CART_ID_LENGTH)
        cart.items = []
        cart.userEmail = email
        cart.amount = 0;

        for (let index = 0; index < items.length; index++) {
            let  item  = items[index]
            let itemFromMenu = await _menu.getMenuItem(item.id) 
            item.name = itemFromMenu.name
            cart.amount += (itemFromMenu.price * item.quantity)
            cart.items.push(item)
        }

        await _data.create(CART_TABLE ,cart.id , cart )
        resolve(cart)

    } catch (error) {
        reject(error)
    }
})

/**
 * Get all cart with its items
 * Required : cart id  - from queryStringObject
 * 
 */
lib.get = async (data) => new Promise( async(resolve, reject) =>{
    try {
        let cartId =  (typeof(data.queryStringObject.cartId) == 'string' && data.queryStringObject.cartId.trim().length == CART_ID_LENGTH ) ? data.queryStringObject.cartId  : false
        let email = await _tokens.getEmailFromToken(data.headers.tokenid)
        if ( await _tokens.verifyToken(data.headers.tokenid , email) === false ) throw  {message: 'token is not valid'}
        
        let cart = (await _data.read( CART_TABLE , cartId)).data
     

        // Check that cart belongs to user.
        if (cart.userEmail !== email) throw {message:'this cart does not belongs to this user'}

        resolve(cart)

    } catch (error) {
        reject(error)
    }
})

/**
 * Put  cart
 * Required : cart id  - from queryStringObject
 * Reuqired in body : the cart object completly with all the changes.
 */

lib.put = async(data) => new Promise( async(resolve,reject) => {
    try {
        let cartId =  (typeof(data.queryStringObject.cartId) == 'string' && data.queryStringObject.cartId.trim().length == CART_ID_LENGTH ) ? data.queryStringObject.cartId  : false
        let updatedCart = (typeof(data.payload) == 'object' && typeof(data.payload.items)=='object' && data.payload.items instanceof Array  && data.payload.items.length > 0 ) ? data.payload : false

        if(!cartId || !updatedCart) throw {message: 'cartId or cart object is missing'}
        if(updatedCart.id != cartId) throw {message: ' cart id not match'}
        let email = await _tokens.getEmailFromToken(data.headers.tokenid)
        if ( await _tokens.verifyToken(data.headers.tokenid , email) === false ) throw  {message: 'token is not valid'}

        let cart = (await _data.read( CART_TABLE , cartId)).data
        

        // Check that cart belongs to user.
        if (cart.userEmail !== email) throw {message:'this cart does not belongs to this user'}
        

        await _data.update( CART_TABLE ,cartId , updatedCart)

        resolve(NO_ERROR)
        
    } catch (error) {
        reject(error)
    }
})

lib.delete = async(data) => new Promise( async(resolve,reject) => {
    try {
        
        let cartId =  (typeof(data.queryStringObject.cartId) == 'string' && data.queryStringObject.cartId.trim().length == CART_ID_LENGTH ) ? data.queryStringObject.cartId  : false
        
        if(!cartId) throw {message: 'cartId  is missing'}
        let email = await _tokens.getEmailFromToken(data.headers.tokenid)
        if ( await _tokens.verifyToken(data.headers.tokenid , email) === false ) throw  {message: 'token is not valid'}

        // Check that cart belongs to user.
        let cart = (await _data.read( CART_TABLE , cartId)).data
        if (cart.userEmail !== email) throw {message:'this cart does not belongs to this user'}

        await _data.delete(CART_TABLE , cartId)

        resolve(NO_ERROR)
    } catch (error) {
        reject(error)
    }
})

module.exports = lib