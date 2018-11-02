/**
 * 
 * Module to deal with Stripe payment Api.
 * 
 */

const https = require('https')
var querystring = require('querystring');
const config = require('./config')

 let lib = {}

 /**
 * Make payment with Stripe.
 * Parameters :   
 *  - amount in cents
 *  - token from frontend
*/
 lib.makePayment = async( amount, token ) => new Promise( async(resolve,reject) => {
    try {

        var post_data = querystring.stringify({
            amount: amount,
            currency: 'usd',
            description: "The Best Pizza",
            source: token
       });
       
       var basicAuthHeader = 'Basic ' + Buffer.from(config.stripeSecKey + ':' + '').toString('base64');

       var  requestDetails = {
            protocol: 'https:',
            hostname: 'api.stripe.com',
            method: 'POST',
            path: '/v1/charges',
            timeout: 10000,
            headers: {
                'Host' : 'api.stripe.com',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': post_data.length, //Buffer.byteLength(post_data),
                'Authorization': basicAuthHeader
            }
        }

        let req = https.request(requestDetails, function(res) {
            
            let answer = "";
            var status  = res.status
            res.setEncoding('utf8');
            
            res.on('data', (chunk) => {
                answer = answer + chunk
            })

            res.on('end', () => {
                answer = JSON.parse(answer)
                resolve(answer)
            })
            
        })

        req.on('error', function(err) { 
            reject(err)
        })

        req.on('timeout',function(err) {
            reject({message: 'timeout'})
        })

        // Becuase it post method - data need to be wrriten
        req.write(post_data)

        // End=Send the request
        req.end()

    } catch (error) {
        reject(error)
    }
 })


 module.exports = lib