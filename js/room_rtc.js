const App_id="412b55b227e84983b71c7b9e96854abf"

let uid = sessionStorage.getItem('uid')
if(!uid){
    uid = String(Math.floor(Math.random()*10000))
    sessionStorage.setItem('uid',uid)
}

let token = null;
let client;

const query = window.location.search
const urlParams = new URLSearchParams(query)
let roomId = urlParams.get('room')

if(!roomId){
    roomId='lobby.html'
}

let localTracks=[]
let remoteUser ={}

let localScreenTracks;
let screenSharing = false;

let joinRoomInit = async()=>{
    client = AgoraRTC.createClient({mode:'rtc', codec:'vp8'})
    await client.join(App_id,roomId,token,uid)

    client.on('user-published',handleUserPublished)
    client.on('user-left',handleUserLeft)

    joinStream()
}

let joinStream = async()=>{
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks({}, {encoderConfig:{
        width:{min:640, ideal:1920, max:1920},
        height:{min:480, ideal:1080, max:1080}
    }})

    let player = `  <div class="video_container" id="user_container-${uid}">
                        <div class ="video-player" id="user-${uid}"></div>
                    </div>`

    document.getElementById('user_containers').insertAdjacentHTML('beforeend',player)
    document.getElementById(`user_container-${uid}`).addEventListener('click', expandVideoFrame)

    localTracks[1].play(`user-${uid}`)

    await client.publish([localTracks[0], localTracks[1]])
}

let handleUserPublished = async(user,mediaType)=>{
    remoteUser[user.uid] = user

    await client.subscribe(user, mediaType)

    let player = document.getElementById(`user_container-${user.uid}`)
    if(player===null){
        player = `  <div class="video_container" id="user_container-${user.uid}">
                        <div class ="video-player" id="user-${user.uid}"></div>
                    </div>` 

        document.getElementById('user_containers').insertAdjacentHTML('beforeend',player)
        document.getElementById(`user_container-${user.uid}`).addEventListener('click', expandVideoFrame)

    }

    if(displayFrame.style.display){
        let videoFrames = document.getElementById(`user_container-${user.uid}`)
        videoFrames.style.height = '100px'
        videoFrames.style.width = '100px'
    }

    if(mediaType==='video'){
        user.videoTrack.play(`user-${user.uid}`)
    }

    if(mediaType==='audio'){
        user.audioTrack.play()
    }
}

let handleUserLeft = async(user) =>{
    delete remoteUser[user.uid]
    document.getElementById(`user_container-${user.uid}`).remove()

    if(userIdInDisplay === `user_container-${user.uid}`){
        displayFrame.style.display = null

        let videoFrames = document.getElementsByClassName('video_container')

        for(let i=0; videoFrames.length > i; i++){
            videoFrames[i].style.height = '200px'
            videoFrames[i].style.width = '200px'
        }
    }
}


let toggleMic = async (e)=>{
    let button = e.currentTarget

    if(localTracks[0].muted){
        await localTracks[0].setMuted(false)
        button.classList.add('active')
    }
    else{
        await localTracks[0].setMuted(true)
        button.classList.remove('active')
    }
}


let toggleCamera = async (e)=>{
    let button = e.currentTarget

    if(localTracks[1].muted){
        await localTracks[1].setMuted(false)
        button.classList.add('active')
    }
    else{
        await localTracks[1].setMuted(true)
        button.classList.remove('active')
    }
}



let toggleScreen = async (e)=>{
    let button = e.currentTarget
    
    if(!screenSharing){
        screenSharing = true
        button.classList.add('active')

        localScreenTracks = await AgoraRTC.createScreenVideoTrack()

        if(displayFrame.style.display){
            hideDisplayFrame()
        }

        displayFrame.style.display = 'block'

        let player = `  <div class="video_container" id="user_container-${uid+1}">
                                <div class ="video-player" id="user-${uid+1}"></div>
                        </div>` 

        displayFrame.insertAdjacentHTML('beforeend',player)
        document.getElementById(`user_container-${uid+1}`).addEventListener('click', expandVideoFrame)

        userIdInDisplay = `user_container-${uid+1}`
        localScreenTracks.play(`user-${uid+1}`)

        await client.unpublish([localTracks[1]])
        await client.publish([localScreenTracks])

        let videoFrames = document.getElementsByClassName('video_container')

        for(let i=0; videoFrames.length > i; i++){
            videoFrames[i].style.height = '100px'
            videoFrames[i].style.width = '100px'
        }
    }
    else{
        screenSharing = false
        document.getElementById(`user_container-${uid+1}`).remove()

        if(userIdInDisplay === `user_container-${uid+1}`){
            displayFrame.style.display = null

            let videoFrames = document.getElementsByClassName('video_container')

            for(let i=0; videoFrames.length > i; i++){
                videoFrames[i].style.height = '200px'
                videoFrames[i].style.width = '200px'
            }
        }

        button.classList.remove('active')

    }
}

document.getElementById('mic-btn').addEventListener('click',toggleMic)
document.getElementById('camera-btn').addEventListener('click',toggleCamera)
document.getElementById('screen-btn').addEventListener('click',toggleScreen)

joinRoomInit()