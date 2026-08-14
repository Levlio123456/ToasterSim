import { Robot } from './robot.js';
import { vec2 } from './vector2.js';

const canvas = document.getElementById("gameCanvas");
const devInfo = document.getElementById("devInfo");
const ctx = canvas.getContext("2d");
const width = canvas.width;
const height = canvas.height;
var keys = {};
var gamepads = {};

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