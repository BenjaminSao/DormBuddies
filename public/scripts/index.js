let isAlreadyCalling = false;
let getCalled = false;

const existingCalls = [];

const names = ["Vincent", "Scott", "Ben"];

const person = names[getRndInteger(0, 3)];

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

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min) ) + min;
}

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
  usernameEl.innerHTML = `${names[getRndInteger(0, 3)]} <br> <p style="font-size:0px">${socketId}</p>`;


  userContainerEl.appendChild(usernameEl);

  userContainerEl.addEventListener("click", () => {
    unselectUsersFromList();
    userContainerEl.setAttribute("class", "active-user active-user--selected");
    const talkingWithInfo = document.getElementById("talking-with-info");
    talkingWithInfo.innerHTML = `Talking with ${names[getRndInteger(0, 3)]}`;
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
      `${names[getRndInteger(0, 3)]} wants to call you. Do you want to accept this call?`
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
  alert(`"${names[getRndInteger(0, 3)]} rejected your call.`);
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

setTimeout(function test(){
  var ifrm = document.createElement('iframe');
  ifrm.setAttribute('id', 'ifrm'); // assign an id
  ifrm.setAttribute('src', "http://localhost:2000/");
  ifrm.setAttribute('height', "100%");
  ifrm.setAttribute('width', "100%");
  ifrm.setAttribute("scrolling", "no")
  ifrm.setAttribute("frameBorder", "0")
  document.getElementById("host").appendChild(ifrm);

  var chat = document.createElement('iframe');
  chat.setAttribute('id', 'chat-frame'); // assign an id
  chat.setAttribute('src', "http://localhost:2000/");
  chat.setAttribute('height', "200%");
  chat.setAttribute('width', "100%");
  chat.setAttribute("scrolling", "no")
  chat.setAttribute("frameBorder", "0")
  chat.setAttribute("style", "margin-top: -1150px;")
  document.getElementById("chat-host").appendChild(chat);
}, 1000);
