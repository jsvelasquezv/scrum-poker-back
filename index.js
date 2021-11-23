const http = require('http');
const express = require('express');
const cors = require('cors');
const socketIO = require('socket.io');
const app = express();

const roomsModule = require('./rooms');

const server = http.createServer(app);
const io = new socketIO.Server(server, {
  cors: {
    origin: '*',
  },
});

const loggedUsers = new Map();

app.use(express.json());
app.use(
  cors({
    origin: '*',
  })
);

app.post('/rooms', async (req, res) => {
  const { roomName, masterUser } = req.body;
  const response = await roomsModule.create({ roomName, masterUser });
  return res.send(response);
});

app.get('/', async (_req, res) => {
  // const response = await roomsModule.discover('1234');
  const response = await roomsModule.reset('1234');
  return res.send(response);
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});

io.on('connection', socket => {
  socket.on('join', async (roomId, user) => {
    const room = await roomsModule.get(roomId);
    if (!room) {
      socket.emit('error', roomId, { message: 'Room does not exists' });
    } else {
      socket.join(roomId);
      // TODO: Refactor this
      let roomLoggedUsers = loggedUsers.get(roomId);
      if (roomLoggedUsers) {
        roomLoggedUsers.set(user.userId, user);
        loggedUsers.set(roomId, roomLoggedUsers);
      } else {
        roomLoggedUsers = new Map();
        roomLoggedUsers.set(user.userId, user);
        loggedUsers.set(roomId, roomLoggedUsers);
      }

      io.to(roomId).emit('room-joined', {
        message: 'Connected',
        room: { ...JSON.parse(room), roomId },
        roomLoggedUsers: [...roomLoggedUsers.values()],
      });
    }
  });

  socket.on('leave', async (roomId, userId) => {
    socket.leave(roomId);
    let roomLoggedUsers = loggedUsers.get(roomId);
    roomLoggedUsers.delete(userId);
    loggedUsers.set(roomId, roomLoggedUsers);
  });

  socket.on('vote', async (roomId, { userId, value }) => {
    const votes = await roomsModule.vote(roomId, { userId, value });

    io.to(roomId).emit('vote-counted', votes);
  });

  socket.on('reveal', async roomId => {
    const result = await roomsModule.discover(roomId);
        
    socket.emit('reveal-result', roomId, result);
  });

  socket.on('reset', async roomId => {
    await roomsModule.reset(roomId);

    socket.emit('clear', roomId);
  });

  socket.on('disconnect', () => {
    socket.leave(roomId);
    let roomLoggedUsers = loggedUsers.get(roomId);
    roomLoggedUsers.delete(userId);
    loggedUsers.set(roomId, roomLoggedUsers);
    console.log('user disconnected');
  });
});
