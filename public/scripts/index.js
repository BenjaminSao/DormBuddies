let isAlreadyCalling = false;
let getCalled = false;

const existingCalls = [];

const { RTCPeerConnection, RTCSessionDescription } = window;

const peerConnection = new RTCPeerConnection({
    iceServers: [
        {
            urls: "stun:stun.stunprotocol.org"
        },
        {
            urls: 'turn:numb.viagenie.ca',
            credential: 'muazkh',
            username: 'webrtc@live.com'
        },
    ]}
    );

function unselectUsersFromList() {
  const alreadySelectedUser = document.querySelectorAll(
    ".active-user.active-user--selected"
  );

  alreadySelectedUser.forEach(el => {
    el.setAttribute("class", "active-user");
  });
}

function createUserItemContainer(socketId) {
  const userContainerEl = document.createElement("div");

  const usernameEl = document.createElement("p");

  userContainerEl.setAttribute("class", "active-user");
  userContainerEl.setAttribute("id", socketId);
  usernameEl.setAttribute("class", "username");
  usernameEl.innerHTML = `Socket: ${socketId}`;

  userContainerEl.appendChild(usernameEl);

  userContainerEl.addEventListener("click", () => {
    unselectUsersFromList();
    userContainerEl.setAttribute("class", "active-user active-user--selected");
    const talkingWithInfo = document.getElementById("talking-with-info");
    talkingWithInfo.innerHTML = `Talking with: "Socket: ${socketId}"`;
    callUser(socketId);
  });

  return userContainerEl;
}

async function callUser(socketId) {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(new RTCSessionDescription(offer));

  socket.emit("call-user", {
    offer,
    to: socketId
  });
}

function updateUserList(socketIds) {
  const activeUserContainer = document.getElementById("active-user-container");

  socketIds.forEach(socketId => {
    const alreadyExistingUser = document.getElementById(socketId);
    if (!alreadyExistingUser) {
      const userContainerEl = createUserItemContainer(socketId);

      activeUserContainer.appendChild(userContainerEl);
    }
  });
}

const socket = io.connect();

socket.on("update-user-list", ({ users }) => {
  updateUserList(users);
});

socket.on("remove-user", ({ socketId }) => {
  const elToRemove = document.getElementById(socketId);

  if (elToRemove) {
    elToRemove.remove();
  }
});

socket.on("call-made", async data => {
  if (getCalled) {
    const confirmed = confirm(
      `User "Socket: ${data.socket}" wants to call you. Do accept this call?`
    );

    if (!confirmed) {
      socket.emit("reject-call", {
        from: data.socket
      });

      return;
    }
  }

  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(data.offer)
  );
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

  socket.emit("make-answer", {
    answer,
    to: data.socket
  });
  getCalled = true;
});

socket.on("answer-made", async data => {
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(data.answer)
  );

  if (!isAlreadyCalling) {
    callUser(data.socket);
    isAlreadyCalling = true;
  }
});

socket.on("call-rejected", data => {
  alert(`User: "Socket: ${data.socket}" rejected your call.`);
  unselectUsersFromList();
});

peerConnection.ontrack = function({ streams: [stream] }) {
  const remoteVideo = document.getElementById("remote-video");
  if (remoteVideo) {
    remoteVideo.srcObject = stream;
  }
};

navigator.getUserMedia(
  { video: true, audio: true },
  stream => {
    const localVideo = document.getElementById("local-video");
    if (localVideo) {
      localVideo.srcObject = stream;
    }

    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
  },
  error => {
    console.warn(error.message);
  }
);

// player + chat stuff
var chatText = document.getElementById('chat-text');
       var chatInput = document.getElementById('chat-input');
       var chatForm = document.getElementById('chat-form');
       var ctx = document.getElementById("ctx").getContext("2d");
       ctx.font = '30px Arial';
       // var background = getElementById("room");
       // ctx.drawImage(background,0,0);

       var socket = io();



       chatForm.onsubmit = function(e){
           e.preventDefault();
           if(chatInput.value[0] === '/')
               socket.emit('evalServer',chatInput.value.slice(1));
           else
               socket.emit('sendMsgToServer',chatInput.value);
           chatInput.value = '';
       }

       document.onkeydown = function(event){
           if(event.keyCode === 68)	//d
               socket.emit('keyPress',{inputId:'right',state:true});
           else if(event.keyCode === 83)	//s
               socket.emit('keyPress',{inputId:'down',state:true});
           else if(event.keyCode === 65) //a
               socket.emit('keyPress',{inputId:'left',state:true});
           else if(event.keyCode === 87) // w
               socket.emit('keyPress',{inputId:'up',state:true});

       }
       document.onkeyup = function(event){
           if(event.keyCode === 68)	//d
               socket.emit('keyPress',{inputId:'right',state:false});
           else if(event.keyCode === 83)	//s
               socket.emit('keyPress',{inputId:'down',state:false});
           else if(event.keyCode === 65) //a
               socket.emit('keyPress',{inputId:'left',state:false});
           else if(event.keyCode === 87) // w
               socket.emit('keyPress',{inputId:'up',state:false});
       }
       
socket.on('newPositions',function(data){
  ctx.clearRect(0,0,500,500);
  for(var i = 0 ; i < data.player.length; i++){
      ctx.fillText("A",data.player[i].x,data.player[i].y);
  }

});

socket.on('addToChat',function(data){
  chatText.innerHTML += '<div>' + data + '</div>';
});
socket.on('evalAnswer',function(data){
  console.log(data);
});


