"use strict";

require("dotenv").config();
const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { v4: uuidv4 } = require("uuid");
const PORT = process.env.PORT || 5547;

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
    res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
    socket.on("join-room", (roomId, userId) => {
        socket.join(roomId);
        socket.to(roomId);
        socket.broadcast.emit("user-connected", userId);
        socket.broadcast.emit("share-connected", userId);
        socket.on("disconnect", () => {
            socket.to(userId);
            socket.broadcast.emit("user-disconnected", userId);
        });
    });
});

server.listen(PORT, () => {
    console.log(`i'm listen for the PORT ${PORT} 👨‍💻`);
});