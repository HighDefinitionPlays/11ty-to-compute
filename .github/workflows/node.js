const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static("public"));

let connected = {};

io.on("connection", sock => {
  sock.on("join", username => {
    sock.username = username;
    connected[username] = sock.id;
    io.emit("contacts", Object.keys(connected));
  });

  sock.on("typing", to => {
    const sid = connected[to];
    if (sid) io.to(sid).emit("typing", sock.username);
  });

  sock.on("send", ({ to, ciphertext, nonce, ts }) => {
    const sid = connected[to];
    if (sid) {
      io.to(sid).emit("message", {
        from: sock.username,
        ciphertext,
        nonce,
        ts
      });
    }
  });

  sock.on("disconnect", () => {
    delete connected[sock.username];
    io.emit("contacts", Object.keys(connected));
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on port " + PORT));
