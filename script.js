const canvas = document.getElementById("gameCanvas");
const devInfo = document.getElementById("devInfo");
const ctx = canvas.getContext("2d");
const width = 318;
const height = 651;
var keys = {};
var gamepads = {};
var gamepad1 = null;

var maxSpeedX = 0;
var maxSpeedY = 0;
var velocityX = 0;
var velocityY = 0;
var robotX = 0;
var robotY = 0;
var robotWidth = 36/2; // Half of actual
var robotHeight = 36/2; // Same as width
var robotRotation = 0;
var robotSpeed = 2;
var robotAcceleration = .3;
var robotDeceleration = .5;
var stoppingMargin = .2;

// Manage key holding
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
});
document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});
window.addEventListener('gamepadconnected', (e) => {
    console.log(
    "CONNECTED AT %d: %s. %d BUTTONS, %d AXES",
    e.gamepad.index,
    e.gamepad.id,
    e.gamepad.buttons.length,
    e.gamepad.axes.length,
  );
  gamepads[e.gamepad.index] = true;
});
window.addEventListener('gamepaddisconnected', (e) => {
    gamepads[e.gamepad.index] = false;
});

function update() {
    if (gamepads[0]) { // Controller
        gamepad1 = navigator.getGamepads()[0];
        maxSpeedX = gamepad1.axes[0] * robotSpeed;
        maxSpeedY = gamepad1.axes[1] * robotSpeed;
        robotRotation += gamepad1.axes[2]/10;
    } else { // No controller
        if (keys["KeyW"]) { // Up
            maxSpeedY = -1;
        } else if (keys["KeyS"]) { // Down
            maxSpeedY = 1;
        } else {
            maxSpeedY = 0;
        }
        if (keys["KeyA"]) { // Left
            maxSpeedX = -1;
        } else if (keys["KeyD"]) { // Right
            maxSpeedX = 1;
        } else {
            maxSpeedX = 0;
        }
        if (keys["KeyJ"]) { // Rotation Left
            robotRotation -= .1;
        } else if (keys["KeyL"]) { // Rotation Right
            robotRotation += .1;
        }
    }

    if (maxSpeedX > 0) {
        velocityX += robotAcceleration;
        // If velocity over the limit
        if (velocityX > maxSpeedX) {
            velocityX = maxSpeedX;
        }
    } else if (maxSpeedX < 0) {
        velocityX -= robotAcceleration;
        // If velocity over the limit
        if (velocityX < maxSpeedX) {
            velocityX = maxSpeedX;
        }
    } else {
        // Slow down if max speed is 0
        if (velocityX > stoppingMargin) {
            velocityX -= robotDeceleration;
        } else if (velocityX < -stoppingMargin) {
            velocityX += robotDeceleration;
        } else {
            velocityX = 0;
        }
    }

    if (maxSpeedY > 0) {
        velocityY += robotAcceleration;
        if (velocityY > maxSpeedY) {
            velocityY = maxSpeedY;
        }
    } else if (maxSpeedY < 0) {
        velocityY -= robotAcceleration;
        if (velocityY < maxSpeedY) {
            velocityY = maxSpeedY;
        }
    } else {
        if (velocityY > stoppingMargin) {
            velocityY -= robotDeceleration;
        } else if (velocityY < -stoppingMargin) {
            velocityY += robotDeceleration;
        } else {
            velocityY = 0;
        }
    }

    robotX += velocityX;
    robotY += velocityY;

    gamepadConnected = "connect?";
    if (gamepads[0]) {
        gamepadConnected = '<p style="color:green;">Connected!</p>';
    } else {
        gamepadConnected = '<p style="color:red;">Press Start to connect gamepad...</p>'
    }

    devInfo.innerHTML = gamepadConnected +
        "<br>x: " + Math.floor(robotX*10)/10 +
        "<br>y: " + Math.floor(robotY*10)/10 +
        "<br>rad: " + Math.floor(robotRotation*100)/100 +
        "<br>maxSpeedX: " + Math.floor(maxSpeedX*10)/10 +
        "<br>maxSpeedY: " + Math.floor(maxSpeedY*10)/10 +
        "<br>xV: " + Math.floor(velocityX*10)/10 +
        "<br>yV: " + Math.floor(velocityY*10)/10;

    // Limit robot to field
    if (robotX < robotWidth) { robotX = robotWidth; }
    if (robotX > width - robotWidth) { robotX = width - robotWidth; }
    if (robotY < robotHeight) { robotY = robotHeight; }
    if (robotY > height - robotHeight) {robotY = height - robotHeight; }

    // Update robot
    ctx.clearRect(0, 0, width, height);
    ctx.translate(robotX, robotY);
    ctx.rotate(robotRotation);
    ctx.translate(-robotX, -robotY);

    ctx.fillStyle = "#000000";
    ctx.fillRect(robotX-robotWidth, robotY-robotHeight, robotWidth*2, robotHeight*2);

    ctx.translate(robotX, robotY);
    ctx.rotate(-robotRotation);
    ctx.translate(-robotX, -robotY);

    requestAnimationFrame(update);
}

requestAnimationFrame(update);