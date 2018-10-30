/**
 * Orders module
 */
const ACCEPTABLE_METHODS = ['get','post','put','delete']
const ORDERS_TABLE = 'orders'
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

/***
 * 
 * TODO : make an callback from stripe "callbackFromStripe"
 * TODO : make an callback from stripe "callbackFromStripe"
 * TODO : make an callback from stripe "callbackFromStripe"
 * TODO : make an callback from stripe "callbackFromStripe"
 * TODO : make an callback from stripe "callbackFromStripe"
 * TODO : make an callback from stripe "callbackFromStripe"
 * TODO : make an callback from stripe "callbackFromStripe"
 * TODO : make an callback from stripe "callbackFromStripe"
 * TODO : make an callback from stripe "callbackFromStripe"
 * TODO : make an callback from stripe "callbackFromStripe"
 * TODO : make an callback from stripe "callbackFromStripe"
 * TODO : make an callback from stripe "callbackFromStripe"
 * TODO : make an callback from stripe "callbackFromStripe"
 * TODO : make an callback from stripe "callbackFromStripe"
 * 
 * 
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
 lib.post = async(data) => new Promise( async(resolve,reject) => {
     
    try {

        
        let stripeToken = ( typeof(data.payload.stripeToken) == 'string' && data.payload.stripeToken.trim().length > 0) ? data.payload.stripeToken.trim() : false
        let cartId = ( typeof(data.payload.cartId) == 'string'  && data.payload.cartId.trim().length > 0 ) ? data.payload.cartId : false
        // Amount will be multiplied by 100 , becuase for billing the amount is send in cents format.
        let amount = ( typeof(data.payload.amount) == 'number' && data.payload.amount > 0 ) ?   data.payload.amount * 100 : false
        let email = await _tokens.getEmailFromToken(data.headers.tokenid)
        if ( await _tokens.verifyToken(data.headers.tokenid , email) === false ) throw  {message: 'token is not valid'}
        if(!cartId || !amount || !stripeToken ) throw {message: 'cartId/amount/stripeToken  is missing or not valid'}
        
        
        // billing
        let response = await stripe.makePayment(amount , stripeToken);
        // save it in orders table
        let order = {
            id: _helpers.createRandomString(20),
            cartId: cartId,
            amount: amount,
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

    
    
    
 