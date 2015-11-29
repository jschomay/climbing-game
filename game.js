var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');
var lastTick, dt;
var pause = false;

var wall = [];
var hands = [{side: 'right', path: [{x: canvas.width / 2, y: canvas.height + 100}]}, {side: 'left', path: [{x: canvas.width / 2, y: canvas.height + 100}]}];
var keysDown = {};
var justPressed = null;
var justReleased = null;
var runningTime = 0;
var gameOver = false;
var gameWin = false;

function shuffle(o){
  for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
}

function randomBetween(min,max) {
  return Math.floor(Math.random()*(max-min+1)+min);
}

function degToRad(d) {
  return (Math.PI/180) * d;
}

var letters = [ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

var shuffledHandHoldNames = shuffle(letters);

function handleKeyDown(e) {
  var letter = String.fromCharCode(e.keyCode).toLowerCase();
  if(!keysDown[letter]) {
    keysDown[letter] = true;
    justPressed = letter;
  }
}

function handleKeyUp(e) {
  var letter = String.fromCharCode(e.keyCode).toLowerCase();
  keysDown[letter] = false;
  justReleased = letter;
}
function bindKeys(){
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
}

function dist(a, b) {
  var x = Math.abs(a.x - b.x);
  var y = Math.abs(a.y - b.y);
  return Math.sqrt(x*x + y*y);
}

function addHandHold(name, x, y) {
  wall.push({name: name, x: x, y:y});
}

function drawWall() {
  wall.forEach(drawHandHold);
}

function drawHandHold(handHold) {
  ctx.save();
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = "#ccc";
  ctx.font = "bold 28px arial";
  ctx.fillText(handHold.name.toUpperCase(), handHold.x, handHold.y);
  ctx.restore();
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
  var r = 35;
  var handBias = hand.side == "right" ? 3 : -3;

  ctx.save();
  ctx.strokeStyle = hand.side == "right" ? "red" : "blue";

  // climbing path
  ctx.save();
  ctx.beginPath();
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash([10,5]);
  ctx.globalAlpha = 0.5;
  ctx.moveTo(hand.path[0].x, hand.path[0].y);
  hand.path.slice(1).forEach(function(p) {
    ctx.lineTo(p.x + 10 + handBias, p.y - 10);
  });
  ctx.stroke();
  ctx.closePath();
  ctx.restore();

  if (hand.grip) {
    // active hold
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(hand.x + 10, hand.y - 10, r, Math.PI * 0.5, Math.PI * -1.5, true);
    ctx.stroke();
    ctx.closePath();

    // grip strength
    ctx.beginPath();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = ctx.strokeStyle;
    ctx.moveTo(hand.x + 10, hand.y - 10);
    ctx.arc(hand.x + 10, hand.y - 10, r, degToRad(0 - 90), degToRad(-360 * hand.grip - 90),  true);
    ctx.fill();
    ctx.closePath();
  }
  ctx.restore();
}


function grab(hand, handHold) {
  hand.grip = 1;
  hand.handHoldName = handHold.name;
  if(hand.path[hand.path.length - 1].x !== handHold.x && hand.path[hand.path.length - 1].y !== handHold.y) {
    hand.path.push({x: handHold.x, y: handHold.y});
  }
  hand.x = handHold.x;
  hand.y = handHold.y;
}

function chooseHandHold(chosenHandHoldLetter) {
  // only proceed if the matching grip has been released
  if (hands.filter(function(hand) { return hand.grip && hand.handHoldName === chosenHandHoldLetter; }).length) { return; }

  var freeHand = hands.filter(function(hand) { return !hand.grip; })[0];
  if (!freeHand) { return; }
  var otherHand = hands.filter(function(hand) { return hand !== freeHand; })[0];

  function isValidHandHold(acc, handHold) {
    if (acc) { return acc; }
    if (handHold.name === chosenHandHoldLetter &&
        handHold.y <= freeHand.y + 30 &&
        dist(handHold, freeHand) < 180 &&
        dist(handHold, otherHand) < 250) {
      acc = handHold;
    }
    return acc;
  }

  var handHold = wall.reduce(isValidHandHold, null);
  if (handHold) {
    freeHand.start = true;
    grab(freeHand, handHold);
  }
}

function releaseHandHold(releasedLetter) {
  hands.map(function(hand) {
    if(hand.handHoldName && hand.handHoldName.toLowerCase() === releasedLetter) {
      hand.grip = 0;
    }
  });
}

function checkGameOver() {
  if (hands.filter(function(hand) { return !hand.grip; }).length == 2) {
    pause = true;
    gameOver = true;
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
  }
}
function drawGameOver() {
  ctx.fillStyle = "#000";
  ctx.font = "bold 72px arial";
  ctx.fillText("Game Over!", 20, 300);
}

function checkGameWin() {
  if (hands.filter(function(hand) { return hand.y < 100; }).length == 2) {
    pause = true;
    gameWin = true;
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
  }
}

function drawGameWin() {
  ctx.fillStyle = "#000";
  ctx.font = "bold 72px arial";
  ctx.fillText("You Win!", 50, 300);
}

function updateGrips(dt) {
  var gripDuration = 7;
  hands.forEach(function(hand) {
    if(hand.start && hand.grip) {
      hand.grip = Math.max(0, Math.round((hand.grip - dt * 1 / 1000 / gripDuration) * 10000) / 10000);
    }
  });
}

function drawTime() {
  ctx.save();
  ctx.fillStyle = "#000";
  ctx.font = "18px arial";
  ctx.clearRect(0,0,100,15);
  ctx.fillText(runningTime, 10, 15);
  ctx.restore();
}

function updateWorld(dt) {
  runningTime = Math.round(lastTick / 1000);
  checkGameWin();
  checkGameOver();

  if(justPressed) {
    chooseHandHold(justPressed);
    justPressed = null;
  }
  if(justReleased) {
    releaseHandHold(justReleased);
    justReleased = null;
  }

  updateGrips(dt);
}

function drawWorld() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawWall();
  drawTime();
  hands.forEach(drawHand);
}

function loop(time) {
  if (!pause) {
    dt = time - lastTick || time;
    lastTick = time;
       
    updateWorld(dt);
    drawWorld();
    if(gameOver) { drawGameOver(); }
    if(gameWin) { drawGameWin(); }
  }
  requestAnimationFrame(loop);
}

function init() {
  buildWall();
  grab(hands[0], wall[wall.length - 3]);
  grab(hands[1], wall[wall.length - 4]);
  bindKeys();

  loop(0);
}


init();


/*
todo
 
- add finish line?

- add vetical/horizontal scroll
  - generate larger wall
  - transfrorm canvas based on climb height

- map editor
  - switch modes/ second page
  - click to place a handhold
  - set size and scale to fit
  - save as level

- grips with different difficulties
  - harder grips are more transparent
  - grip indicator is smaller and shorter for harder grips

- add score?
  - what to award? (vertical reach, speed, l/r/l/r, golf style score, grips with difficulty settings)

- add character
  - human or robot-like?  With legs?
  - http://jsdo.it/j_s/SO6b for IK
  - (auto-animate legs?)

- animations when losing grip
  - dust/falling rocks
    - particle generator
  - character arm drops

- 2 player race to the top
  - on same keyboard?
  - networked
    - using websockets and server
    - "rooms"
    - could fit 3 or 4 climbers
  - swipe at the other player to knock one of their hands free

- Start menu with title


Notes:
- Reach can equal arm length plus unextended reach of highest leg
 */
