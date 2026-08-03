const canvas = document.getElementById("gameCanvas");
const devInfo = document.getElementById("devInfo");
const ctx = canvas.getContext("2d");
const width = 318;
const height = 651;
const e = .1; // Wall bounciness
const linearDrag = .99;
const angularDrag = .8;
var keys = {};
var gamepads = {};
var gamepad1 = null;

const startPos = {x: Math.floor(width/2), y:Math.floor(height/2)};

const vec2 = {
    add: (v1, v2) => ({x:v1.x+v2.x,y:v1.y+v2.y}),
    sub: (v1, v2) => ({x:v1.x-v2.x,y:v1.y-v2.y}),
    mult: (vec, norm) => ({x:vec.x*norm,y:vec.y*norm}),
    dot: (v1, v2) => v1.x*v2.x  + v1.y*v2.y,
    cross: (v1, v2) => v1.x*v2.y - v1.y*v2.x,
    magSqr: (vec) => Math.pow(vec.x, 2) + Math.pow(vec.y, 2),
    norm: (vec) => {
        let len = Math.sqrt(Math.pow(vec.x, 2) + Math.pow(vec.y, 2));
        return len === 0 ? {x:0,y:0} : {x:vec.x/len,y:vec.y/len};
    },
    perp: (vec) => ({x:-vec.y,y:vec.x})
}

// Base rectangle class for physics
class Rectangle {
    constructor(pos, width, height, mass, fixed) {
        this.pos = pos;
        this.width = width;
        this.height = height;
        this.halfWidth = width/2;
        this.halfHeight = height/2;
        this.mass = mass;
        this.invMass = mass === 0 ? 0 : 1/mass;
        this.velocity = {x:0,y:0};
        this.angle = 0;
        this.angularV = 0;
        this.inertia = (1/12) * mass * (Math.pow(width, 2) + Math.pow(height, 2));
        this.invInertia = this.inertia === 0 ? 0 : 1/this.inertia;
        this.fixed = fixed;
    }

    getVertices() {
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);

        let offsets = [
            {x:-this.halfWidth, y:-this.halfHeight},
            {x:this.halfWidth, y:-this.halfHeight},
            {x:this.halfWidth, y:this.halfHeight},
            {x:-this.halfWidth, y:this.halfHeight}
        ]

        // Loops through every object in the array and applies new value
        return offsets.map(local => ({
            x: this.pos.x + (local.x * cos - local.y * sin),
            y: this.pos.y + (local.x * sin + local.y * cos)
        }));
    }

    update(deltaTime) {
        if (this.mass === 0 || this.fixed) {return} // 0 mass is static

        this.pos = vec2.add(this.pos, vec2.mult(this.velocity, deltaTime));
        this.angle += this.angularV * deltaTime;
    }

    draw() {
        const vertices = this.getVertices();
        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < vertices.length; i++) {
            ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw center point orientation notch
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
    }
}

function projectObject(vertices, axis) {
    let min = vec2.dot(vertices[0], axis);
    let max = min;
    vertices.forEach((vertex) => {
        let p = vec2.dot(vertex, axis);
        if (p < min) {min = p;}
        if (p > max) {max = p;}
    });

    return {min,max};
}

function satCollision(object1, object2) {
    const vertices1 = object1.getVertices();
    const vertices2 = object2.getVertices();
    let overlap = Infinity;
    let collisionNormal = null;

    const axes = [
        vec2.norm(vec2.perp(vec2.sub(vertices1[1],vertices1[0]))),
        vec2.norm(vec2.perp(vec2.sub(vertices1[2],vertices1[1]))),
        vec2.norm(vec2.perp(vec2.sub(vertices2[1],vertices2[0]))),
        vec2.norm(vec2.perp(vec2.sub(vertices2[2],vertices2[1])))
    ];

    for (let axis of axes) {
        const projection1 = projectObject(vertices1, axis);
        const projection2 = projectObject(vertices2, axis);

        if (projection1.max < projection2.min || projection2.max < projection1.min) {return null}

        let currentOverlap = Math.min(projection1.max, projection2.max) - Math.max(projection1.min, projection2.min);
        if (currentOverlap < overlap) {
            overlap = currentOverlap;
            collisionNormal = axis;
        }
    }

    if (!collisionNormal) {return null;}

    const dir = vec2.sub(object2.pos, object1.pos);
    if (vec2.dot(collisionNormal, dir) < 0) {
        collisionNormal = vec2.mult(collisionNormal, -1);
    }

    let contactPoint = {x:0,y:0};
    let deepestPenetration = -Infinity;

    vertices1.forEach((vertex) => {
        let distance = vec2.dot(vec2.sub(vertex, object2.pos), collisionNormal);
        if (distance > deepestPenetration) {
            deepestPenetration = distance;
            contactPoint = vertex;
        }
    });

    vertices2.forEach((vertex) => {
        let distance = vec2.dot(vec2.sub(object1.pos, vertex), collisionNormal);
        if (distance > deepestPenetration) {
            deepestPenetration = distance;
            contactPoint = vertex;
        }
    });

    return {normal:collisionNormal,depth:overlap,point:contactPoint};
}

function resolveCollision(object1, object2, manifold) {
    const {normal,depth,point} = manifold;

    const resolvePercent = 0.8;
    const slop = 0.01;
    const correctionMagnitude = Math.max(0, depth - slop) / (object1.invMass+object2.invMass) * resolvePercent;
    const correctionVector = vec2.mult(normal, correctionMagnitude);

    object1.pos = vec2.sub(object1.pos, vec2.mult(correctionVector, object1.invMass));
    object2.pos = vec2.add(object2.pos, vec2.mult(correctionVector, object2.invMass));

    const impulse1 = vec2.sub(point, object1.pos);
    const impulse2 = vec2.sub(point, object2.pos);

    const angularV1 = {x:-object1.angularV * impulse1.y,y:object1.angularV * impulse1.x};
    const angularV2 = {x:-object2.angularV * impulse2.y,y:object2.angularV * impulse2.x};

    const totalVelocity1 = vec2.add(object1.velocity, angularV1);
    const totalVelocity2 = vec2.add(object2.velocity, angularV2);
    const relativeVelocity = vec2.sub(totalVelocity2, totalVelocity1);

    const velocityAlongNormal = vec2.dot(relativeVelocity, normal);

    if (velocityAlongNormal > 0) {return;}

    const rCrossN1 = vec2.cross(impulse1, normal);
    const rCrossN2 = vec2.cross(impulse2, normal);

    const impulseDenominator = object1.invMass + object2.invMass +
        Math.pow(rCrossN1, 2) * object1.invInertia +
        Math.pow(rCrossN2, 2) * object2.invInertia;

    let j = -(1 + e) * velocityAlongNormal;
    j /= impulseDenominator;

    const impulse = vec2.mult(normal, j);

    object1.velocity = vec2.sub(object1.velocity, vec2.mult(impulse, object1.invMass));
    object2.velocity = vec2.add(object2.velocity, vec2.mult(impulse, object2.invMass));

    object1.angularV -= vec2.cross(impulse1, impulse) * object1.invInertia;
    object2.angularV += vec2.cross(impulse2, impulse) * object2.invInertia;
}

function drawVector(pos, vector, color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(pos.x+vector.x,pos.y+vector.y);
    ctx.stroke();
    ctx.lineWidth = 0;
}

function reset() {
}

function floor(num, dec) {
    return Math.floor(num*Math.pow(10, dec))/Math.pow(10, dec);
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
    console.log("CONNECTED AT %d: %s",
    e.gamepad.index,
    e.gamepad.id
  );
  gamepads[e.gamepad.index] = true;
});
window.addEventListener('gamepaddisconnected', (e) => {
    gamepads[e.gamepad.index] = false;
});

const test1 = new Rectangle({x:50,y:50},36,36,1.5,false);
test1.velocity = {x:100,y:0};
test1.angularV = -.1;
const test2 = new Rectangle({x:200,y:50},36,36,1.5,false);
test2.velocity = {x:-25,y:0};
test2.angularV = .3;
/**
 * Update Loop
 */

var lastTime = performance.now();
function update(time) {
    var deltaTime = (time - lastTime)/1000;
    lastTime = time;
    if (deltaTime > .1) {deltaTime = .1;} // Anti lag-spike

    // Controller movement
    if (gamepads[0]) {
        gamepad1 = navigator.getGamepads()[0];
        if (gamepad1.buttons[9].pressed) {
            reset();
        }
    }

    test1.update(deltaTime);
    test2.update(deltaTime);

    const manifold = satCollision(test1, test2);
    if (manifold) {
        resolveCollision(test1, test2, manifold);
    }

    // Debug info
    gamepadConnected = "connect?";
    if (gamepads[0]) {
        gamepadConnected = '<p style="color:green;">Connected!</p>';
    } else {
        gamepadConnected = '<p style="color:red;">Press Any Button to connect gamepad...</p>'
    }
    // devInfo.innerHTML = gamepadConnected +
    //     "<br>pos: ("+floor(robot.x, 2)+","+floor(robot.y, 2)+")"+
    //     "<br>vel: ("+floor(robot.xV, 1)+","+floor(robot.yV, 1)+")"+
    //     "<br>rad: "+floor(robot.angle, 2) +
    //     "<br>radVel: "+floor(robot.angularV, 2);

    ctx.clearRect(0, 0, width, height);
    test1.draw();
    test2.draw();

    requestAnimationFrame(update);
}

requestAnimationFrame(update);