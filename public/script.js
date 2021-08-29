"use strict";

const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const videoShareDev = document.getElementById("video-share");

const myPeer = new Peer(undefined, {
    host: "/",
    port: "3010",
});

const peers = {};

const myVideo = document.createElement("video");
myVideo.muted = true;

const myVideoShare = document.createElement("video");
myVideoShare.muted = true;

navigator.mediaDevices
    .getUserMedia({
        video: true,
        audio: false,
    })
    .then((stream, streamShare) => {
        addVideoStream(myVideo, stream);
        shareScreen(myVideoShare);

        myPeer.on("call", (call) => {
            call.answer(stream);

            const video = document.createElement("video");

            call.on("stream", (userVideoStream) => {
                addVideoStream(video, userVideoStream);
            });
        });

        socket.on("user-connected", (userId) => {
            connectToNewUser(userId, stream);
        });
    })
    .catch((error) => {
        console.log("there is something error", error);
    });

socket.on("user-disconnected", (userId) => {
    if (peers[userId]) {
        peers[userId].close();
    }
});

myPeer.on("open", (id) => {
    socket.emit("join-room", ROOM_ID, id);
});

socket.on("user-connected", (userId) => {
    console.log("user-connected: " + userId);
});

function connectToNewUser(userId, stream) {
    const call = myPeer.call(userId, stream);

    const video = document.createElement("video");
    const videoShare = document.createElement("video");

    call.on("close", () => {
        video.remove();
    });

    peers[userId] = call;
}

function addVideoStream(video, stream) {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
        video.play();
    });
    videoGrid.append(video);
}

//-------------------  share screen  -----------------------
function shareScreen() {
    navigator.mediaDevices
        .getDisplayMedia({
            video: {
                cursor: "always",
            },
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
            },
        })
        .then((streamShare) => {
            addVideoShare(myVideoShare, streamShare);

            myPeer.on("callShare", (callShare) => {
                callShare.answer(streamShare);
            });

            socket.on("share-connected", (userId) => {
                connectToNewUser(userId, streamShare);
            });
        })
        .catch((error) => {
            console.log("there is something error", error);
        });
}

socket.on("share-disconnected", (userId) => {
    if (peers[userId]) {
        peers[userId].close();
    }
});

function addVideoShare(videoShare, streamShare) {
    videoShare.srcObject = streamShare;
    videoShare.addEventListener("loadedmetadata", () => {
        videoShare.play();
    });
    videoShareDev.append(myVideoShare);
}