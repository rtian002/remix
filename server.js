const http = require('http'); 
const fs = require("fs");
const path = require("path");

const server = http.createServer((req,  res) => { 
  const filePath = path.join(__dirname, 'index.html');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      res.writeHead(204, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
      res.end(data);
    }
  }); 
}); 

const {WebSocket,createWebSocketStream}=require('ws');
const { TextDecoder } = require('util');
const net=require('net');

const UUID='ffb7d2b3-0000-4562-aeb5-596ba03cfa75'
const uuid= (process.env.UUID||UUID).replace(/-/g, "");
const port= process.env.PORT||3000;
const wss=new WebSocket.Server({server,path:'/blackmyth'});
wss.on('connection', ws=>{
    ws.once('message', msg=>{
        const [VERSION]=msg;
        const id=msg.slice(1, 17);
        if(!id.every((v,i)=>v==parseInt(uuid.substr(i*2,2),16))) return;
        let i = msg.slice(17, 18).readUInt8()+19;
        const port = msg.slice(i, i+=2).readUInt16BE(0);
        const ATYP = msg.slice(i, i+=1).readUInt8();
        const host= ATYP==1? msg.slice(i,i+=4).join('.')://IPV4
            (ATYP==2? new TextDecoder().decode(msg.slice(i+1, i+=1+msg.slice(i,i+1).readUInt8()))://domain
                (ATYP==3? msg.slice(i,i+=16).reduce((s,b,i,a)=>(i%2?s.concat(a.slice(i-1,i+1)):s), []).map(b=>b.readUInt16BE(0).toString(16)).join(':'):''));//ipv6
        ws.send(new Uint8Array([VERSION, 0]));
        const duplex=createWebSocketStream(ws);
        net.connect({host,port}, function(){
            this.write(msg.slice(i));
            duplex.pipe(this).pipe(duplex);
        })
    })
});
server.listen(port); 
