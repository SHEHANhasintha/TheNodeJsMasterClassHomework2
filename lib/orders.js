/**
 * Orders module
 */
const ACCEPTABLE_METHODS = ['get','post','put','delete']
const ORDERS_TABLE = 'orders'
const CART_TABLE = 'cart'
const _helpers = require('./helpers')
const _data = require('./data')
const stripe = require('./stripe')
const _tokens = require('./tokens')
const _mailgun = require('./mailgun')

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

/** Bill the user for specific cart.
 * The user will click on Stripe payment button.
 * And After click the "Pay" button - POST request will be handled by this function.
 * 
 */
lib.post = async(data) => new Promise( async(resolve,reject) => {
    try {
        
        let cartId = ( typeof(data.queryStringObject.cartId) == 'string' && data.queryStringObject.cartId.trim().length == 20 ) ? data.queryStringObject.cartId : false
        
        let stripeToken = ( typeof(data.payload.stripeToken) == 'string' && data.payload.stripeToken.trim().length > 0) ? data.payload.stripeToken.trim() : false
        if(!cartId ||  !stripeToken ) throw {message: 'cartId/stripeToken  is missing or not valid'}
        
        let cart = (await _data.read( CART_TABLE , cartId)).data

        
        
        // billing
        // Amount will be multiplied by 100 , becuase for billing the amount is send in cents format.
        let response = await stripe.makePayment( cart.amount * 100 , stripeToken);
        // save it in orders table
        let order = {
            id: _helpers.createRandomString(20),
            cartId: cartId,
            amount: cart.amount , // Amount will be multiplied by 100 , becuase for billing the amount is send in cents format.
            createdAt: Date.now(),
            creditCardResponse: response
        }

        await _data.create(ORDERS_TABLE  ,order.id , order )
        
        // Send an invoice
        let invoiceHtml = await lib._getInvoice(cart.userEmail,cart.amount)
        await _mailgun.sendEmail(cart.userEmail,cart.userEmail,'Invoice for you Best-Pizza order',invoiceHtml)
        
        resolve(order)

    } catch (error) {
        reject(error)
    }
})

/*
 *   User click on Pay Button --> get token AND redirected with POST to callback ---> callback trigger the order creation with the accepted token
 * 
 * 
 */


/**
 * Make an order - billing & invoice.
 * Required params: cartId - int,
 *                  amount - number, 
 *                  valid token for Stripe
 *                  valid auth token (in header)
 * 
 */
 /*lib.post = async(data) => new Promise( async(resolve,reject) => {
     
    try {

        
        let stripeToken = ( typeof(data.payload.stripeToken) == 'string' && data.payload.stripeToken.trim().length > 0) ? data.payload.stripeToken.trim() : false
        let cartId = ( typeof(data.payload.cartId) == 'string'  && data.payload.cartId.trim().length > 0 ) ? data.payload.cartId : false
        // Amount will be multiplied by 100 , becuase for billing the amount is send in cents format.
        let cart = (await _data.read( CART_TABLE , cartId)).data

     
        if(!cart ||  !stripeToken ) throw {message: 'cart/stripeToken  is missing or not valid'}
        
        
        // billing
        let response = await stripe.makePayment( cart.amount , stripeToken);
        // save it in orders table
        let order = {
            id: _helpers.createRandomString(20),
            cartId: cartId,
            amount: cart.amount,
            createdAt: Date.now(),
            creditCardResponse: response
        }

        await _data.create(ORDERS_TABLE  ,order.id , order )
        
        // Send an invoice
        let invoiceHtml = await lib._getInvoice(email,amount)
        let emailResult = await _mailgun.sendEmail(email,email,'Invoice for you Best-Pizza order',invoiceHtml)
        
        resolve(response)

    } catch (error) {
        reject(error)
    }
 })
*/

 lib._getInvoice = async(email,amount) => new Promise( async(resolve,reject) => {
     try {
         let currentDate = new Date().toLocaleDateString()
         let invoice = `
         <div style="direction:ltr;">
         <h1>Invoice</h1>
         <hr>
         <h3>To: ${email} </h3>
         <h3>Date: ${ currentDate  } </h3>
         <table style="border:1px solid black">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Pizza order</td>
                    <td>${amount} USD</td>
                </tr>
                <tr>
                    <td><b>Total:</b></td>
                    <td><b>${amount}</b></td>
                </tr>
            </tbody>

         </table>

         <p><br><br><h2>Thanks for your order !</h2></p>
         </div>
         `


        resolve(invoice)
     } catch (error) {
         reject(error)
     }
 })



 module.exports = lib

    
    
    
 