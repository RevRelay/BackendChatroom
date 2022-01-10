const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
});
io.on("connection", (socket) => {
	console.log("User Connected...");

	socket.on("join_room", ({ username, room }) => {
		socket.join(room);
		console.log(`User ${username} Joined room: ${room}`);
		var messageData = {
			message: `${username} has connected`,
		};
		io.to(room).emit("user joined", messageData);
	});

	socket.on("send_message", (data) => {
		socket.to(data.room).emit("receive_message", data);
	});

	//Start activity counter to check if user is typing
	//Sends back to client if the user is currently typing or not
	socket.on("active countdown", (data) => {
		let counter = 4;
		io.to(data["room"]).emit("typing countdown", {
			user: data["user"],
			countdown: counter,
		});
		let counterCountdown = setInterval(() => {
			counter--;
			let messageData = {
				user: data["user"],
				countdown: counter,
			};
			io.to(data["room"]).emit("typing countdown", messageData);
			if (counter == 0) {
				clearInterval(counterCountdown);
			}
		}, 1000);
	});

	// Active counter stops, user is not typing
	socket.on("not active", (data) => {
		let messageData = {
			user: data["user"],
			countdown: -1,
		};
		io.to(data["room"]).emit("typing countdown", messageData);
	});
	//Send back to entire room every audio message received
	socket.on("radio", (audio, room) => {
		console.log("received audio");
		io.to(room).emit("voice", audio);
	});

	// User disconnected from the room
	socket.on("disconnect", (data) => {
		console.log("User Disconnected...");
		socket.leave(data["room"]);
		var messageData = {
			message: `${data["user"]} has disconnected`,
		};
		io.to(data["room"]).emit("user left", messageData);
	});
});
server.listen(3000, () => {
	console.log("Server Is Running");
});
