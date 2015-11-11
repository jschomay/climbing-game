var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');

var wall = [];
var hand = {};

function shuffle(o){
  for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
}

var letters = [ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

var shuffledGripNames = shuffle(letters);


function bindKeys(){
  document.addEventListener('keydown', chooseGrip);
  document.addEventListener('keyup', releaseGrip);
}

function addGrip(name, x, y) {
  wall.push({name: name, x: x, y:y});
  drawGrip(name, x, y);
}

function drawGrip(name, x, y) {
  ctx.font = "24px black";
  ctx.fillText(name.toUpperCase(), x, y);
}


function buildWall() {
  var x = 70;
  var y = 30;
  var i = 0;
  while (y < canvas.height) {
    x = 70;
    while (x < canvas.width) {
      addGrip(shuffledGripNames[i], x, y);
      x += 100;
      i += 1;
      if (i >= shuffledGripNames.length) {
        i = 0;
      }
    }
    y += 200;
  }
}

function drawHand(hand) {
  if (hand.grip) {
    // ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.arc(hand.x,hand.y,30,0,Math.PI*2,true);
    ctx.stroke();
    // ctx.closePath();
  }
}


function grab(hand, grip) {
  hand.grip = 1;
  hand.x = grip.x;
  hand.y = grip.y;
  drawHand(hand);
}

function release(hand) {
  hand.grip = 0;
  drawHand(hand);
}

function chooseGrip(e) {
  var chosenGripLetter = String.fromCharCode(e.keyCode).toLowerCase();

  var gripIndex = wall.map(function(w) { return w.name; }).indexOf(chosenGripLetter);
  if ( gripIndex !== -1 ) {
    grab(hand, wall[gripIndex]);
  }
}

function releaseGrip(e) {
  release(hand);
}

function main() {
  buildWall();
  grab(hand, wall[wall.length - 3]);
  bindKeys();
}


main();
