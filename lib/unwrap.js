'use strict'

const {parse} = require('./header')

function UnwrapHeader(socket, cbk) {
    socket.once('data', (buf)=>{
        socket.pause()
        let {payload, length} = parse(buf)
        if (length>0) {
            // valid header
            socket.passthrough = payload
            // unshift extra data
            if (buf.length > length)
                socket.unshift(buf.slice(length))
        }else{
            // invalid header
            socket.unshift(buf)
        }
        cbk(payload)
        socket.resume()
    })
}

module.exports = UnwrapHeader
