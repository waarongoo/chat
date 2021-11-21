const { io, botName } = require("./server.js");
const { getUserById } = require("./users.js");

const SocketAntiSpam = require("socket-io-anti-spam");

const socketAntiSpam = new SocketAntiSpam({
    banTime: 1,
    kickThreshold: 5,
    kickTimesBeforeBan: 1,
    banning: true,
    io: io,
});

socketAntiSpam.event.on("kick", (socket, data) => {
    io.to("users").emit("serverMessage", {
        name: botName,
        text: `${getUserById(socket.id).name} has triggered the anti-spam. They will be banned for 1 minute. `,
        color: "white",
        style: "italic",
    });
    io.to("users").emit("serverMessage", {
        name: botName,
        text: `${getUserById(socket.id).name} has has been banned by DanaBot `,
        color: "white",
        style: "italic",
    });
    socket.emit("kick");
});
