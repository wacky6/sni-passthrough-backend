'use strict'

const tls = require('tls')
const net = require('net')
const https = require('https')
const assert = require('assert').ok
const unwrap = require('./lib/unwrap')
const {inherits} = require('util')

const plugins = [
    require('./plugins/peername')
]

function injectConnectionHandler(server) {
    if ( ! server instanceof tls.Server )
        throw new Error('SNIBackend: must be compatible with tls.Server')

    let listeners = server.listeners('connection').slice()

    assert( listeners.length>0, 'Connection listeners should be added' )

    server.removeAllListeners('connection')
    server.addListener('connection', (raw)=>{
        unwrap(raw, (payload)=>{
            if (payload !== undefined)
                plugins.forEach( plugin => plugin(raw, payload) )
            listeners.forEach( listener => listener.call(this, raw) )
        })
    })

    return server
}


function SNIBackendTLS(...args) {
    tls.Server.call(this, ...args)
    // allows listeners to be added
    process.nextTick( ()=>injectConnectionHandler(this) )
}
inherits(SNIBackendTLS, tls.Server)


function SNIBackendHTTPS(...args) {
    https.Server.call(this, ...args)
    // allows listeners to be added
    process.nextTick( ()=>injectConnectionHandler(this) )
}
inherits(SNIBackendHTTPS, https.Server)


function createSNIBackendTLS(...args) {
    return new SNIBackendTLS(...args)
}

function createSNIBackendHTTPS(...args) {
    return new SNIBackendHTTPS(...args)
}

module.exports = {
    inject: injectConnectionHandler,
    createServer: createSNIBackendTLS,
    tls: {
        createServer: createSNIBackendTLS,
        Server:       SNIBackendTLS
    },
    https: {
        createServer: createSNIBackendHTTPS,
        Server:       SNIBackendHTTPS
    }
}
