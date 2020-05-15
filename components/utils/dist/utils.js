"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getRandomSphericalCoords = getRandomSphericalCoords;
exports.setCameraToBoundingBox = setCameraToBoundingBox;
exports.setContent = setContent;
exports.showEdges = showEdges;
exports.setEdgeWidth = setEdgeWidth;
exports.setDashed = setDashed;
exports.setEdgeColor = setEdgeColor;

var THREE = _interopRequireWildcard(require("three"));

var _LineMaterial = require("three/examples/jsm/lines/LineMaterial.js");

var _LineSegmentsGeometry = require("three/examples/jsm/lines/LineSegmentsGeometry.js");

var _LineSegments = require("three/examples/jsm/lines/LineSegments2.js");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function getRandomSphericalCoords(radius) {
  var x = -1 + Math.random() * 2;
  var y = -1 + Math.random() * 2;
  var z = -1 + Math.random() * 2;
  var d = radius * 1 / Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));
  x *= d;
  y *= d;
  z *= d;
  return {
    x: x,
    y: y,
    z: z
  };
}

function setCameraToBoundingBox(camera, object) {
  var offset = 1.60;
  var boundingBox = new THREE.Box3();
  boundingBox.setFromObject(object);
  var center = boundingBox.getCenter();
  var size = boundingBox.getSize();
  var maxDim = Math.max(size.x, size.y, size.z);
  var fov = camera.fov * (Math.PI / 180);
  var cameraZ = maxDim / 2 / Math.tan(fov / 2);
  cameraZ *= offset;
  camera.position.z = center.z + cameraZ;
  var minZ = boundingBox.min.z;
  var cameraToFarEdge = minZ < 0 ? -minZ + cameraZ : cameraZ - minZ;
  camera.far = cameraToFarEdge * 3;
  camera.lookAt(center);
  camera.updateProjectionMatrix();
}

function setContent(object, camera, controls, width, height, offset) {
  var box = new THREE.Box3().setFromObject(object);
  var size = box.getSize(new THREE.Vector3()).length();
  var center = box.getCenter(new THREE.Vector3());
  camera.near = size / 10;
  camera.far = size * 10;
  camera.updateProjectionMatrix();
  camera.position.copy(center);
  camera.lookAt(center);

  if (offset) {
    camera.position.set(offset.x, offset.y, offset.z);
  } else {
    camera.position.z += size;
  }

  if (controls) {
    controls.target.copy(center);
    controls.minDistance = size / 10;
    controls.maxDistance = size * 10;
  }
}

var material = new _LineMaterial.LineMaterial({
  color: 'black',
  linewidth: 1,
  // in pixels
  resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
  // to be set by renderer, eventually
  dashed: false
});

function showEdges(mesh) {
  var edges = new THREE.EdgesGeometry(mesh.geometry, 45);
  var geometry = new _LineSegmentsGeometry.LineSegmentsGeometry().fromEdgesGeometry(edges);
  var lines = new _LineSegments.LineSegments2(geometry, material);
  mesh.add(lines);
}

function setEdgeWidth(width) {
  material.linewidth = width;
}

function setDashed(dashed) {
  material.dashed = dashed;
}

function setEdgeColor(color) {
  material.color.set(color);
}

//# sourceMappingURL=utils.js.map