const { createServer } = require('http');
var cors = require('cors');
var socketPort = normalizePort(process.env.SOCKET_PORT || '5000');

function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

//beginning of socket.io===============
const httpServer = createServer();
httpServer.listen(socketPort);

const io = require('socket.io')(httpServer, {
    cors: {
        // white lists
        origin: [
            'http://localhost:3000',
            'https://localhost:3000',
            'http://localhost:3001',
            'https://localhost:3001',
            'https://samgliu.github.io',
            'http://samgliu.github.io',
        ],
        methods: 'GET, POST, OPTIONS',
        allowedHeaders: 'Content-Type, Accept, X-Access-Token, X-Refresh-Token',
        //credentials: true,
    },
});

let users = [];

const addUser = (userId, socketId) => {
    !users.some((user) => {
        if (user.userId === userId) {
            // fixing when freshed page which changes the socketId
            user.socketId = socketId;
            return true;
        }
    }) && users.push({ userId, socketId });
    console.log(users);
};

const removeUser = (socketId) => {
    users = users.filter((user) => users.socketId !== socketId);
    console.log(users);
};

const getUser = async (userId) => {
    theUser = users.find((user) => user.userId === userId);
    return theUser;
};

io.on('connection', (socket) => {
    console.log('A user connected with ID: ' + socket.id);
    // connect userId and socketId
    console.log(' %s sockets connected', io.engine.clientsCount);
    socket.on('addUser', (userId) => {
        addUser(userId, socket.id);
        io.emit('getUsers', users);
    });

    // send and get message
    socket.on('sendMessage', ({ senderId, receiverId, text }) => {
        console.log(socket.id);
        const user = getUser(receiverId).then((theUser) => {
            console.log('users');
            console.log(users);
            console.log('user');
            console.log(theUser);
            console.log({ senderId, receiverId, text });
            //console.log(theUser.socketId);

            if (theUser && theUser.socketId) {
                console.log(theUser.socketId);
                socket.broadcast.to(theUser.socketId).emit('getMessage', {
                    receiverId: receiverId,
                    senderId: senderId,
                    text: text,
                });
            }

            /*
            if (theUser.socketId) {
                io.to(theUser.socketId).emit('getMessage', {
                    senderId,
                    text,
                });
            }
            */

            //group emit
            /*
            io.emit('getMessage', {
                receiverId: receiverId,
                senderId: senderId,
                text: senderId,
            });*/
        });
    });

    // disconnect
    socket.on('disconnet', () => {
        console.log('A user disconnected');
        removeUser(socket.id);
        io.emit('getUsers', users);
    });
});
//end of socket.io===============
