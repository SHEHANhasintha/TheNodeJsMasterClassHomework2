const _tokens = require('./tokens')

const ACCEPTABLE_METHODS = ['get']
const MENU = [
    { id: 1, name: 'Family Pizza', price : 67 },
    { id: 2, name: 'Coca-Cola 1.5L', price : 12 },
    { id: 3, name: 'Nestea 1.5L', price: 10 },
    { id: 4, name: 'Sprite 1.5L', price : 11 }
    
]


let lib = {}

lib.router = async(data,callback) =>  {
    try {
        if ( ACCEPTABLE_METHODS.includes(data.method ) ) {
            let response = await lib[data.method](data)
            callback(200, response )
        } else {
            throw  {message: 'method not acceptable' }
        }
    } catch (error) {
        console.log(error)
        callback(400, { error: error.message})        
    }    
}

lib.get = async(data) => new Promise( async(resolve,reject) => {

    try {
        
        // check token validation
        if ( await _tokens.verifyToken(data.headers.tokenid , data.queryStringObject.email) === false ) throw  {message: 'token is not valid'}
        resolve(MENU)    

    } catch (error) {
        reject(error)
    }
    
})

lib.getMenuItem = async( id ) => new Promise( async( resolve,reject) => {
    try {
        if (MENU[id] != undefined) {
            resolve(MENU[id])
        } else {
            reject({message: 'Item does NOT exists in the menu.'})
        }
    } catch (error) {
        reject(error)
    }
})


module.exports = lib