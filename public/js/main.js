const socket = io()
var stun_server = "stun.l.google.com:19302"
var callButton=document.querySelector('#call')
var stream, yourConnection, connectedUser;
var yourVideo = document.querySelector('#localvideo')
var theirVideo = document.querySelector('#remotevideo')
var client={};


function start() {

    navigator.mediaDevices.getUserMedia({ "video": true, "audio": true })
        .then((mystream) => {
            stream=mystream
            yourVideo.srcObject = stream
            yourVideo.play()

            setupPeerConnection(stream)
     
            socket.on('broadcastoffer',MakeAnswer)
            socket.on('broadcastanswer',RespondtoAnswer)
            socket.on('broadcasticecandidate',SetRemoteICECandidate)

        }).catch((e)=>{
            console.log(e)
        })
}

callButton.addEventListener("click", ()=>{
     startPeerConnection();
})

async function SetRemoteICECandidate(candidate){
    if(candidate){
        try{
        await yourConnection.addIceCandidate(candidate)
        }
         catch(e){
            console.error('Error adding ice candidate',e)
         }  
    }
}

async function MakeAnswer(offer){

        if(offer){
            yourConnection.setRemoteDescription(new RTCSessionDescription(offer))
            const answer=await yourConnection.createAnswer()
            await yourConnection.setLocalDescription(answer)
            socket.emit('answer', answer)
        }    
}

async function RespondtoAnswer(answer){ 
    
    if(answer){
        const remoteDesc= new RTCSessionDescription(answer)
        await yourConnection.setRemoteDescription(remoteDesc)
    }
}

function setupPeerConnection(stream){

    yourConnection=new RTCPeerConnection({
        "iceServers": [{ "url": "stun:" + stun_server }]})
    
    //setupStream listening
    yourConnection.addStream(stream)
    yourConnection.onaddstream= (e)=>{
        theirVideo.srcObject = e.stream
        theirVideo.play()
    }   
    
    //setup ice handling
    yourConnection.addEventListener('icecandidate', event=>{
        if(event.candidate){
            socket.emit('new-ice-candidate', event.candidate)
            console.log(event.candidate)
        }
    })

}

async function startPeerConnection(){

    //begin the offer
    const offer=await yourConnection.createOffer()
    await yourConnection.setLocalDescription(offer)
    socket.emit('offer',offer)
    
}

