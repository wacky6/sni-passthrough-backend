'use strict'

const spdy = require('spdy')
const read = require('fs').readFileSync
const Backend = require('../').HttpsServer
const tls = require('tls')
const https = require('https')
const http =  require('http')
const {createServer} = require('../')
const {strictEqual} = require('assert')

const PORT  = 7444
const serverCert = read('./cert.pem')
const serverKey  = read('./key.pem')
const opts = {
    cert: serverCert,
    key:  serverKey
}

const DATA = "===HTTP DATA==="

describe('spdy compatibility', ()=>{
    let backend
    before(function(next){
        backend = spdy.createServer(
            Backend,
            opts,
            (req, res)=>{
                res.writeHead(200)
                res.write(DATA)
                res.end()
            }
        )
        backend.listen(PORT, next)
    })

    it('works with vanilla https', function(done){
        let req = https.get({
            host: '127.0.0.1',
            port:  PORT,
            rejectUnauthorized: false,
            agent: false
        }, (res)=>{
            res.once('data', (chunk)=>{
                strictEqual(chunk.toString(), DATA)
                done()
            })
        })
    })

    it('works with spdy', function(done){
        let agent = spdy.createAgent({
            host: '127.0.0.1',
            port: PORT,
            rejectUnauthorized: false
        })
        https.get({
            host: '127.0.0.1',
            path: '/',
            agent: agent
        }, (res)=>{
            res.once('data', (chunk)=>{
                strictEqual(chunk.toString(), DATA)
                done()
            })
        })
    })

    after(function(){
        backend.close()
    })
})
