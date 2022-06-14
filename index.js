const express = require('express');
const app = express();
const httpserver = require('http').createServer(app)
const io = require('socket.io')(httpserver, { cors: { origin: '*' } })
const port = process.env.PORT || 3000
const fs = require('fs');

var hosts = []

io.on('connection', socket => {

    socket.on('host-streaming', package => {
        console.log('host is begonnen met streamen')
        console.log(package.stream)

        fs.appendFile('hellocircle.webm', package.stream, err => {
            if (err) {
              console.error(err);
            }
            // file written successfully
          });

        socket.to(package.roomId).emit('stream', package.stream)
    })

    socket.on('viewer-join', (roomId) => {
        console.log('kijker heeft zich aangemeld')
        socket.join(roomId)
    })

    

    socket.on('host-join', (roomId) => {
        console.log('host joined room')

        var host = { socketId: socket.id, roomId: roomId }
        hosts.push(host)
        socket.to(roomId).emit('host-id', socket.id)
        socket.on('disconnect', () => {
            console.log('host disconnected from room')
            deleteHostFromArray(host)
            socket.to(roomId).emit('no-host-found')
        })
    })
    socket.on('guest-join', (roomId) => {
        console.log('guest joined room')
        socket.join(roomId)
        const host = hosts.find(host => host.roomId == roomId)

        if (host) {
            io.to(socket.id).emit('host-id', host.socketId)
        }
        else {
            io.to(socket.id).emit('no-host-found')
        }

    })
    socket.on('kickguests', (roomId) => {
        io.to(roomId).emit('leave', roomId)
    })
    socket.on('leave', roomId => {
        socket.leave(roomId)
    })

    socket.on('message-to-host', (userId, message) => {
        console.log(userId)
        console.log(message)

        io.to(userId).emit('message-from-guest', message)
    })
    socket.on('message-to-guest', (userId, message) => {
        io.to(userId).emit('message-from-host', message)
    })

})

function deleteHostFromArray(host) {
    const indexOfHostInArray = hosts.indexOf(host)
    hosts.splice(indexOfHostInArray, 1)
}
httpserver.listen(port, () => console.log(`signalling server is listening on port ${port}`))