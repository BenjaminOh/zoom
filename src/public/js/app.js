const socket = io();
const call = document.getElementById("call");
const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camersSelect = document.getElementById("cameras");

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;


async function getCameras() {
	try{
		const devices = await navigator.mediaDevices.enumerateDevices();
		const cameras = devices.filter(device => device.kind === "videoinput");
		const currentCamera = myStream.getVideoTracks()[0];
		cameras.forEach(camera => {
			const option = document.createElement("option");
			option.value = camera.deviceId;
			option.innerText = camera.label;
			if(currentCamera.deviceId === camera.deviceId) {
				option.selected = true;
			}
			camersSelect.appendChild(option);
		});
	} catch(e) {
		console.log(e);
	}
}

async function getMedia(cameraId) {
	const initConstraints = {audio: true, video: true,};

	const cameraConstraints = {
		audio: true,
		video: {deviceId: {exact: cameraId}},
	}

	try {
		myStream = await navigator.mediaDevices.getUserMedia(
			cameraId ? cameraConstraints : initConstraints
		);
		myFace.srcObject = myStream;
		if(!cameraId) {
			await getCameras();
		}
	} catch(e){
		console.log(e);
	}
}

function handleMuteClick(){
	myStream
		.getAudioTracks()
		.forEach((track) => {
			track.enabled = !track.enabled
		});
	if(!muted) {
		muteBtn.innerText = "Unmute";
		muted = true;
	} else {
		muteBtn.innerText = "Mute";
		muted = false;
	}
}

function handleCameraClick(){
	myStream
		.getVideoTracks()
		.forEach((track) => {
			track.enabled = !track.enabled;
		});
	if(!cameraOff) {
		cameraBtn.innerText = "Turn Camera On";
		cameraOff = true;
	} else {
		cameraBtn.innerText = "Turn Camera Off";
		cameraOff = false;
	}
}

async function handleCameraChange() {
	await getMedia(camersSelect.value);
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camersSelect.addEventListener("input", handleCameraChange);



// welcome form 
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");


async function initCall() {
	welcome.hidden = true;
	call.hidden = false;
	await getMedia();
	makeConnect();
}

async function handleWelcomeSubmit(event) {
	event.preventDefault();
	const input = welcomeForm.querySelector("input");
	await initCall();

	socket.emit("join_room", input.value);
	roomName = input.value;
	input.value = "";
}
welcomeForm.addEventListener("submit", handleWelcomeSubmit);


socket.on("welcome", async () => {
	const offer = await myPeerConnection.createOffer();
	myPeerConnection.setLocalDescription(offer);
	console.log("sent the offer");
	socket.emit("offer", offer, roomName);
});

socket.on("offer", async (offer) => {
	console.log("received the offer");
	myPeerConnection.setRemoteDescription(offer);
	const answer =  await myPeerConnection.createAnswer();
	myPeerConnection.setLocalDescription(answer);
	console.log("sent the answer");
	socket.emit("answer", answer, roomName);
});

socket.on("answer", (answer) => {
	console.log('recevied the answer');
	myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
	console.log('recevied candidate');
	myPeerConnection.addIceCandidate(ice);
});


// RTC code

function makeConnect() {
	myPeerConnection = new RTCPeerConnection();
	myPeerConnection.addEventListener("icecandidate", handleIce);
	myPeerConnection.addEventListener("addstream", handleAddStream);
	myStream
		.getTracks()
		.forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data) {
	// console.log("data.candidate", data.candidate);
	console.log("sent candidate");
	socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data){
	const peerFace = document.getElementById("peerFace");
	peerFace.srcObject = data.stream;
}