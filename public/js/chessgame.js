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

renderBoard();
