SNI Passthrough Backend
===
tls.Server, https.Server Compatible  
X-Real-IP work-around for TLS-SNI (Layer 4) Proxy

## Usage

Designed to work with [sni-passthrough](https://github.com/wacky6/sni-passthrough)

#### Back-end Example:
```JavaScript
const Backend = require('sni-passthrough-backend')
const opts = { /* same as TLS.createServer */ }

// don't listen on publicly accessible address
// or malicious user can spoof ip address / etc.
let svr = Backend.createServer(opts).listen(10443, '::1')
svr.on('secureConnection', (socket)=>{
    socket.remoteAddress
    // -> get remote's address as if running on public internet
})

// work with spdy/https
const spdy = require('spdy')
const HttpsBackend = require('sni-passthrough-backend').https.Server
spdy.createServer(HttpsBackend, opts, (req, res)=>{})
```

#### API
```JavaScript
module.exports = {
    inject: (server) => injected,   // => inject connection handler to server
    createServer,                   // => same as module.exports.tls.createServer
    tls: {
        Server,        // => wrapped tls.Server
        createServer   // => wrapped tls.createServer
    },
    https: {
        Server,        // => wrapped https.Server
        createServer   // => wrapped https.createServer
    }
}
```



## Supported Properties
* `remote{Address,Port,Family}`: intercepts `net.Socket._handle.getpeername()`


## Explanation
#### Before:
```Text
[Remote]  --TLS->  [Front-end]  --TLS->  [SNI-1]

Front-end distributes connection to back-ends according to TLS Server Name
In SNI-1, remote address is front-end's address, not good for applications
```

#### After:
```Text
[Remote]  --TLS->  [Front-end]  --iPkt/TLS->  [SNI-1]

iPkt is injected as the first packet to SNI-1, containing some payload.
[SNI-1] intercepts and processes iPkt, then proceed as if normal TLS connection

Internally, hijacks tls.Server's `'connection'` event
```

#### Time Sequence
```Text
[Client]                [Front-end]            [Back-end]
Client-Hello    --->
                        iPkt            --->   Parse & Modify net.Socket
                        Client-Hello    --->   Pass to TLS.Socket
            /* Continue as if front-end is transparent */
```


## Note
May be a `X-Forwarded-For` TLS Extension ?


## Testing
1. `npm install`
2. Generate key, self-sign certificate
3. Put them at `key.pem`, `cert.pem`
4. In terminal, run `mocha`


## LICENSE
MIT (C) wacky6
