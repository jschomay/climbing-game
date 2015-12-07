var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');
var lastTick, dt;
var canvasWidth = canvas.width;
var canvasHeight = canvas.height;
var rockTexture;
var vOffset;
var hOffset;
var scale;
var scrollSpeed;
var wallHeight;
var pause;
var wall;
var finishLine;
var hands;
var keysDown;
var justPressed;
var justReleased;
var runningTime;
var gameOver;
var gameWin;

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

function wrapText(text, x, y, maxWidth, lineHeight) {
  var words = text.split(' ');
  var line = '';

  for(var n = 0; n < words.length; n++) {
    var testLine = line + words[n] + ' ';
    var metrics = ctx.measureText(testLine);
    var testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    }
    else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

function handleKeyDown(e) {
  if((gameOver || gameWin) && e.keyCode === 32) {
    init();
    return;
  }

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

function addHandHold(name, x, y, difficulty) {
  if (difficulty) {
    wall.push({name: name, x: x, y:y, difficulty: difficulty});
  }
}

function drawWall() {
  // rock texture
  ctx.fillStyle = rockTexture;
  ctx.fillRect(0, -canvasHeight / 2, canvasWidth, wallHeight + canvasHeight);

  // finish line
  ctx.globalAlpha = 0.65;
  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = "black";
  ctx.lineWidth = 11;
  ctx.moveTo(0, finishLine);
  ctx.lineTo(canvasWidth, finishLine);
  ctx.stroke();
  ctx.closePath();

  ctx.beginPath();
  ctx.strokeStyle = "white";
  ctx.lineWidth = 5;
  ctx.setLineDash([30]);
  ctx.moveTo(0, finishLine - 3);
  ctx.lineTo(canvasWidth, finishLine - 3);
  ctx.stroke();
  ctx.closePath();

  ctx.beginPath();
  ctx.moveTo(0, finishLine + 3);
  ctx.lineTo(canvasWidth, finishLine + 3);
  ctx.lineDashOffset = 30;
  ctx.stroke();
  ctx.closePath();
  ctx.restore();

  // handholds
  wall.forEach(drawHandHold);
}

function drawHandHold(handHold) {
  ctx.save();
  ctx.globalAlpha = 0.9 * handHold.difficulty;
  ctx.fillStyle = "#ccc";
  ctx.font = "bold 28px arial";
  ctx.fillText(handHold.name.toUpperCase(), handHold.x, handHold.y);
  ctx.restore();
}


function buildWall() {
  var letters = [ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
  var difficulties = [1, 1, 1, 0.6, 0.6, 0.4, 0];
  var shuffledHandHoldNames = shuffle(letters);
  wallHeight = canvasHeight * 2;
  var x;
  var y = 80;
  var i = 0;
  var xOffset;
  var yOffset;
  while (y < wallHeight - 20) {
    x = 30;
    while (x < canvasWidth) {
      xOffset = randomBetween(-20, 20);
      yOffset = randomBetween(-50, 50);
      addHandHold(shuffledHandHoldNames[i], x + xOffset, y + yOffset, difficulties[randomBetween(0, difficulties.length - 1)]);
      x += 70;
      i += 1;
      if (i >= shuffledHandHoldNames.length) {
        i = 0;
      }
    }
    y += 160;
  }
}

function drawHand(hand) {
  var r = 35 * hand.grip;
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
  hand.grip = 1 * handHold.difficulty;
  hand.handHoldName = handHold.name;
  if(!hand.path.length || hand.path[hand.path.length - 1].x !== handHold.x && hand.path[hand.path.length - 1].y !== handHold.y) {
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
  }
}
function drawGameOver() {
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, canvasWidth / 2, canvasWidth, 150);
  ctx.fillStyle = "#000";
  ctx.font = "bold 72px arial";
  ctx.globalAlpha = 1;
  ctx.fillText("Game Over!", 20, 300);
  ctx.font = "bold 22px arial";
  ctx.fillText("Press 'space' to play again", 100, 340);
}

function checkGameWin() {
  if (hands.filter(function(hand) { return hand.y < finishLine; }).length) {
    pause = true;
    gameWin = true;
  }
}

function drawGameWin() {
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, -160, canvasWidth, 150);
  ctx.fillStyle = "#000";
  ctx.globalAlpha = 1;
  ctx.font = "bold 72px arial";
  ctx.fillText("You Win!", 80, -80);
  ctx.font = "bold 22px arial";
  ctx.fillText("Press 'space' to play again", 100, -40);
}

function drawInstructions() {
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, wallHeight, canvasWidth, 400);
  ctx.fillStyle = "#000";
  ctx.globalAlpha = 1;
  ctx.font = "bold 22px arial";
  ctx.fillText("How to play:", 160, wallHeight + 40);
  ctx.font = "bold 18px arial";
  var instructions = "Climb the wall by holding down the key matching the lettered handhold you want to grab next.  Start with the two circled handholds, and don't let go with both hands at the same time!";
  wrapText(instructions, 30, wallHeight + 80, canvasWidth - 50, 25);
}

function updateGrips(dt) {
  var gripDuration = 15;
  hands.forEach(function(hand) {
    if(hand.start && hand.grip) {
      hand.grip = Math.max(0, Math.round((hand.grip - dt * 1 / 1000 / gripDuration) * 10000) / 10000);
      if (hand.grip === 0) {
        hand.path.pop();
      }
    }
  });
}

function drawTime() {
  ctx.save();
  ctx.fillStyle = "#000";
  ctx.font = "18px arial";
  ctx.fillText(Math.round(runningTime/1000), 10, 15);
  ctx.restore();
}

function updateWorld(dt) {
  if (!pause) {
    runningTime += dt;
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

    var vOffsetTarget = hands.reduce(function(a,b){ return a.y + b.y; }) / 2;
    var maxScrollSpeed = 20;
    if (vOffset > vOffsetTarget) {
      scrollSpeed = Math.min(maxScrollSpeed, scrollSpeed + (dt * 20) / 1000);
    }
    scrollSpeed = Math.max(0, scrollSpeed - (dt * 15) / 1000);
    vOffset -= scrollSpeed;
  }



  if(gameWin) {
    var scaleFactor = canvasHeight * 0.9 / wallHeight;
    // hOffset = Math.min(canvasWidth * scaleFactor, hOffset + dt * 30 / 1000);
    vOffset = Math.max(100, vOffset - dt * 10 / 1000);
    scale = Math.max(scaleFactor, scale - dt * 0.1 / 1000);
  }

}

function drawWorld() {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(hOffset, -vOffset + canvasHeight / 2);
  drawWall();
  hands.forEach(drawHand);
  drawInstructions();
  if(gameWin) { drawGameWin(); }
  ctx.restore();

  // outside of global transform
  drawTime();
  if(gameOver) { drawGameOver(); }
}

function loop(time) {
  dt = time - lastTick || time;
  lastTick = time;
  updateWorld(dt);
  drawWorld();
  requestAnimationFrame(loop);
}

function init() {
  wall = [];
  buildWall();
  finishLine = 75;
  scrollSpeed = 0;
  scale = 1;
  hands = [{side: 'right', path: []}, {side: 'left', path: []}];
  keysDown = {};
  justPressed = null;
  justReleased = null;
  runningTime = 0;
  gameOver = false;
  gameWin = false;
  pause = false;

  grab(hands[0], wall[wall.length - 2]);
  grab(hands[1], wall[wall.length - 3]);
  var vOffsetTarget = hands.reduce(function(a,b){ return a.y + b.y; }) / 2;
  vOffset = vOffsetTarget;
  hOffset = 0;
}


// preload texture
var img = new Image();
img.src ='rocks.jpg';
img.onload = function(){
  rockTexture = ctx.createPattern(img,'repeat');

  // kick off
  init();
  bindKeys();
  loop(0);
};


/*
todo
 
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
