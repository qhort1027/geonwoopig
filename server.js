const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server); // Socket.IO를 HTTP 서버에 연결

const PORT = process.env.PORT || 3000;

// public 폴더를 정적 파일로 서빙 (HTML, CSS 등)
app.use(express.static('public'));

let players = {}; // 접속한 플레이어들의 정보를 저장할 객체

io.on('connection', (socket) => {
    console.log('새로운 플레이어가 접속했습니다:', socket.id);

    // 새 플레이어 접속 시 초기 정보 전송 (예: 랜덤 위치)
    players[socket.id] = {
        x: Math.floor(Math.random() * 800),
        y: Math.floor(Math.random() * 600),
        color: getRandomColor()
    };
    // 모든 클라이언트에게 새로운 플레이어 정보와 현재 모든 플레이어 정보 전송
    socket.emit('currentPlayers', players); // 새로 접속한 플레이어에게 기존 플레이어 정보 전송
    socket.broadcast.emit('newPlayer', players[socket.id]); // 기존 플레이어들에게 새 플레이어 정보 전송


    // 클라이언트로부터 플레이어 이동 이벤트 수신
    socket.on('playerMovement', (movementData) => {
        // 실제 게임에서는 충돌 감지, 유효성 검사 등 복잡한 로직이 추가됩니다.
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            // 모든 클라이언트에게 변경된 플레이어 위치 정보 전송
            io.emit('playerMoved', { playerId: socket.id, x: movementData.x, y: movementData.y });
        }
    });

    // 클라이언트로부터 채팅 메시지 수신
    socket.on('chatMessage', (msg) => {
        console.log('메시지: ' + msg);
        io.emit('chatMessage', { sender: socket.id, message: msg }); // 모든 클라이언트에게 메시지 전송
    });

    // 플레이어 접속 해제 시
    socket.on('disconnect', () => {
        console.log('플레이어가 접속을 해제했습니다:', socket.id);
        delete players[socket.id]; // 플레이어 정보 삭제
        io.emit('playerDisconnected', socket.id); // 모든 클라이언트에게 해당 플레이어 접속 해제 알림
    });
});

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

server.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});