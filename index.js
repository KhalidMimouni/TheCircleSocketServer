const express = require('express');
const app = express();
const httpserver = require('http').createServer(app)
const io = require('socket.io')(httpserver, { cors: { origin: '*' } })
const port = process.env.PORT || 3000

var hosts = []

io.on('connection', socket => {
    
    socket.on('host-join', (roomId) => {
        console.log('host joined room')
        
        var host = {socketId: socket.id, roomId: roomId}
        hosts.push(host)
        socket.on('disconnect', () => {
            console.log('host disconnected from room')
            hosts.splice(host, 1)
        })
    })
    socket.on('guest-join', (roomId) => {
        console.log('guest joined room')
        socket.join(roomId)
        var host = hosts.find(host => host.roomId == roomId)
        
        if(host){
            io.to(socket.id).emit('host-id', host.socketId)
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

httpserver.listen(port, () => console.log(`signalling server is listening on port ${port}`))