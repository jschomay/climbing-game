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

if(typeof module !== 'undefined') {
  module.exports = buildWall;
}
