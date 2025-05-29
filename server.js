import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';


const app = express();
const server = createServer(app);
const io = new Server(server);
const allusers = {};

const __dirname = dirname(fileURLToPath(import.meta.url));

// Serve static files from frontend directory (including assets and JS)
app.use(express.static(join(__dirname, "frontend")));

// Serve homepage at root
app.get("/", (req, res) => {
    res.sendFile(join(__dirname, "home.html"));
});

// Serve UID generator
app.get("/generate-uid", (req, res) => {
    res.sendFile(join(__dirname, "frontend", "uid_generation.html"));
});

// Serve meeting UI for any room
app.get("/room/:uid", (req, res) => {
    res.sendFile(join(__dirname, "frontend", "video_call.html"));
});

//handle socket connections
io.on("connection", (socket) => {
  console.log(`Someone connected to socket server and socket id is ${socket.id}`);
  socket.on("join-user", username => {
    console.log(`${username} joined the room`);
    allusers[username] = {username, id: socket.id};
    io.emit("user-joined", allusers);
  });

  // Relay WebRTC signaling messages to specific users
  socket.on('webrtc-offer', ({ to, offer }) => {
    io.to(to).emit('webrtc-offer', { from: socket.id, offer });
  });
  socket.on('webrtc-answer', ({ to, answer }) => {
    io.to(to).emit('webrtc-answer', { from: socket.id, answer });
  });
  socket.on('webrtc-ice-candidate', ({ to, candidate }) => {
    io.to(to).emit('webrtc-ice-candidate', { from: socket.id, candidate });
  });

  // Notify users when someone leaves
  socket.on('disconnect', () => {
    io.emit('user-left', socket.id);
    // Remove user from allusers
    Object.keys(allusers).forEach(username => {
      if (allusers[username].id === socket.id) {
        delete allusers[username];
      }
    });
    io.emit("user-joined", allusers);
  });
});

server.listen(9000, () => {
  console.log("Server is Running on port 9000");
});
