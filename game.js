const {v4: uuidv4} = require('uuid');

module.exports = function(server) {
    const io = require('socket.io')(server, {
        transports: ['websocket']
    });

    var rooms = [];
    var socketRooms = new Map();

    io.on('connection', (socket) => {
        console.log('A user connected', socket.id);

        if(rooms.length > 0) {
            var roomId = rooms.shift();
            socket.join(roomId);
            socket.emit('joinRoom', {roomId: roomId});
            socket.to(roomId).emit('startGame', {roomId: roomId});
            socketRooms.set(socket.id, roomId);
        }
        else{
            var roomId = uuidv4();
            socket.join(roomId);
            socket.emit('creatRoom', {roomId: roomId});
            rooms.push(roomId);
            socketRooms.set(socket.id, roomId);
        }

        socket.on('leaveRoom', function(data) {
            var roomId = data.roomId;
            socket.leave(roomId);
            socket.emit('exitRoom');
            socket.to(roomId).emit('endGame');


            const roomIndex = rooms.indexOf(roomId);
            if(roomIndex !== -1) {
                rooms.splice(roomIndex, 1);
                console.log('Room deleted', roomId);
            }

            socketRooms.delete(socket.id);
        });

        socket.on('doPlayer', function(playerInfo) {
            var roomId = playerInfo.roomId;
            var blockIndex = playerInfo.blockIndex; //변경한거 기억

            console.log('Player action in room:', roomId, 'Block index:', blockIndex);
            socket.to(roomId).emit('doOpponent', {blockIndex: blockIndex});
        });

        socket.on('disconnect', function(reason){
            console.log('Disconnected' + socket.id + 'Reason' + reason);
        });

        // socket.on("disconnect", function(reason){
        //     console.log('Disconnected' + socket.id + 'Reason' + reason);
        // }); ""로 사용을 하면 1.1.5 버전에서도 작동이 된다고 한다.
    });
};