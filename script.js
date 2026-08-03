const canvas = document.getElementById("gameCanvas");
const devInfo = document.getElementById("devInfo");
const ctx = canvas.getContext("2d");
const width = 318;
const height = 651;
var keys = {};
var gamepads = {};

// Vector 2 utilities
const vec2 = {
    add: (v1, v2) => ({x:v1.x+v2.x,y:v1.y+v2.y}),
    sub: (v1, v2) => ({x:v1.x-v2.x,y:v1.y-v2.y}),
    mult: (vec, norm) => ({x:vec.x*norm,y:vec.y*norm}),
    dot: (v1, v2) => v1.x*v2.x  + v1.y*v2.y,
    cross: (v1, v2) => v1.x*v2.y - v1.y*v2.x,
    magSqr: (vec) => Math.pow(vec.x, 2) + Math.pow(vec.y, 2),
    normalize: (vec) => {
        let len = Math.sqrt(Math.pow(vec.x, 2) + Math.pow(vec.y, 2));
        return len === 0 ? {x:0,y:0} : {x:vec.x/len,y:vec.y/len};
    },
    perpendicular: (vec) => ({x:-vec.y,y:vec.x})
}

// Input
document.addEventListener('keydown', (e) => {
    console.log("KEY DOWN: %s", e.code);
    keys[e.code] = true;
});
document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});
window.addEventListener('gamepadconnected', (e) => {
    console.log("CONNECTED AT %d: %s",e.gamepad.index,e.gamepad.id);
    gamepads[e.gamepad.index] = true;
});
window.addEventListener('gamepaddisconnected', (e) => {
    gamepads[e.gamepad.index] = false;
});



/**
 * Update Loop
 */
var lastTime = performance.now();
function update(time) {
    var deltaTime = (time - lastTime)/1000;
    lastTime = time;
    if (deltaTime > .1) {deltaTime = .1;} // Anti lag-spike

    ctx.clearRect(0, 0, width, height);

    requestAnimationFrame(update);
}

requestAnimationFrame(update);