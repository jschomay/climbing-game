var robotAtlas = {
  head: {
    x: 146,
    y: 4,
    w: 82,
    h: 88,
    cx: 41,
    cy: 68
  },
  torso: {
    x: 0,
    y: 66,
    w: 146,
    h: 152,
    cx: 73,
    cy: 30
  },
  upperArm: {
    x: 0,
    y: 0,
    w: 116,
    h: 66,
    cx: 0,
    cy: 34
  },
  foreArm: {
    x: 147,
    y: 158,
    w: 89,
    h: 51,
    cx: 3,
    cy: 26
  },
  hand: {
    x: 180,
    y: 98,
    w: 46,
    h: 59,
    cx: 23,
    cy: 28
  }
};


var climber = (function() {
  var jointLength = 100;
  var armLength = jointLength * 2;
  var theta1 = 0;
  var leftArm, rightArm;
  var reachSpeed = 5;

  function init(hands) {
    leftArm = {
      target: {x: hands[0].x + 0, y: hands[0].y + 0},
      start: {x: hands[0].x + 50, y: hands[0].y + 50},
      mid: {x: hands[0].x + 0,  y: hands[0].y + 50},
      end: {x: hands[0].x + 0, y: hands[0].y + 0}
    };
    rightArm = {
      target: {x: hands[1].x + 0, y: hands[1].y + 0},
      start: {x: hands[1].x - 60, y: hands[1].y + 50},
      mid: {x: hands[1].x + 0, y: hands[1].y + 50},
      end: {x: hands[1].x + 0, y: hands[1].y + 0}
    };
    return [leftArm.end, rightArm.end];
  }

  function ik(joints, bendDirection) {
    bendDirection = bendDirection || 1;

    var dx = joints.target.x - joints.start.x;
    var dy = joints.target.y - joints.start.y;
    var extention = Math.sqrt(dx*dx + dy*dy);

    // angle from shoulder to target
    var theta = Math.atan2(dy,dx);

    // angle from shoulder to elbow (via law of cosine)
    theta1 = bendDirection * Math.acos( extention / (jointLength + jointLength) ) + theta || theta;

    // if not fully extended
    if(Math.abs(theta - theta1) > 0.001) {
      // bend/straighten arm
      joints.mid.x = joints.start.x + Math.cos( theta1 ) * jointLength;
      joints.mid.y = joints.start.y + Math.sin( theta1 ) * jointLength;
      joints.end.x = joints.target.x;
      joints.end.y = joints.target.y;
    } else {
      // move the whole arm
      var xdiff = joints.target.x - joints.end.x;
      var ydiff = joints.target.y - joints.end.y;

      joints.mid.x = xdiff + joints.mid.x;
      joints.mid.y = ydiff + joints.mid.y;
      joints.end.x = joints.target.x;
      joints.end.y = joints.target.y;
      joints.start.x = xdiff + joints.start.x;
      joints.start.y = ydiff + joints.start.y;
    }

  }

  function reachTowardsTarget(activeArm, activeTarget, passiveArm, bendDirection, dt) {
    var activeTarget_ = {
      x: activeTarget.x,
      y: activeTarget.y
    };
    var reachSpeed_ = reachSpeed;

    // drop arm if grip was dropped
    if(!activeTarget.grip) {
      activeTarget_.y += 50;
      activeTarget_.x += bendDirection * 30;
      reachSpeed_ /= 2;
    }

    // progressively move towards target
    var reachLength = dist(activeTarget_, activeArm.end) || 1;
    var dx = (activeTarget_.x - activeArm.end.x) / reachLength;
    var dy = (activeTarget_.y - activeArm.end.y) / reachLength;
    dt = dt || 16;
    activeArm.target.x += Math.ceil(dx * reachSpeed_ * 16 / dt);
    activeArm.target.y += Math.ceil(dy * reachSpeed_ * 16 / dt);

    var startx = activeArm.start.x;
    var starty = activeArm.start.y;

    ik(activeArm, bendDirection);

    // gravity
    var activeArmExtention = dist(activeArm.end, activeArm.start);
    var passiveArmExtention = dist(passiveArm.end, passiveArm.start);
    if(activeTarget.grip && activeArmExtention < armLength && passiveArmExtention < armLength) {
      var gravityTarget = {
        x: activeArm.end.x,
        y: activeArm.end.y + activeArmExtention
      };
      dx = (gravityTarget.x - activeArm.start.x) / dist(gravityTarget, activeArm.start);
      dy = (gravityTarget.y - activeArm.start.y) / dist(gravityTarget, activeArm.start);
      activeArm.start.x += dx * 1 * 16 / dt;
      activeArm.start.y += dy * 1 * 16 / dt;
      activeArm.mid.x += dx * 1 * 16 / dt;
      activeArm.mid.y += dx * 1 * 16 / dt;
    }

    // drag passive arm's start along too to keep everything aligned (it will auto-retarget the next update call)
    var xdiff = activeArm.start.x  - startx;
    var ydiff = activeArm.start.y - starty;

    passiveArm.start.x += xdiff;
    passiveArm.start.y += ydiff;
    passiveArm.mid.x += xdiff;
    passiveArm.mid.y += ydiff;
  }

  function update(leftTarget, rightTarget, dt) {
    reachTowardsTarget(leftArm, leftTarget, rightArm, -1, dt);
    reachTowardsTarget(rightArm, rightTarget, leftArm, 1, dt);
  }

  function draw() {
    drawArm('left');
    drawArm('right');
    drawPart('head', {x: leftArm.start.x + 35, y: leftArm.start.y - 25});
    drawPart('torso', {x: leftArm.start.x + 45, y: leftArm.start.y - 10});
  }

  function drawArm(side) {
    var joints = side === 'right' ? rightArm : leftArm;
    var matchingHand = side === 'right' ? hands[1] : hands[0];
    var rotateDirection = side === 'right' ? 1 : -1;
    var upperArmRotation = Math.atan2((joints.mid.y - joints.start.y) , (joints.mid.x - joints.start.x));
    var foreArmRotation = Math.atan2((joints.end.y - joints.mid.y) , (joints.end.x - joints.mid.x));
    var handX = joints.mid.x + (joints.end.x - joints.mid.x) * jointLength * 0.8 / jointLength;
    var handY = joints.mid.y + (joints.end.y - joints.mid.y) * jointLength * 0.8 / jointLength;
    var handClench = dist(joints.end, matchingHand) < 5 ? 0.9 : 1;

    drawPart('hand', {x: handX, y: handY}, Math.PI / 2, {x: handClench * 1, y: handClench * rotateDirection});
    drawPart('foreArm', {x: joints.mid.x, y: joints.mid.y}, foreArmRotation, {x: 1, y: rotateDirection});
    drawPart('upperArm', {x: joints.start.x, y: joints.start.y}, upperArmRotation, {x: 1, y: rotateDirection});
}

  function drawPart(part, at, rotation, scale) {
    scale = scale || {x:1, y:1};
    var source = robotAtlas[part];
    ctx.save();
    ctx.translate(at.x, at.y);
    ctx.rotate(rotation);
    ctx.scale(scale.x, scale.y);
    ctx.translate(-source.cx, -source.cy);
    ctx.drawImage(robotSprites, source.x*2, source.y*2, source.w*2, source.h*2, 0, 0, source.w, source.h);
    ctx.restore();
  }

  return {
    init: init,
    draw: draw,
    update: update,
    armLength: armLength
  };
})();
