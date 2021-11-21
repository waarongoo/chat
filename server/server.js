const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
app.use(express.static("client"));

const socket = require("socket.io");
const io = socket(server);
const botName = "DanaBot";

module.exports = { io, botName };

const { users, removeUser, getUserById, getUserByName, regExp } = require("./users.js");
const { checkValidName } = require("./name.js");
const { getRandomColor } = require("./color.js");
const { currentTopic, setTopic } = require("./topic.js");
require("./spam.js");

io.on("connection", (socket) => {
    io.emit("userNumber", users.length);
    socket.on("loginAttempt", (name) => {
        if (checkValidName(name, socket, users)) {
            addUser(socket, name);
        }
    });
    socket.on("clientMessage", (text) => sendMessage(socket, text));
    socket.on("topic", (topic) => setTopic(socket, topic));
    socket.on("disconnect", () => removeSocket(socket));
});

function addUser(socket, name) {
    socket.join("users");
    socket.emit("login");
    io.to("users").emit("serverMessage", {
        name: botName,
        text: `${name} has entered the room!`,
        color: "white",
        style: "italic",
    });
    for (const otherUser of users) {
        socket.emit("user", otherUser);
    }
    const user = { id: socket.id, name: name, color: getRandomColor() };
    users.push(user);
    io.emit("userNumber", users.length);
    io.to("users").emit("user", user);
    socket.emit("topic", currentTopic);
}

function removeSocket(socket) {
    const user = getUserById(socket.id);
    if (!user) return;
    io.to("users").emit("serverMessage", {
        name: botName,
        text: `${user.name} has left the room!`,
        color: "white",
        style: "italic",
    });
    socket.leave("users");
    removeUser(user);
    io.emit("userNumber", users.length);
    io.to("users").emit("removeUser", user);
}

function sendMessage(socket, text) {
    if (text.length === 0) return;
    if (text.length > 280) {
        socket.emit("serverMessage", {
            name: botName,
            text: `You have to restrict your message to 280 characters!`,
            color: "white",
            style: "italic",
        });
        return;
    }
    const user = getUserById(socket.id);
    if (!user) return;
    let recipients, sender;
    const matches = text.match(regExp());
    if (matches) {
        recipients = [socket.id];
        sender = `${user.name} (PM)`;
        for (const match of matches) {
            const privateName = match.substring(2, match.length - 1);
            const privateUser = getUserByName(privateName);
            if (privateUser && privateUser.id !== socket.id) {
                recipients.push(privateUser.id);
            }
        }
    } else {
        recipients = ["users"];
        sender = user.name;
    }
    for (const recipient of recipients) {
        io.to(recipient).emit("serverMessage", {
            name: sender,
            text: text,
            color: user.color,
            style: "normal",
        });
    }
}
