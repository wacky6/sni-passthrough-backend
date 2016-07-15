'use strict'

module.exports = function hookPeerName(raw, payload) {
    // hijack getpeername if {address, port, family} are set
    if (payload.address && payload.port && payload.family)
        raw._handle.getpeername = (result) => {
            result.address = payload.address,
            result.port    = payload.port
            result.family  = payload.family
        }
}
