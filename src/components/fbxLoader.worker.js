/* eslint-disable no-restricted-globals */
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";

/* global self */

self.onmessage = function (event) {
  const { fileData, fileName } = event.data;

  try {
    const loader = new FBXLoader();
    const object = loader.parse(fileData);

    if (!object) {
      self.postMessage({
        type: "error",
        error: "Parsed object is undefined",
        fileName,
      });
      return;
    }

    const simplifiedObject = simplifyObject(object);

    self.postMessage({
      type: "loaded",
      object: simplifiedObject,
      fileName,
    });
  } catch (error) {
    self.postMessage({
      type: "error",
      error: error.message,
      fileName,
    });
  }
};

function simplifyObject(object) {
  // Simplification logic
  return traverseObject(object);
}

function traverseObject(object) {
  const children = [];

  object.children.forEach((child) => {
    children.push(traverseObject(child));
  });

  return {
    type: object.type,
    name: object.name,
    position: object.position.toArray(),
    quaternion: object.quaternion.toArray(),
    scale: object.scale.toArray(),
    geometry: object.geometry
      ? {
          attributes: {
            position: object.geometry.attributes.position
              ? object.geometry.attributes.position.array
              : null,
            normal: object.geometry.attributes.normal
              ? object.geometry.attributes.normal.array
              : null,
            uv: object.geometry.attributes.uv
              ? object.geometry.attributes.uv.array
              : null,
          },
          index: object.geometry.index ? object.geometry.index.array : null,
        }
      : null,
    material: object.material
      ? {
          color: object.material.color ? object.material.color.getHex() : null,
          map: object.material.map ? object.material.map.image.src : null,
        }
      : null,
    children,
  };
}
