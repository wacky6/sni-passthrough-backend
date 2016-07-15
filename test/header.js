'use strict'

const header = require('../lib/header')
const {ok, deepStrictEqual, strictEqual, throws} = require('assert')

const payload = {
    address: '127.0.0.1',
    port:    123456,
    family:  'IPv4'
}


describe('header create', function(){
    it('works with omitted version', function(){
        deepStrictEqual(
            header.parse(header.create(payload)).payload,
            payload
        )
    })
    it('throws on wrong version', function(){
        throws( ()=>create(payload, 257) )
    })
    it('throws on non-object', function(){
        [null, ()=>({}), 0, 'str'].forEach(
            (val) => throws( ()=>create(val) )
        )
    })
})


describe('header parse', function(){
    const payload = {}
    const resultOnError = {
        payload: undefined,
        length:  0
    }
    it('fails for bad magic', function(){
        const wrongMagic = Buffer.from([0x16, 0x03, 0xFF, 0x00, 0x01, 0xA1])
        deepStrictEqual(
            header.parse(wrongMagic),
            resultOnError
        )
    })
    it('fails if payload length underflow', function(){
        const underflow = Buffer.from(header.create(payload).slice(0, 6))
        deepStrictEqual(
            header.parse(underflow),
            resultOnError
        )
    })
    it('fails if payload length overflow', function(){
        const overflow = Buffer.from(header.create(payload))
        overflow.writeUInt16BE(0xFFFF, 3)
        deepStrictEqual(
            header.parse(overflow),
            resultOnError
        )
    })
    it('fails for magic+version only', function(){
        const malicious = Buffer.from([0xAE, 0x53, 0xFF])
        deepStrictEqual(
            header.parse(malicious),
            resultOnError
        )
    })
})
