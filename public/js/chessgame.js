const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
	const board = chess.board();
	boardElement.innerHTML = "";
	board.forEach((row, rowindex) => {
		row.forEach((square, squareindex) => {
			const squareElement = document.createElement("div");
			squareElement.classList.add(
				"square",
				(rowindex + squareindex) % 2 === 0 ? "light" : "dark"
			);
			squareElement.dataset.row = rowindex;
			squareElement.dataset.col = squareindex;
			if (square) {
				const pieceElemet = document.createElement("div");
				pieceElemet.classList.add(
					"piece",
					square.color === "w" ? "white" : "black"
				);
				pieceElemet.innerText = getPieceUnicode(square);
				pieceElemet.draggable = playerRole === square.color;
				// ??? doubt hai idhar
				pieceElemet.addEventListener("dragstart", (e) => {
					if (pieceElemet.draggable) {
						draggedPiece = pieceElemet;
						sourceSquare = { row: rowindex, col: squareindex };
						e.dataTransfer.setData("text/plain", ""); //iissh line k wajah se drag krne asani se hoga, yeh ek nessciaty hai
					}
				});
				pieceElemet.addEventListener("dragend", (e) => {
					draggedPiece = null;
					sourceSquare = null;
				});
				squareElement.append(pieceElemet); // yeh squares pe goti sab attach kr deta h
			}

			squareElement.addEventListener("dragover", (e) => {
				e.preventDefault();
			});

			squareElement.addEventListener("drop", function (e) {
				e.preventDefault();
				if (draggedPiece) {
					targerSource = {
						row: parseInt(squareElement.dataset.row),
						col: parseInt(squareElement.dataset.col),
					};
					handleMove(sourceSquare, targerSource);
				}
			});
			boardElement.appendChild(squareElement);
		});
	});
	if (playerRole === "b") {
		boardElement.classList.add("flipped");
	} else {
		boardElement.classList.remove("flipped");
	}
};

const handleMove = (source, target) => {
	const moveSound = new Audio("/audios/move.mp3");
	moveSound.play();
	const move = {
		from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
		to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
		promotion: "q",
		//tora samjhna h yeh
	};
	socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
	const unicodePieces = {
		p: "♟",
		r: "♜",
		n: "♞",
		b: "♝",
		q: "♛",
		k: "♚",
		P: "♙",
		R: "♖",
		N: "♘",
		B: "♗",
		Q: "♕",
		K: "♔",
	};
	return unicodePieces[piece.type] || "";
};

// Optionally, you could still handle the valid move sound on the client

socket.on("playerRole", function (role) {
	playerRole = role;
	renderBoard();
});
socket.on("spectatorRole", function () {
	playerRole = null;
	renderBoard();
});
socket.on("boardState", function (fen) {
	chess.load(fen);
	renderBoard();
});
socket.on("move", function (move) {
	chess.move(move);
	renderBoard();
});
// Ensure no double playing by using a flag or preventing quick replays
let isPlayingMoveSound = false;
let isPlayingInvalidMoveSound = false;
let isPlayingGameEndSound = false;
let isPlayingCheckSound = false;
let isPlayingCaptureSound = false;

socket.on("move", (move) => {
	setTimeout(() => {
		if (!isPlayingMoveSound && !isPlayingCheckSound) {
			console.log("" + isPlayingCheckSound + isPlayingMoveSound);
			const moveSound = new Audio("/audios/move-self.mp3");
			moveSound.currentTime = 0;
			moveSound.play();
			console.log("Move sound played!!");
			isPlayingMoveSound = true;

			moveSound.onended = () => {
				isPlayingMoveSound = false;
				console.log("Move sound ended"); // Reset flag when sound finishes
			};
		}
	}, 100); // Delay of 100ms to check for inCheck event
});

socket.on("invalidMove", (move) => {
	if (!isPlayingInvalidMoveSound) {
		const invalidMoveSound = new Audio("/audios/illegal-move.mp3");
		invalidMoveSound.currentTime = 0;
		invalidMoveSound.play();
		console.log("Invalid move!!")
		isPlayingInvalidMoveSound = true;

		invalidMoveSound.onended = () => {
			isPlayingInvalidMoveSound = false; // Reset flag when sound finishes
		};
	}
});

socket.on("isCheckMate", function (isCheckMate) {
	if (
		isCheckMate &&
		!isPlayingGameEndSound &&
		!isPlayingCheckSound &&
		!isPlayingMoveSound
	) {
		console.log("Check Mate ho gya Bhai!!!");
		const gameEndSound = new Audio("/audios/game-end.mp3");
		gameEndSound.currentTime = 0;
		gameEndSound.play();
		console.log("Checkmate sound played!!")
		isPlayingGameEndSound = true;

		gameEndSound.onended = () => {
			isPlayingGameEndSound = false; // Reset flag when sound finishes
		};
	}
	renderBoard();
});

socket.on("inCheck", function (isInCheck) {
	if (isInCheck && !isPlayingCheckSound && !isPlayingMoveSound) {
		console.log("Check Hai Bhai!!");
		const checkSound = new Audio("/audios/move-check.mp3");
		checkSound.currentTime = 0;
		checkSound.play();
		console.log("Check sound played!!");

		isPlayingCheckSound = true;

		checkSound.onended = (event) => {
			isPlayingCheckSound = false;
			console.log("Not a check sound"); // Reset flag when sound finishes
		};
	}
	renderBoard();
});
socket.on("capture", function () {
	if (!isPlayingCaptureSound && !isPlayingMoveSound) {
		const captureSound = new Audio("/audios/capture.mp3");
		captureSound.currentTime = 0;
		captureSound.play();
		console.log("Capture sound played!!");
		isPlayingCaptureSound = true;

		captureSound.onended = () => {
			isPlayingCaptureSound = false;
			console.log("Capture sound stopped!!");
		};
	}
});

socket.on("history", function (history) {
	if (history && Array.isArray(history)) {
		// console.log(history);
		renderBoard();

		const historyList = document.getElementById("history-list");
		historyList.innerHTML = "";

		history.forEach((move, index) => {
			// console.log(`Move ${index + 1} data:`, move);

			const listItem = document.createElement("li");

			// If move is a string, handle it accordingly
			if (typeof move === "string") {
				listItem.textContent = `Move ${index + 1}: ${move}`;
			} else {
				listItem.textContent = `Move ${index + 1}: Invalid move data`;
			}
			historyList.appendChild(listItem);
		});
	} else {
		console.error("Invalid history data received");
	}
});

renderBoard();
