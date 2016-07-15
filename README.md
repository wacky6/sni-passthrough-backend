SNI Passthrough Backend
===
TLSServer Compatible  
X-Real-IP work-around for TLS-SNI (Layer 4) Reverse Proxy

## Usage

** !!!! Currently sni-passthrough front-end is not implemented !!!! **

Designed to work with [sni-passthrough](https://github.com/wacky6/sni-passthrough)

#### Back-end:
```JavaScript
const createServer = require('sni-passthrough-backend')
const opts = { /* same as TLS.createServer */ }

// don't listen on publicly accessible address
// or malicious user can spoof ip address / etc.
let svr = createServer(opts).listen(10443, '::1')
svr.on('secureConnection', (socket)=>{
    socket.remoteAddress
    // -> get remote's address as if running on public internet
})
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

Internally, hijacks net.Server's `'connection'` listener after TLS.createServer
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



## LICENSE
MIT (C) wacky6
