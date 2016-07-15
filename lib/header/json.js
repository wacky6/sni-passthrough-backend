'use strict'

module.exports = {
    parse(buf) {
        return JSON.parse(buf.toString('utf-8'))
    },
    create(payload) {
        return Buffer.from(JSON.stringify(payload), 'utf-8')
    }
}
