import http from "http";
import SocketIO from "socket.io";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views/");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

wsServer.on("connection", socket => {
	socket["nickname"] = "";

	socket.on("enter_room", (roomName, nickName, done) => {
		socket.join(roomName);
		socket["nickname"] = nickName;
		done();
		socket.to(roomName).emit("welcome", `${socket['nickname']}: joined!`);
	});
	
	socket.on("disconnecting", () => {
		socket.rooms.forEach(room => socket.to(room).emit(`${socket["nickname"]} left`));
	});

	socket.on("new_message", (msg, roomName, done) => {
		console.log(msg);
		socket.to(roomName).emit("new_message", `${socket['nickname']}: ${msg}`);
		done();
	});
	// console.log(socket);
});

httpServer.listen(3000, handleListen);
