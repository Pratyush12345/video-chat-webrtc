const socket = io()


var stun_server = "stun.l.google.com:19302"

const localvideo = document.querySelector('video')

var client={};


function start() {

    navigator.mediaDevices.getUserMedia({ "video": true, "audio": true })
        .then((stream) => {
            socket.emit('NewClient')
            localvideo.srcObject = stream
            localvideo.play()

            function initpeer(type){
                let peer = {
                rtcPeerConnection: new RTCPeerConnection({
                    "iceServers": [{ "url": "stun:" + stun_server }]}),
                initiator: (type=='init')? true: false
                }
                let rtcPeerConnection=peer.rtcPeerConnection

                rtcPeerConnection.addEventListener('icecandidate', event=>{
                    if(event.candidate){
                        socket.emit('new-ice-candidate', event.candidate)
                    }
                })

                rtcPeerConnection.addEventListener('connectionstatechange', event=>{
                    let rtcPeerConnection=client.rtcPeerConnection
                    if(rtcPeerConnection.connectionState==='connected'){
                        console.log('peersConnected')
    
                        stream.getTracks().forEach(track=>{
                            rtcPeerConnection.addTrack(track, stream)
                        })
                    }
                })
                const remoteStream= new MediaStream()
                const remotevideo = document.querySelector('#remotevideo')
                remotevideo.srcObject=remoteStream
    
                rtcPeerConnection.addEventListener('track', async(event)=>{
                    remoteStream.addTrack(event.track, remoteStream)
                })
                

                return peer
            }
               
           async function MakeCall() {
            console.log("make call executed")
            client.gotAnswer=false
             
            let peer=initpeer('init')

            rtcPeerConnection=peer.rtcPeerConnection
            
            const offer=await rtcPeerConnection.createOffer()
            await rtcPeerConnection.setLocalDescription(offer)
            
            if(!client.gotAnswer)
            socket.emit('offer',offer)

            client.rtcPeerConnection=rtcPeerConnection
            
            }

            async function MakeAnswer(offer){
                let peer=initpeer('nonint')
                    rtcPeerConnection=peer.rtcPeerConnection

                    if(offer){
                        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(offer))
                        const answer=await rtcPeerConnection.createAnswer()
                        await rtcPeerConnection.setLocalDescription(answer)
                        socket.emit('answer', answer)
                    }    
                    client.rtcPeerConnection=rtcPeerConnection

            }

            async function RespondtoAnswer(answer){
                    client.gotAnswer=true
                    let rtcPeerConnection=client.rtcPeerConnection
                    if(answer){
                        const remoteDesc= new RTCSessionDescription(answer)
                        await rtcPeerConnection.setRemoteDescription(remoteDesc)
                    }
                    client.rtcPeerConnection=rtcPeerConnection
            }

            
            async function SetRemoteICECandidate(candidate){
                let rtcPeerConnection=client.rtcPeerConnection
                if(candidate){
                    try{
                    await rtcPeerConnection.addIceCandidate(candidate)
                    }
                     catch(e){
                        console.error('Error adding ice candidate',e)
                     }  
                }
            }
                
            socket.on('CreatePeer',MakeCall)
            socket.on('broadcastoffer',MakeAnswer)
            socket.on('broadcastanswer',RespondtoAnswer)
            socket.on('broadcasticecandidate',SetRemoteICECandidate)

        }).catch((e)=>{
            console.log(e)
        })

}



