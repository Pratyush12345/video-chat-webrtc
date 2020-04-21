const path= require('path')
const http= require('http')
const express= require('express')
const socketio= require('socket.io')

const app= express()

const server=http.createServer(app) 

const io=socketio(server)

const port= process.env.PORT||3000

const publicDirectoryPath= path.join(__dirname,'/public')

let clients=0;
app.use(express.static(publicDirectoryPath))

io.on('connection',(socket)=>{

    socket.on('NewClient', ()=>{
        if(clients<2){
                if(clients==1){
                console.log("in if block",clients)
                socket.emit('CreatePeer')}
        }
        clients++;
        console.log("outside if block",clients)
    })

    socket.on('offer',sendOffer) 
    socket.on('answer',sendAnswer)
    socket.on('new-ice-candidate',sendRemoteIceCandidate)
    
})

function sendOffer(offer){
    console.log(offer)
    this.broadcast.emit('broadcastoffer',offer)
}
function sendAnswer(answer){
    console.log(answer)
    this.broadcast.emit('broadcastanswer',answer)
}
function sendRemoteIceCandidate(candidate){
    console.log(candidate)
    this.broadcast.emit('broadcasticecandidate',candidate)
}


server.listen(port,()=>{
    console.log('server is up and running at port '+port);
})


