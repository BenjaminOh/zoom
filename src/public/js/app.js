const socket = io();

const welcome = document.getElementById('welcome');
const form = welcome.querySelector('form');
const room = document.getElementById('room');

// room hidden 처리
room.hidden = true;


let roomName;


function addMessage(message){
	const ul = room.querySelector("ul");
	const li = document.createElement("li");
	li.innerText = message;
	ul.appendChild(li);
}

function handleMessageSubmit(event){
	event.preventDefault();
	const input = room.querySelector('#msg input');
	const value = input.value;
	socket.emit("new_message",  value, roomName, () => {
		addMessage(`You: ${value}`);
	});
	input.value = "";
}

function showRoom() {
	welcome.hidden = true;
	room.hidden = false;
	const h3 = room.querySelector('h3');
	h3.innerText = `Room ${roomName}`;
	const msgForm = room.querySelector('#msg');
	msgForm.addEventListener("submit", handleMessageSubmit);
}

function handleRoomSubmit(event){
	event.preventDefault();
	const inputRoom = form.querySelector('input[name=room_name]');
	const inputNickName = form.querySelector('input[name=nick_name]');
	socket.emit("enter_room",  inputRoom.value,  inputNickName.value, showRoom);
	roomName = inputRoom.value;
	inputRoom.value = "";
}

form.addEventListener('submit', handleRoomSubmit);


socket.on("welcome", (msg) => {
	console.log(msg);
	addMessage(`${msg}`);
});

socket.on("bye", (msg) => {
	addMessage("someone left!");
});

socket.on("new_message", (msg) => {
	addMessage(msg);
});

socket.on("name_message", (msg) => {
	addMessage(msg);
});

