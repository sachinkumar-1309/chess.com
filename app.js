const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");
const app = express();

const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};
let currentPlayer = "w";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
	res.render("index"), { title: "Chess game" };
});

io.on("connection", function (socket) {
	console.log("A new client connected");

	if (!players.white) {
		players.white = socket.id;
		socket.emit("playerRole", "w");
		console.log("White left");
	} else if (!players.black) {
		players.black = socket.id;
		socket.emit("playerRole", "b");
		console.log("Black left");
	} else {
		socket.emit("spectatorRole");
	}

	socket.on("disconnect", function () {
		console.log("User disconnected");
		if (socket.id === players.white) delete players.white;
		else if (socket.id === players.black) delete players.black;
	});
	socket.on("move", (move) => {
		try {
			if (chess.turn() === "w" && socket.id !== players.white) return;
			if (chess.turn() === "b" && socket.id !== players.black) return;

			const result = chess.move(move);
			if (result) {
				currentPlayer = chess.turn();
				io.emit("move", move);
				io.emit("boardState", chess.fen());
				io.emit("isCheckMate", chess.isCheckmate());
				io.emit("inCheck", chess.inCheck());
				io.emit("history",chess.history())
			} else {
				console.log("Invalid move");
				socket.emit("Invaild move: ", move);
			}
		} catch (error) {
			console.log(error);
			socket.emit("Invalid move: ", move);
		}
	});
});

server.listen(3000, function () {
	console.log("listening on *:3000");
});
