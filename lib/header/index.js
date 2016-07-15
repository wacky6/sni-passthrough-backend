'use strict'

/*
 * Header Format:
 * | offset  |          0 |        2 |               3 |       5 |
 * | type    |   UInt8[2] |    Uint8 |        UInt16BE | Payload |
 * | desc    |      Magic |  Version | Payload  Length | Payload |
 * | example |  0xAE 0x53 |     0x01 |          0x0010 |     ... |
 */

/*
 * TODO:: take measures to prevent ip-address spoof
 *        refer to X-Forwarded-For/X-Real-IP spoof techinques
 */

const versions = new Array(256)

versions[255] = require('./json')

/*
 * on success: return {payload, length}
 * on failure: return {undefined, 0}
 */
function parseHeader(buf) {
    try{
        // check magic
        if (buf[0]!==0xAE || buf[1]!==0x53)
            throw new Error('Bad Magic Number')

        let version = buf[2]
        let len = buf.readUInt16BE(3)

        // parse according to version
        if (versions[version].parse !== undefined)
            if (buf.length < 5+len)
                throw new Error('Bad payload length')
            else
                return {
                    payload: versions[version].parse(buf.slice(5, 5+len)),
                    length:  5+len
                }

        // Not supported
        throw new Error('Version not supported: parse, '+version)
    }catch(e){
        // console.log(e)
        return {
            payload: undefined,
            length:  0
        }
    }
}


/*
 * on success: return Buffer
 * on failure: throws
 */
function createHeader(payload, version=255) {
    if (versions[version].create === undefined)
        throw new Error('Version not supported: create, '+version)
    if (typeof payload !== 'object')
        throw new Error('Non object')

    let payloadBuf = versions[version].create(payload)

    let buf = new Buffer(5+payloadBuf.length)
    // magic
    buf[0] = 0xAE
    buf[1] = 0x53
    // version
    buf[2] = version
    // payload length
    buf.writeUInt16BE(payloadBuf.length, 3)
    // payload
    payloadBuf.copy(buf, 5)

    return buf
}

module.exports = {
    parse:    parseHeader,
    create:   createHeader,
    versions: versions
}
