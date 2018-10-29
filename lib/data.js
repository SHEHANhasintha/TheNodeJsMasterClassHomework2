/**
 * Lib to CRUD in files.
 * 
 */

// Dependencies
const fs        = require('fs')
var path      = require('path')
const helpers = require('./helpers')

const FLAG_WRITE = 'w'
const FLAG_WRITE_ONLY_NEW_FILE = 'wx' // failed if path already exists
const FLAG_READ_AND_WRITE_IN_EXISTS_FILE = 'r+'
const NO_ERROR = { error: false }

// Container
let lib = {}

lib.baseDirectory =  path.join(__dirname,'/../.data/')

/**
 * create new file and write data.
 * @param {String} subject - folder (=table) name
 * @param {String} id      - Record Id   
 * @param {object} dataToWrite - json object to write
 */
lib.create = async(subject , id , dataToWrite ) => {
    return new Promise( async(resolve,reject) => {
        try {
            let filename        = await _getFileName( subject , id )
            let fd              = await _openFile( filename , FLAG_WRITE_ONLY_NEW_FILE )
            await _writeFile(fd, dataToWrite)
            await _closeFile(fd)
            resolve(NO_ERROR)
        } catch (error) {
            reject(error)
        }
    })
}

/**
 * read content from file
* @param {String} subject - folder (=table) name
 * @param {String} id      - Record Id   
  */
lib.read = async(subject, id ) => new Promise( async(resolve,reject) => { 
        try {
            let filename = await _getFileName(subject,id)
            let data     = await _readFile(filename)     
            resolve({data: data, error:false})
        } catch (error) {
            reject(error)
        }
} )

/**
 * update data in file
 * @param {String} subject - folder (=table) name
 * @param {String} id      - Record Id   
 * @param {object} dataToUpdate - json object to replace the content inside the exists file
 */
lib.update = async(subject, id, dataToUpdate) => new Promise( async(resolve,reject) => { 
    try {
        let filename = await _getFileName(subject, id)
        let fd       = await _openFile(filename , FLAG_READ_AND_WRITE_IN_EXISTS_FILE)
        await _truncateFile(filename)
        await _writeFile( fd, dataToUpdate)
        await _closeFile(fd)
        resolve(NO_ERROR)

    } catch (error) {
        reject(error)
    }
} )

/**
 * delete file
 * @param {String} subject - folder (=table) name
 * @param {String} id      - Record Id   
 */
lib.delete = async(subject, id) => new Promise( async(resolve,reject) => { 
    try {
        let filename = await _getFileName( subject, id)
        fs.unlinkSync(filename)
        resolve(NO_ERROR)
    } catch (error) {
        reject(error)
    }   
})

// ********************** PRIVATE FUNCTIONS ***********************************************
const _readFile = async( filename ) =>  new Promise( async(resolve,reject) => { 
        try {
            let rawData = await  fs.readFileSync(filename, { encoding: 'utf8'} )
            let data = JSON.parse( rawData )
             resolve(data)
        } catch (error) {
            reject(error)
        }
})

const _getFileName = async (subject , id ) => {
    return new Promise( async (resolve,reject) => {
        try {
            if (id.includes('@')) id = id.replace('@','_')
            let filePath = path.join(lib.baseDirectory , subject, id + '.json')
            resolve(filePath)    
        } catch (error) {
            reject( error)
        }
        
    })
}

// Open file and return file descriptor
const _openFile = async( filename , flags ) => {
    return new Promise( async (resolve, reject) => {
        try {
            let fd = fs.openSync( filename, flags )
            resolve(fd)    
        } catch (error) {
            reject(error)
        }
    })
}

const _writeFile = async ( fd , dataToWrite ) => {
    return new Promise( (resolve, reject) => { 
        try {
            fs.writeFileSync( fd,  JSON.stringify(dataToWrite) ,{ encoding: 'utf8' , flag: 'w'})
            resolve()
        } catch (error) {
            reject(error)
        }
    })
 }

 const _truncateFile = async(filename) => new Promise( async(resolve,reject) => { 
    try {
        fs.truncateSync(filename)
        resolve()
    } catch (error) {
        reject(error)
    }   
 })
 
 const _closeFile = async ( fd ) => {
    return new Promise( (resolve, reject) => {
      try {
          fs.closeSync(fd)
          resolve()
      } catch (error) {
          reject(error)
      }
    })
 }

module.exports = lib

