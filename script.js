const canvas = document.getElementById("gameCanvas");
const devInfo = document.getElementById("devInfo");
const ctx = canvas.getContext("2d");
const width = 318;
const height = 651;
const e = 0.6; // Wall bounciness
var keys = {};
var gamepads = {};
var gamepad1 = null;

var speed = 2;
var acceleration = .3;
var deceleration = .2;
var stoppingMargin = .5;
const startPos = {x: Math.floor(width/2), y:Math.floor(height/2)};

const robot = {
    x: startPos.x,
    y: startPos.y,
    angle: 1.2,
    xV: 100,
    yV: 0,
    angleV: 0,
    width: 36,
    height: 36,
    mass: 1,
    moi: 0,

    get halfWidth() {return this.width/2},
    get halfHeight() {return this.height/2}
}
robot.moi = (1/12) * robot.mass * (Math.pow(robot.width, 2)+Math.pow(robot.height, 2));

function getVertices(object) {
    const cos = Math.cos(object.angle);
    const sin = Math.sin(object.angle);

    let offsets = [
        {x:-object.halfWidth, y:-object.halfHeight},
        {x:object.halfWidth, y:-object.halfHeight},
        {x:object.halfWidth, y:object.halfHeight},
        {x:-object.halfWidth, y:object.halfHeight}
    ]

    // Loops through every object in the array and applies new value
    return offsets.map(local => ({
        x: object.x + (local.x * cos - local.y * sin),
        y: object.y + (local.x * sin + local.y * cos)
    }));
}

function reset() {
    robot.x = startPos.x;
    robot.y = startPos.y;
    robot.angle = 0;
    robot.xV = 0;
    robot.xY = 0;
    robot.angleV = 0;
}
function floor(num, dec) {
    return Math.floor(num*Math.pow(10, dec))/Math.pow(10, dec);
}

function onValueChange(id) {
    let value = parseFloat(document.getElementById(id).value);
    switch(id) {
        case "speed":
            speed = value;
            break;
        case "accel":
            acceleration = value;
            break;
        case "decel":
            deceleration = value;
            break;
        case "stopping":
            stoppingMargin = value;
            break;
    }
}

// Manage input
document.addEventListener('keydown', (e) => {
    console.log("KEY DOWN: %s", e.code);
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

var lastTime = performance.now();
function update(time) {
    var deltaTime = (time - lastTime)/1000;
    lastTime = time;
    if (deltaTime > .1) {deltaTime = .1;} // Anti lag-spike

    if (gamepads[0]) { // Controller
        gamepad1 = navigator.getGamepads()[0];
        if (gamepad1.buttons[9].pressed) {
            reset();
        }
    }

    robot.x += robot.xV * deltaTime;
    robot.y += robot.yV * deltaTime;
    robot.angle += robot.angleV * deltaTime;

    let vertices = getVertices(robot);

    vertices.forEach(vertex => {
        let hitWallX = false;
        let hitWallY = false;
        let wallPos = 0;
        let wallNormal = {x:0, y:0};
        if (vertex.x < 0) {
            wallNormal.x = 1;
            hitWallX = true;
        } else if (vertex.x > width) {
            wallNormal.x = -1;
            wallPos = width;
            hitWallX = true;
        } else if (vertex.y < 0) {
            wallNormal.y = 1;
            hitWallY = true;
        } else if (vertex.y > height) {
            wallNormal.y = -1;
            wallPos = height;
            hitWallY = true;
        }

        if (hitWallX || hitWallY) {
            let penetration = 0;
            let correctedVertex = 0;
            let leverArmVector = {x:0, y:0};
            if (hitWallX) {
                penetration = vertex.x + Math.sign(wallNormal.x)*wallPos;
                robot.x -= penetration;
                correctedVertex = vertex.x - penetration;

                leverArmVector = {
                    x:correctedVertex - robot.x,
                    y:vertex.y - robot.y
                };
            }
            if (hitWallY) {
                penetration = vertex.y + Math.sign(wallNormal.y)*wallPos;
                robot.y -= penetration;
                correctedVertex = vertex.y - penetration;

                leverArmVector = {
                    x:vertex.x - robot.x,
                    y:correctedVertex - robot.y
                };
            }

            let vertexVelocityVector = {
                x:robot.xV - robot.angleV * leverArmVector.y,
                y:robot.yV + robot.angleV * leverArmVector.y
            }

            let velocityAlongNormal = vertexVelocityVector.x * wallNormal.x +
                vertexVelocityVector.y * wallNormal.y;

            if (velocityAlongNormal < 0) {
                let rCrossN = leverArmVector.x * wallNormal.y -
                    leverArmVector.y * wallNormal.x;

                let impulseDenominator = (1/robot.mass) + (Math.pow(rCrossN, 2)/robot.moi);
                let j = -(1 + e) * velocityAlongNormal / impulseDenominator;

                robot.xV += (j * wallNormal.x) / robot.mass;
                robot.yV += (j * wallNormal.y) / robot.mass;
                robot.angleV += (rCrossN * j) / robot.moi;
            }
        }
    });

    // Debug info
    gamepadConnected = "connect?";
    if (gamepads[0]) {
        gamepadConnected = '<p style="color:green;">Connected!</p>';
    } else {
        gamepadConnected = '<p style="color:red;">Press Start to connect gamepad...</p>'
    }
    devInfo.innerHTML = gamepadConnected +
        "<br>pos: ("+floor(robot.x, 2)+","+floor(robot.y, 2)+")"+
        "<br>vel: ("+floor(robot.xV, 1)+","+floor(robot.yV, 1)+")"+
        "<br>rad: "+floor(robot.angle, 2);

    // Rotate robot
    ctx.clearRect(0, 0, width, height);
    ctx.translate(robot.x, robot.y);
    ctx.rotate(robot.angle);
    ctx.translate(-robot.x, -robot.y);

    // Draw
    ctx.fillStyle = "#000000";
    ctx.fillRect(robot.x-robot.halfWidth, robot.y-robot.halfHeight, robot.width, robot.height);

    // Rotate back, otherwise robot keeps spinning
    ctx.translate(robot.x, robot.y);
    ctx.rotate(-robot.angle);
    ctx.translate(-robot.x, -robot.y);

    requestAnimationFrame(update);
}

requestAnimationFrame(update);