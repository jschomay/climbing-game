var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');

var wall = [];
var hands = [{side: 'left'}, {side: 'right'}];

function shuffle(o){
  for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
}

function randomBetween(min,max) {
  return Math.floor(Math.random()*(max-min+1)+min);
}

var letters = [ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

var shuffledHandHoldNames = shuffle(letters);


function bindKeys(){
  document.addEventListener('keydown', chooseHandHold);
  document.addEventListener('keyup', releaseHandHold);
}

function dist(a, b) {
  var x = Math.abs(a.x - b.x);
  var y = Math.abs(a.y - b.y);
  return Math.sqrt(x*x + y*y);
}

function addHandHold(name, x, y) {
  wall.push({name: name, x: x, y:y});
  drawHandHold(name, x, y);
}

function drawHandHold(name, x, y) {
  ctx.fillStyle = "#ccc";
  ctx.font = "bold 28px arial";
  ctx.fillText(name.toUpperCase(), x, y);
}


function buildWall() {
  var x;
  var y = 80;
  var i = 0;
  var xOffset;
  var yOffset;
  while (y < canvas.height - 20) {
    x = 30;
    while (x < canvas.width) {
      xOffset = randomBetween(-20, 20);
      yOffset = randomBetween(-50, 50);
      addHandHold(shuffledHandHoldNames[i], x + xOffset, y + yOffset);
      x += 80;
      i += 1;
      if (i >= shuffledHandHoldNames.length) {
        i = 0;
      }
    }
    y += 170;
  }
}

function drawHand(hand) {
  if (hand.grip) {
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = hand.side == "right" ? "red" : "blue";
    ctx.arc(hand.x + 10, hand.y - 10, 30, Math.PI * 0.5, Math.PI * -1.5, true);
    ctx.arc(hand.x + 10, hand.y - 10, 30, Math.PI * 0.5, Math.PI * -0.5, true);
    ctx.stroke();
    ctx.closePath();
  }
}


function grab(hand, handHold) {
  hand.grip = 1;
  hand.handHoldName = handHold.name;
  hand.x = handHold.x;
  hand.y = handHold.y;
  drawHand(hand);
}

function chooseHandHold(e) {
  // only proceed if the matching grip has been released
  if (hands.filter(function(hand) { return hand.grip && hand.handHoldName === String.fromCharCode(e.keyCode).toLowerCase(); }).length) { return; }

  var chosenHandHoldLetter = String.fromCharCode(e.keyCode).toLowerCase();
  var freeHand = hands.filter(function(hand) { return !hand.grip; })[0];
  if (!freeHand) { return; }
  var otherHand = hands.filter(function(hand) { return hand.grip; })[0];

  function isValidHandHold(acc, handHold) {
    if (acc) { return acc; }
    if (handHold.name === chosenHandHoldLetter &&
        handHold.y <= freeHand.y + 30 &&
        dist(handHold, freeHand) < 180 &&
        dist(handHold, otherHand) < 220) {
      acc = handHold;
    }
    return acc;
  }

  var handHold = wall.reduce(isValidHandHold, null);
  if (handHold) {
    grab(freeHand, handHold);
  }
}

function releaseHandHold(e) {
  hands.map(function(hand) {
    if(hand.handHoldName && hand.handHoldName.toLowerCase() === String.fromCharCode(e.keyCode).toLowerCase()) {
      hand.grip = 0;
    }
  });
}

function main() {
  buildWall();
  grab(hands[0], wall[wall.length - 3]);
  grab(hands[1], wall[wall.length - 4]);
  bindKeys();
}


main();


/*
 todo
 

 */
