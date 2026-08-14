import { vec2 } from './vector2.js';

jsonDefaultConstruct = {
	"number": "0000",
	"name": "default",
	"accel": -1,
	"angularAccel": -1,
	"attachments": [
		{
			"id": "bumper",
			"width": -1,
			"height": -1,
			"color": "ffffff",
			"holes": []
		}
	]
}

export class Robot {
	constructor(pos, angle, width, height, color) {
		this.pos = pos;
		this.angle = angle;
		this.width = width;
		this.height = height;
		this.halfWidth = width/2;
		this.halfHeight = height/2;
		this.color = color;

		this.velocity = vec2.new(0, 0);
		this.force = vec2.new(0, 0);
		this.angularVel = 0;
		this.angularForce = 0;
	}

	render() {

	}
}