var climber = (function() {
  var jointLength = 80;
  var armLength = jointLength * 2;
  var theta1 = 0;
  var leftArm, rightArm;
  var reachSpeed = 4;

  function init(hands) {
    leftArm = {
      target: {x: hands[0].x + 0, y: hands[0].y + 0},
      start: {x: hands[0].x + 50, y: hands[0].y + 50},
      mid: {x: hands[0].x + 0,  y: hands[0].y + 50},
      end: {x: hands[0].x + 0, y: hands[0].y + 0}
    };
    rightArm = {
      target: {x: hands[1].x + 0, y: hands[1].y + 0},
      start: {x: hands[1].x - 50, y: hands[1].y + 50},
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
    // progressively move towards target
    var reachLength = dist(activeTarget, activeArm.end) || 1;
    var dx = (activeTarget.x - activeArm.end.x) / reachLength;
    var dy = (activeTarget.y - activeArm.end.y) / reachLength;
    dt = dt || 16;
    activeArm.target.x += Math.ceil(dx * reachSpeed * 16 / dt);
    activeArm.target.y += Math.ceil(dy * reachSpeed * 16 / dt);

    var startx = activeArm.start.x;
    var starty = activeArm.start.y;

    ik(activeArm, bendDirection);

    var xdiff = activeArm.start.x  - startx;
    var ydiff = activeArm.start.y - starty;

    // drag passive arm's start along too (it will auto-retarget the next update call)
    passiveArm.start.x += xdiff;
    passiveArm.start.y += ydiff;
  }

  function update(leftTarget, rightTarget, dt) {
    reachTowardsTarget(leftArm, leftTarget, rightArm, -1, dt);
    reachTowardsTarget(rightArm, rightTarget, leftArm, 1, dt);
  }

  function draw() {
    // Draw arms
    drawArm(leftArm);
    drawArm(rightArm);

    // Draw head
    ctx.beginPath();
    ctx.arc(leftArm.start.x + 50, leftArm.start.y - 20, jointLength / 3, 0, Math.PI*2);
    // Draw body
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fill();
    ctx.fillRect(leftArm.start.x, leftArm.start.y, 100, 100);
  }

  function drawArm(joints) {
    ctx.beginPath();
    ctx.moveTo( joints.start.x, joints.start.y );
    ctx.lineTo( joints.mid.x, joints.mid.y );
    ctx.lineTo( joints.end.x, joints.end.y );
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.lineWidth = 10;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc( joints.start.x, joints.start.y, 10, 0, Math.PI*2 );
    ctx.fillStyle = "rgba(255,0,0,0.5)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc( joints.mid.x, joints.mid.y, 10, 0, Math.PI*2 );
    ctx.fillStyle = "rgba(0,255,0,0.5)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc( joints.end.x, joints.end.y, 15, 0, Math.PI*2 );
    ctx.fillStyle = "rgba(0,0,255,0.5)";
    ctx.fill();
  }

  return {
    init: init,
    draw: draw,
    update: update
  };
})();
