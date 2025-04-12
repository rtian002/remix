const UUID=process.env.UUID||'f0b7d2b3-4b1d-4562-aeb5-596ba03cfa75'
const html=`
<title>黑神话·悟空--拼图游戏</title>
<link rel="stylesheet" href="https://static.publics.dpdns.org/wukong.css" />
<script src="https://static.publics.dpdns.org/wukong.js"></script>
<div id="game"></div>
`

const http = require('http'); 
const server = http.createServer((req,  res) => { 
  res.writeHead(200,  { 'Content-Type': 'text/html' }); 
    res.end(html); 
}); 

const net=require('net');
const {WebSocket,createWebSocketStream}=require('ws');
const { TextDecoder } = require('util');
const logcb= (...args)=>console.log.bind(this,...args);
const errcb= (...args)=>console.error.bind(this,...args);

const uuid= UUID.replace(/-/g, "");
const port= process.env.PORT||3000;

const wss=new WebSocket.Server({server,path:'/blackmyth'});
wss.on('connection', ws=>{
    console.log("on connection")
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

        logcb('conn:', host,port);
        ws.send(new Uint8Array([VERSION, 0]));
        const duplex=createWebSocketStream(ws);
        net.connect({host,port}, function(){
            this.write(msg.slice(i));
            duplex.on('error',errcb('E1:')).pipe(this).on('error',errcb('E2:')).pipe(duplex);
        }).on('error',errcb('Conn-Err:',{host,port}));
    }).on('error',errcb('EE:'));
});

server.listen(port,  () => { 
    console.log(` 服务器正在监听端口 ${port}`); 
}); 
