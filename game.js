var onePlayerStartButton = document.getElementById('one-player-start');
var twoPlayerStartButton = document.getElementById('two-player-start');
var twoPlayerJoinButton = document.getElementById('two-player-join');
var startScreen = document.getElementById('start-screen');
var title = document.getElementById('title');
var loading = document.getElementById('loading');
var main = document.getElementById('main');
var canvas = document.getElementById('game');
// canvas must be even or bugs happen in the ik math
canvas.width = 1200;
canvas.height = 700;
var ctx = canvas.getContext('2d');
var gameType;
var lastTick, dt;
var doCountdown;
var canvasWidth;
var canvasHeight;
var rockTexture;
var vOffset;
var hOffset;
var scale;
var scrollSpeed;
var wallHeight = 2800;
var wallWidth = 1000;
var player;
var otherPlayer;
var pause;
var start;
var wall;
var finishLine;
var hands;
var keysDown;
var justPressed;
var justReleased;
var runningTime;
var countDown;
var gameOver;
var gameWin;
var waitingMsg;
var climberBody;
var redRobotSprites;
var greenRobotSprites;
var drop;
var climber;
var Howl;

function makeEven(n) { return n + n % 2; }

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

function drawWall() {
  // rock texture
  ctx.fillStyle = rockTexture;
  ctx.fillRect(0, -canvasHeight / 2, canvasWidth, wallHeight + canvasHeight);

  // finish line
  ctx.globalAlpha = 0.65;
  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 11;
  ctx.moveTo(0, finishLine);
  ctx.lineTo(canvasWidth, finishLine);
  ctx.stroke();
  ctx.closePath();

  ctx.beginPath();
  ctx.strokeStyle = 'white';
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
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = '#ccc';
  ctx.font = 'bold ' + 28 * handHold.difficulty + 'px arial';
  ctx.fillText(handHold.name.toUpperCase(), handHold.x, handHold.y);
  ctx.restore();
}


function buildWall() {

  function shuffle(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
  }

  var wall = [];
  var letters = [ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
  var difficulties = [1, 1, 1, 0.6, 0.6, 0.4, 0, 0];
  var shuffledHandHoldNames = shuffle(letters);
  var wallHeight = 2800;
  var wallWidth = 1200;
  var x;
  var y = 0;
  var i = 0;
  var xOffset;
  var yOffset;

  function addHandHold(name, x, y, difficulty) {
    if (difficulty) {
      wall.push({name: name, x: x, y:y, difficulty: difficulty});
    }
  }

  function randomBetween(min,max) {
    return Math.floor(Math.random()*(max-min+1)+min);
  }

  while (y < wallHeight + 100) {
    x = 30;
    while (x < wallWidth) {
      xOffset = randomBetween(-30, 30);
      yOffset = randomBetween(-60, 60);
      addHandHold(shuffledHandHoldNames[i], x + xOffset, y + yOffset, difficulties[randomBetween(0, difficulties.length - 1)]);
      x += 120;
      i += 1;
      if (i >= shuffledHandHoldNames.length) {
        i = 0;
      }
    }
    y += 160;
  }
  return wall;
}

function drawHand(hand) {
  if(!hand.start){ return; }
  var r = 45;
  var handBias = hand.side == 'right' ? 3 : -3;

  ctx.save();
  ctx.strokeStyle = hand.side == 'right' ? 'red' : 'blue';

  // climbing path
  ctx.save();
  ctx.beginPath();
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash([19,19]);
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
  hand.landed = false;
  hand.dropped = false;
  hand.released = false;
  hand.handHold = handHold;
  if(!hand.path.length || hand.path[hand.path.length - 1].x !== handHold.x && hand.path[hand.path.length - 1].y !== handHold.y) {
    hand.path.push({x: handHold.x, y: handHold.y});
  }
  hand.x = handHold.x;
  hand.y = handHold.y;

  play('Target');
  play('Servo');
}

function chooseHandHold(chosenHandHoldLetter) {
  // only proceed if the matching grip has been released
  if (hands[player-1].filter(function(hand) { return hand.grip && hand.handHold.name === chosenHandHoldLetter; }).length) { return; }

  hands[player-1].filter(function(hand) { return !hand.grip; }).forEach(function(freeHand){
    if (!freeHand) { return; }
    var otherHand = hands[player-1].filter(function(hand) { return hand !== freeHand; })[0];

    function isValidHandHold(acc, handHold) {
      if (acc) { return acc; }
      if (handHold.name === chosenHandHoldLetter &&
          otherHand.y - handHold.y < climber.armLength &&
          ((freeHand.x > otherHand.x && handHold.x > otherHand.x + 30) || (freeHand.x < otherHand.x && handHold.x < otherHand.x - 30)) &&
          dist(handHold, otherHand) < climber.armLength * 2) {
        acc = handHold;
      }
      return acc;
    }

    var handHold = wall.reduce(isValidHandHold, null);
    if (handHold) {
      freeHand.start = true;
      grab(freeHand, handHold);
    }
  });
}

function releaseHandHold(releasedLetter) {
  hands[player-1].map(function(hand) {
    if(hand.start && hand.handHold.name && hand.handHold.name.toLowerCase() === releasedLetter) {
      hand.grip = 0;
      hand.released = true;
      play('Servo');
    }
  });
}

function checkGameOver() {
  if (start && hands[player-1].filter(function(hand, i) {
    return hand.start && dist(hand, climberBody[0][i].end) > 1 ;
  }).length == 2) {
    pause = true;
    gameOver = true;
    play('fallingrock');
  }
}

function drawGameOver() {
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, canvasHeight / 2 - 70, canvasWidth, 150);
  ctx.fillStyle = '#000';
  ctx.font = 'bold 72px arial';
  ctx.globalAlpha = 1;
  ctx.fillText('Game Over!', canvasWidth / 2 - 200, canvasHeight / 2 + 10);
  ctx.font = 'bold 22px arial';
  ctx.fillText('Press "space" to play again', canvasWidth / 2 - 120, canvasHeight / 2 + 50);
}

function checkGameWin() {
  if (climberBody[0].filter(function(arm, i) {  return arm.end.y < finishLine && dist(arm.end, hands[player-1][i]) < 1; }).length) {
    pause = true;
    gameWin = true;
  }
}

function drawGameWin() {
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, -160, canvasWidth, 150);
  ctx.fillStyle = '#000';
  ctx.globalAlpha = 1;
  ctx.font = 'bold 72px arial';
  ctx.fillText('You Win!', canvasWidth / 2 - 160, -80);
  ctx.font = 'bold 22px arial';
  ctx.fillText('Press "space" to play again', canvasWidth / 2 - 140, -40);
}

function drawWaitingMessage(msg) {
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, wallHeight-220, canvasWidth, 150);
  ctx.fillStyle = '#000';
  ctx.globalAlpha = 1;
  ctx.font = 'bold 42px arial';
  ctx.fillText(msg, canvasWidth / 2 - (msg.length * 10), wallHeight-135);
}

function updateGrips(dt) {
  function updateHand (hand) {
    if(hand.start && hand.grip) {
      var gripDuration = 15 * hand.handHold.difficulty;
      hand.grip = Math.max(0, Math.round((hand.grip - dt * 1 / 1000 / gripDuration) * 10000) / 10000);
    }
  }

  updateHand(hands[0][0]);
  updateHand(hands[0][1]);
  if (twoPlayerGame()) {
    updateHand(hands[1][0]);
    updateHand(hands[1][1]);
  }
}

function drawCountdown() {
  var text;
  if (countDown > 500 && countDown < 1500) {
    text = 'Ready...';
  } else if(countDown > 2000 && countDown < 3000) {
    text = 'Set...';
  } else if(countDown > 3500 && countDown < 4000) {
    text = 'GO!';
    start = true;
  } else {
    return;
  }


  ctx.globalAlpha = 0.4;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, canvasHeight / 2 - 170, canvasWidth, 150);
  ctx.fillStyle = '#000';
  ctx.font = 'bold 72px arial';
  ctx.globalAlpha = 1;
  ctx.fillText(text, canvasWidth / 2 - 100, canvasHeight / 2 - 70);
}


function pad(n) { return (n < 10) ? ('0' + n) : n; }

function drawTime() {
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.font = 'bold 50px arial';
  var minutes = Math.floor(runningTime/1000/60 % 60);
  var seconds = (runningTime/1000 % 60).toFixed(1);
  var timeDisplay = pad(minutes) + ':' + pad(seconds);
  ctx.fillText(timeDisplay, 10, 45);
  ctx.strokeText(timeDisplay, 10, 45);
  ctx.restore();
}

function drawHeightClimbed() {
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.font = 'bold 25px arial';
  var highestGrip = climberBody[0].reduce(function(a,b){ return Math.min(a.end.y, b.end.y); });
  var climbedHeight = Math.max(Math.ceil((wallHeight - highestGrip) / 70), 0);
  var totalHeight = Math.floor(wallHeight / 70);
  var heightDisplay = climbedHeight + 'ft / ' + totalHeight + 'ft';
  ctx.fillText(heightDisplay, 10, 75);
  ctx.strokeText(heightDisplay, 10, 75);
  ctx.restore();
}

function updateWorld(dt) {
  if (!waitingMsg && doCountdown) {
    countDown += dt;
  } else {
    // dt jumps from 0 to however long the browser has been running, then down to 16
    // so it works as a good flag to only start the countdown when dt is at 16
    doCountdown = dt;
  }

  if (!pause && start) {
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


    var vOffsetTarget = hands[player-1].reduce(function(a,b){ return a.y + b.y; }) / 2;
    var maxScrollSpeed = 20;
    if (vOffset > vOffsetTarget) {
      scrollSpeed = Math.min(maxScrollSpeed, scrollSpeed + (dt * 20) / 1000);
    }
    scrollSpeed = Math.max(0, scrollSpeed - (dt * 15) / 1000);
    vOffset -= scrollSpeed;
  }

  climber.update(climberBody[0], hands[player-1], dt);
  if (twoPlayerGame()) {
    climber.update(climberBody[1], hands[otherPlayer-1], dt);
  }

  if(gameWin) {
    var scaleFactor = canvasHeight * 0.8 / wallHeight;
    vOffset = Math.max(100, vOffset - dt * 10 / 1000);
    scale = Math.max(scaleFactor, scale - dt * 0.1 / 1000);
  }

}

function drawWorld() {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.save();

  // scale whole canvas and keep horizontally centered
  ctx.scale(scale, scale);
  ctx.translate(-hOffset, -vOffset + canvasHeight / 2);
  ctx.translate(hOffset / scale, 0);

  drawWall();
  // hands[0].forEach(drawHand);
  // hands[1].forEach(drawHand);
  hands[player - 1].forEach(drawHand);

  if(gameWin) { drawGameWin(); }
  if(waitingMsg) { drawWaitingMessage(waitingMsg); }

  ctx.globalAlpha = 1;

  if(gameOver) {
    drop += 10;
    ctx.translate(0, drop);
    if(drop < 200) {
      play('Servo');
    } else {
      fadeOut('Servo');
    }
  }

  if (!waitingMsg) {
    climber.draw(redRobotSprites, climberBody[0], hands[player-1]);
    if(twoPlayerGame()) {
      ctx.translate(0, -drop);
      climber.draw(greenRobotSprites, climberBody[1], hands[otherPlayer-1]);
    }
  }

  ctx.restore();

  // outside of global transform
  drawTime();
  drawCountdown();
  drawHeightClimbed();
  if(gameOver) {
    drawGameOver();
  }
}

function loop(time) {
  dt = time - lastTick || time;
  lastTick = time;
  updateWorld(dt);
  drawWorld();
  requestAnimationFrame(loop);
}

function init() {
  wall = gameType == 'onePlayer' ? buildWall() : [];
  finishLine = 75;
  scrollSpeed = 0;
  scale = 1;
  keysDown = {};
  justPressed = null;
  justReleased = null;
  climberBody = [];
  runningTime = 0;
  countDown = 0;
  gameOver = false;
  gameWin = false;
  start = false;
  doCountdown = false;
  pause = false;
  drop = 0;
  hands = [
    [{side: 'right', path: []}, {side: 'left', path: []}],
    [{side: 'right', path: []}, {side: 'left', path: []}]
  ];
  if (gameType === 'onePlayer') {
    climberBody[0] = initClimber(1, hands[0]);
  } else {
    if (player === 1) {
      climberBody[0] = initClimber(1, hands[0]);
      climberBody[1] = initClimber(2, hands[1]);
    } else {
      climberBody[0] = initClimber(1, hands[1]);
      climberBody[1] = initClimber(2, hands[0]);
    }
  }

  var vOffsetTarget = hands[0].reduce(function(a,b){ return a.y + b.y; }) / 2 - 100;
  vOffset = vOffsetTarget;
  hOffset = canvasWidth / 2;
}

function initClimber(i, hands) {
  var offset;
  if (twoPlayerGame()) {
    offset = i == player
      ? (canvasWidth * 1 / 5)
      : (canvasWidth * 4 / 5);
  } else {
    offset = canvasWidth * 1 / 2;
  }

  hands[0].x = offset - 100;
  hands[0].y = wallHeight;

  hands[1].x = offset + 100;
  hands[1].y = wallHeight;

  return climber.init(hands);
}

// keep things sharp on retina screens
function enhanceContext(canvas, context) {
  var ratio = window.devicePixelRatio || 1,
    width = canvas.width,
    height = canvas.height;

  if (ratio > 1) {
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    context.scale(ratio, ratio);
  }

  canvasWidth = makeEven(canvas.width / ratio);
  canvasHeight = makeEven(canvas.height / ratio);
}

// preload textures
var imagesToLoad = [
  'assets/images/rocks.jpg',
  'assets/images/robot-sprites-red.png',
  'assets/images/robot-sprites-green.png'
];
var soundsToLoad = [
  'Grab1',
  'Grab2',
  'Grab3',
  'Servo',
  'Target',
  'wind',
  'fallingrock'
];
var loadedImages = imagesToLoad.map(loadImage);
var loadedSounds = soundsToLoad.map(loadSound);

var numAssetsLoaded = 0;
function assetLoaded() {
  numAssetsLoaded++;
  if(numAssetsLoaded === imagesToLoad.length + soundsToLoad.length) {
    loaded();
  }
}

function loadImage(path) {
  var img = new Image();
  img.src = path;
  img.onload = assetLoaded;
  return img;
}

function loadSound(name) {
  return new Howl({
    urls: [name+'.ogg'].map(function(p) { return 'assets/sounds/' + p; }),
    onload: assetLoaded
  });
}

function play(name) {
  var i = soundsToLoad.indexOf(name);
  loadedSounds[i].play();
}

function stop(name) {
  var i = soundsToLoad.indexOf(name);
  loadedSounds[i].stop();
}

function fadeOut(name) {
  var i = soundsToLoad.indexOf(name);
  loadedSounds[i].fadeOut();
}

function setSoundProp(name, prop, value) {
  var i = soundsToLoad.indexOf(name);
  loadedSounds[i]['_'+prop] = value;
}

function startGame() {
  main.style.background = 'initial';
  rockTexture = ctx.createPattern(loadedImages[0],'repeat');
  redRobotSprites = loadedImages[1];
  greenRobotSprites = loadedImages[2];

  startScreen.style.display = 'none';
  title.style.display = 'none';
  canvas.style.display = 'block';
  enhanceContext(canvas, ctx);

  // kick off
  init();
  bindKeys();
  loop(0);
}

function loaded() {
  loading.style.display = 'none';
  startScreen.style.display = 'block';

  setSoundProp('Target', 'volume', 0.3);
  setSoundProp('wind', 'loop', true);
  setSoundProp('wind', 'volume', 0.6);

  play('wind');
}

function twoPlayerGame () {
  return  gameType === 'twoPlayer';
}

function showWaitingMsg(msg) {
  waitingMsg = msg;
}

// bind start screen buttons
onePlayerStartButton.onclick = function(e){
  e.preventDefault();
  gameType = 'onePlayer';
  player = 1;
  showWaitingMsg(undefined);
  startGame();
};

twoPlayerStartButton.onclick = function(e){
  e.preventDefault();
  gameType = 'twoPlayer';
  player = 1;
  otherPlayer = 2;
  showWaitingMsg('Preparing race...');
  startGame();
  //temp:
  setTimeout(function(){
    wall = buildWall();
    showWaitingMsg(null);
  }, 1000);
  // send initiateRace socket message
};
// on raceCreated, raceCode socket message showWaitingMsg(roomCodeMsg)

twoPlayerJoinButton.onclick = function(e){
  e.preventDefault();
  gameType = 'twoPlayer';
  player = 2;
  otherPlayer = 1;
  showWaitingMsg('Preparing race...');
  startGame();
  //temp:
  setTimeout(function(){
    wall = buildWall();
    showWaitingMsg(null);
  }, 1000);
  // send joinRace, raceCode socket message
};
// if joinRaceError socket message showWaitingMsg(raceCodeErrorMsg)

// on startRace, wall socket message init(wall), clearWaitingMsg

/*
   initiateRace returns roomCreated message with roomNumber, display "waiting for other player to joing race xyz"
   joinRace with a valid roomNumber triggers a startRace, displays "preparing race" or "race xyz doesn't exist"
   startRace returns a wall, runs startGame() (and initializes the wall and two players)
   losing or wining says you lose or you win, and sends a message raceOver with outcome which displays you lose or you win
   restarting a finished race sends startRace (needs to reinitialize everything)

  todo next:
  - set up server
  - handle gameover/restart two player
 * */
