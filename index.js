'use strict'

const tls = require('tls')
const net = require('net')
const unwrap = require('./lib/unwrap')

const plugins = [
    require('./plugins/peername')
]

function createSNIBackendServer(opts, listener) {
    let tlsServer = tls.createServer(opts, listener)

    // modify TLSServer's connection listener to parse injected header
    let TLSServerConnectionListener = tlsServer.listeners('connection')[0]
    tlsServer.removeListener('connection', TLSServerConnectionListener)
    tlsServer.addListener('connection', (raw) =>
        unwrap(raw, (payload) => {
            if (payload !== undefined)
                plugins.forEach( plugin => plugin(raw, payload) )
            TLSServerConnectionListener(raw)
        })
    )

    return tlsServer
}

module.exports = {
    createServer: createSNIBackendServer
}
