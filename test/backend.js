const Backend = require('../')
const tls = require('tls')
const net = require('net')
const https = require('https')
const {ok, strictEqual, throws} = require('assert')
const {readFileSync: read} = require('fs')
const {inspect} = require('util')
const header = require('../lib/header')

const frontendPort = 7443
const backendPort  = 7444
const serverCert = read('./cert.pem')
const serverKey  = read('./key.pem')
const opts = {
    cert: serverCert,
    key:  serverKey
}

function passthrough(dest, src, inject) {
    dest.write(inject)
    src.pipe(dest)
    dest.pipe(src)
}

function passthourghAggretage(dest, src, inject) {
    // aggregate inject and first packet into one write operation
    src.once('data', (firstChunk)=>{
        src.pause()
        dest.write(Buffer.concat([inject, firstChunk]))
        src.pipe(dest)
        dest.pipe(src)
        src.resume()
    })
}

describe('API interface', function(){
    it('injects tls.Server', function(){
        ok( Backend.inject( tls.createServer(opts) ) instanceof tls.Server )
    })
    it('refuse to inject non tls.Server', function(){
        throws( ()=>Backend.inject({}) )
    })
    it('tls.Server compatible', ()=>{
        ok( Backend.tls.createServer(opts) instanceof tls.Server )
    })
    it('https.Server compatible', function(){
        ok( Backend.https.createServer(opts) instanceof https.Server )
    })
})

describe('simulation', function(){
    let frontend, backend

    before(function(next){
        backend = Backend.createServer(opts)
        backend.listen(backendPort, next)
    })
    before(function(next){
        frontend = net.createServer()
        frontend.listen(frontendPort, next)
    })

    it('works with compatible front-end', function(done){
        let payload = {
            address: '192.168.1.100',
            port:    123456,
            family:  'IPv4'
        }
        let content = '===SOCKET DATA==='
        frontend.once('connection', (socket)=>{
            let dest = net.connect(backendPort, ()=>{
                passthrough(dest, socket, header.create(payload))
            })
        })
        let cli = tls.connect(frontendPort, {rejectUnauthorized: false}, ()=>{
            cli.write( content )
            cli.end()
        })
        backend.once('secureConnection', (tlsSocket)=>{
            strictEqual(tlsSocket.remoteAddress, payload.address)
            strictEqual(tlsSocket.remotePort,    payload.port)
            strictEqual(tlsSocket.remoteFamily,  payload.family)
            tlsSocket.once('data', (data)=>{
                strictEqual(data.toString(), content)
                done()
            })
        })
    })
    it('works without front-end', function(done){
        let content = '===SOCKET DATA==='
        let cli = tls.connect(backendPort, {rejectUnauthorized: false}, ()=>{
            cli.write( content )
            cli.end()
        })
        backend.once('secureConnection', (tlsSocket)=>{
            tlsSocket.once('data', (data)=>{
                strictEqual(tlsSocket.remotePort, cli.localPort)
                strictEqual(data.toString(), content)
                done()
            })
        })
    })
    it('works with aggregated stream chunks', function(done){
        let payload = {
            address: '192.168.1.100',
            port:    60123,
            family:  'IPv4'
        }
        let content = '===SOCKET DATA==='
        frontend.once('connection', (socket)=>{
            let dest = net.connect(backendPort, ()=>{
                passthourghAggretage(dest, socket, header.create(payload))
            })
        })
        let cli = tls.connect(frontendPort, {rejectUnauthorized: false}, ()=>{
            cli.write( content )
            cli.end()
        })
        backend.once('secureConnection', (tlsSocket)=>{
            strictEqual(tlsSocket.remoteAddress, payload.address)
            strictEqual(tlsSocket.remotePort,    payload.port)
            strictEqual(tlsSocket.remoteFamily,  payload.family)
            tlsSocket.once('data', (data)=>{
                strictEqual(data.toString(), content)
                done()
            })
        })
    })

    after(function(next){
        backend.close( ()=>
            frontend.close( next )
        )
    })
})
