/**
 * Server related function
 * Listen to http, https.
 * - function define the http server
 * - function to create the server with defenitions
 * - init function that start listen to server
 * - 
 */

const http    = require('http')
const https   = require('https')
const _config = require('./config')
const util    = require('util')
const url     = require('url')
const debug   = util.debuglog('SERVER')
const fs      = require('fs')
const path    = require('path')
const StringDecoder 
              = require('string_decoder').StringDecoder
const qs      = require('querystring')
let  _data   = require('./data')
let users    = require('./users')
let tokens = require('./tokens')
let menu    = require('./menu')
let cart    = require('./cart')
let orders  = require('./orders')

// Container object
 var server = {}

 // Http server
server.httpServer = http.createServer((req,res) => {
    server.unifiedHttpServer(req,res)
})

server._httpsServerOptions = {
    key: fs.readFileSync(path.join(__dirname,'../ssl/key.pem')),
    cert: fs.readFileSync(path.join(__dirname,'../ssl/cert.pem'))
}

server.httpsServer = https.createServer(server._httpsServerOptions,(req,res) => { server.unifiedHttpServer(req,res)})

// Unified http+https server
server.unifiedHttpServer =  (req,res) => {

    // Pull request data to object
    let parsedUrl   = url.parse(req.url,true)
    // Get the pathname without slashed at the start/end.
    let pathName    = parsedUrl.pathname.replace(/^\/+|\/+$/g,'')
    let headers     = req.headers
    let method      = req.method.toLowerCase()
    let buffer      = ''
    // Get body if exists
    req.on('data',(newData) => {
        buffer +=  newData
    })
    req.on('end',() => {
        let decoder = new StringDecoder('utf8')
        // Return any remaining input stored in buffer.
        buffer += decoder.end()
    
        let data = {
            trimmedPath:         pathName,
            headers:             headers,
            method:              method,
            queryStringObject:   parsedUrl.query,
            payload:             (buffer.length>0) ? server._getParsedBody(buffer,method,pathName)  : {}
        }

        // Get the matched handler
        let chosenHandler = (typeof(server.routes[pathName]) !== 'undefined' ) ? server.routes[pathName] : server.notFound
        chosenHandler(data, function (statusCodeToReturn, payloadToReturn) {
           
            // Validation
            statusCodeToReturn = (typeof (statusCodeToReturn) == 'number') ? statusCodeToReturn : 200
            payloadToReturn = (typeof (payloadToReturn) == 'object') ? payloadToReturn : {}
            
            // Convert payload to string
            let payloadAsString = JSON.stringify(payloadToReturn)
            
            // Return to requester
            res.statusCode = statusCodeToReturn
            res.setHeader('Content-Type', 'application/json')
            res.end(payloadAsString)

        })
    })
}


server._getParsedBody = (bodyString,method,pathName) => {

    let response = {}

    if(method == 'post' && pathName == 'orders') {
        response = qs.parse(bodyString)
    } else { 
        response = JSON.parse(bodyString)
    }

    return response
    
}

/*
server.update = async(data,callback) => {
    try {
        let result = await _data.update('bubu','createExample',{my:'name',is:'Eyal'})
        callback(200,{success: true})    
    } catch (error) {
        callback(400, {error: error})
    }
}

server.delete = async(data,callback) => {
    await _data.delete('bubu','fffff8')
    callback(200,{success:true})
}

server.read = async (data,callback) => {
    try {
        let x = await _data.read('bubu','createExample')
        callback(200, {data:x })
    } catch (error) {
        callback(400, {error: error})    
    }    
}

server.create = async (data,callback) => {
      console.log('create')
    
    await _data.create('bubu','createExample',{dsfs:44,rrrr:32} )
    callback(200, {error: false})
}
*/
server.notFound = () => {
    console.log('not found')
}



server.routes = {
    'users' : users.router,
    'tokens': tokens.router,
    'menu': menu.router,
    'cart': cart.router,
    'orders':orders.router,
    /*'delete':server.delete,*/
    
}



// Init function
server.init = () => {

    // start listen to http
    server.httpServer.listen(_config.port,() => { console.log('\x1b[32m%s\x1b[0m','server runing on port ' + _config.port)})

    // start listen to https
    server.httpsServer.listen(_config.httpsPort, () => { console.log('\x1b[32m%s\x1b[0m','server listen via https in port :' ,_config.httpsPort)})

}

 module.exports = server.init