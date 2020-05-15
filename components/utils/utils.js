import * as THREE from 'three'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';

export function getRandomSphericalCoords(radius){
    var x = -1 + Math.random() * 2;
    var y = -1 + Math.random() * 2;
    var z = -1 + Math.random() * 2;
    const d = radius * 1 / Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));
    x*=d
    y*=d
    z*=d
    return {x:x,y:y,z:z}
}

export function setCameraToBoundingBox(camera, object){

    let offset = 1.60;
    const boundingBox = new THREE.Box3();
    boundingBox.setFromObject(object);
    const center = boundingBox.getCenter();
    const size = boundingBox.getSize();
    const maxDim = Math.max( size.x, size.y, size.z );
    const fov = camera.fov * ( Math.PI / 180 );
    let cameraZ = maxDim / 2 / Math.tan( fov / 2 );
    cameraZ *= offset;
    camera.position.z = center.z + cameraZ;
    const minZ = boundingBox.min.z;
    const cameraToFarEdge = ( minZ < 0 ) ? -minZ + cameraZ : cameraZ - minZ;

    camera.far = cameraToFarEdge * 3;
    camera.lookAt(center);
    camera.updateProjectionMatrix();

}

export function setContent(object, camera, controls, width, height, offset){
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3()).length();
    const center = box.getCenter(new THREE.Vector3());

    camera.near = size / 10;
    camera.far = size * 10;
    camera.updateProjectionMatrix();

    camera.position.copy(center);
    camera.lookAt(center);

    if(offset) {
        camera.position.set(offset.x, offset.y, offset.z)
    } else {
        camera.position.z += size
    }

    if(controls){
        controls.target.copy(center)
        controls.minDistance = size / 10;
        controls.maxDistance = size * 10;
    }
}

var material =  new LineMaterial( {
        color: 'black',
        linewidth: 1, // in pixels
        resolution:  new THREE.Vector2(window.innerWidth, window.innerHeight),// to be set by renderer, eventually
        dashed: false
} );

export function showEdges(mesh){
    let edges = new THREE.EdgesGeometry( mesh.geometry, 45 );
    let geometry = new LineSegmentsGeometry().fromEdgesGeometry( edges );
    let lines = new LineSegments2(geometry, material);
    mesh.add(lines); 
}

export function setEdgeWidth(width){
    material.linewidth = width;
}

export function setDashed(dashed){
    material.dashed = dashed
}

export function setEdgeColor(color){
    material.color.set(color)
}