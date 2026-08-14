export const vec2 = {
    new: (vX, vY) => {x=vX, y=vY},
    add: (v1, v2) => {x=v1.x+v2.x,y=v1.y+v2.y},
    sub: (v1, v2) => {x=v1.x-v2.x,y=v1.y-v2.y},
    mult: (vec, norm) => {x=vec.x*norm,y=vec.y*norm},
    dot: (v1, v2) => v1.x*v2.x  + v1.y*v2.y,
    cross: (v1, v2) => v1.x*v2.y - v1.y*v2.x,
    magSqr: (vec) => Math.pow(vec.x, 2) + Math.pow(vec.y, 2),
    normalize: (vec) => {
        let len = Math.sqrt(Math.pow(vec.x, 2) + Math.pow(vec.y, 2));
        return len === 0 ? {x=0,y=0} : {x=vec.x/len,y=vec.y/len};
    },
    perpendicular: (vec) => {x=-vec.y,y=vec.x},
    distance: (v1, v2) => Math.sqrt(Math.pow(v2.x-v1.x, 2) + Math.pow(v2.y-v1.y, 2)),
		output: (vec) => "("+vec.x+","+vec.y+")"
}