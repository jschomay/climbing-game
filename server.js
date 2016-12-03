var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var buildWall = require('./buildwall');

app.set('port', (process.env.PORT || 3000));

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

  socket.on('updatePlayer', (raceId, event, eventData) => {
    socket.broadcast.to(raceId.toUpperCase()).emit('updatePlayer', event, eventData);
  });

  socket.on('lose', (raceId) => {
    socket.broadcast.to(raceId.toUpperCase()).emit('win');
  });

  socket.on('win', (raceId) => {
    socket.broadcast.to(raceId.toUpperCase()).emit('lose');
  });

  socket.on('raceAgain', (raceId) => {
    io.to(raceId.toUpperCase()).emit('restartRace', buildWall());
  });
});

http.listen(app.get('port'), function(){
  console.log('listening on port ' + app.get('port'))
});

function generateRaceId() {
  return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 4).toUpperCase();
}

