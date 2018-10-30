/**
 * Mailgun module
*/
const https = require('https')
var querystring = require('querystring');
const config = require('./config')
var lib = {}

lib.sendEmail = async(from,to,subject,msg ) => new Promise( async(resolve,reject) => {
    try {

        var post_data = querystring.stringify({
            from: from,
            to: to,
            subject: subject,
            html:  msg
       });
       
       var basicAuthHeader = 'Basic ' + Buffer.from('api:' + config.mailgunApiKey).toString('base64');

       var  requestDetails = {
            protocol: 'https:',
            hostname: config.mailgunHostName,
            method: 'POST',
            path: config.mailgunPath,
            timeout: 10000,
            headers: {
                'Host' : config.mailgunHostName,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': post_data.length,
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
