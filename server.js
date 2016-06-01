var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var buildWall = require('./buildwall');


app.use(express.static('./'));

app.get('/', function(req, res){
  res.send('<h1>Hello world</h1>');
});


io.on('connection', function(socket){

  socket.on('initiateRace', () => {
    var raceId = generateRaceId();
    console.log('request to initiate game', raceId);

    socket.emit('raceCreated', raceId);
    socket.join(raceId);

    socket.on('disconnect', function(){
      io.to(raceId).emit('raceLeft');
    });
  });

  socket.on('joinRace', (raceId) => {
    console.log('request to join race', raceId);

    if(Object.keys(io.sockets.adapter.rooms).indexOf(raceId) > 0) {
      socket.on('disconnect', function(){
        io.to(raceId).emit('raceLeft');
      });

      socket.join(raceId);
      io.to(raceId).emit('startRace', buildWall());

    } else {
      console.log('race not found', raceId);
      socket.emit('joinRaceError', raceId);
    }
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

function generateRaceId() {
  return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 4).toUpperCase();
}

