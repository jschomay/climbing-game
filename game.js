var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');
var lastTick, dt;
var pause = false;

var wall = [];
var hands = [{side: 'right'}, {side: 'left'}];
var keysDown = {};
var justPressed = null;
var justReleased = null;
var runningTime = 0;

function shuffle(o){
  for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
}

function randomBetween(min,max) {
  return Math.floor(Math.random()*(max-min+1)+min);
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
  if (hand.grip && hand.x !== hand.prevX && hand.y !== hand.prevY) {
    ctx.lineWidth = 3;
    ctx.strokeStyle = hand.side == "right" ? "red" : "blue";
    var handBias = hand.side == "right" ? 3 : -3;

    ctx.beginPath();
    ctx.moveTo(hand.prevX + 10 + handBias, hand.prevY - 30 - 10);

    ctx.arc(hand.x + 10 + handBias, hand.y - 10, 30, Math.PI * 0.5, Math.PI * -1.5, true);
    ctx.stroke();
    ctx.closePath();

    // grip strength indicator
    ctx.lineWidth = 9;
    ctx.strokeStyle = "black";

    ctx.beginPath();
    ctx.arc(hand.x + 10 + handBias, hand.y - 10, 30, Math.PI * 0, Math.PI * 2 * hand.grip, true);

    ctx.stroke();
    ctx.closePath();
  }
}


function grab(hand, handHold) {
  hand.grip = 1;
  hand.handHoldName = handHold.name;
  hand.prevX = hand.x;
  hand.prevY = hand.y;
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
    ctx.fillStyle = "#000";
    ctx.font = "bold 72px arial";
    ctx.fillText("Game Over!", 20, 300);
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
  }
}

function checkGameWin() {
  if (hands.filter(function(hand) { return hand.y < 100; }).length == 2) {
    pause = true;
    ctx.fillStyle = "#000";
    ctx.font = "bold 72px arial";
    ctx.fillText("You Win!", 50, 300);
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
  }
}

function updateGrips(dt) {
  hands.forEach(function(hand) {
    if(hand.grip > 0 && hand.prevX) {
      hand.grip = Math.max(0, Math.round((hand.grip - dt * 1 / 5000) * 10000) / 10000);
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
  drawTime();
  hands.forEach(drawHand);
}

function loop(time) {
  dt = time - lastTick || time;
  lastTick = time;
     
  updateWorld(dt);
  drawWorld();
  if (!pause) {
    requestAnimationFrame(loop);
  }
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

- limited time grips
  - use game loop
  - arm drops
  - dust/falling rocks
    - particle generator


- add vetical/horizontal scroll
  - generate larger wall
  - transfrorm canvas based on climb height

- map editor
  - switch modes/ second page
  - click to place a handhold
  - set size and scale to fit
  - save as level

- add score?
  - what to award? (vertical reach, speed, l/r/l/r, golf style score, grips with difficulty settings)

- add character
  - human or robot-like?  With legs?
  - http://jsdo.it/j_s/SO6b for IK
  - (auto-animate legs?)

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
