/* eslint-disable no-restricted-globals */

// octreeWorker.js
let octree = null;

// Custom Octree class
class Octree {
    constructor(center, size) {
      this.center = center;
      this.size = size;
      this.children = [];
      this.objects = [];
      this.divided = false;
      this.boundingBox = new THREE.Box3().setFromCenterAndSize(this.center, new THREE.Vector3(this.size, this.size, this.size));
    }
  
    subdivide() {
      const { x, y, z } = this.center;
      const newSize = this.size / 2;
      const offset = newSize / 2;
  
      this.children = [
        new Octree(new THREE.Vector3(x - offset, y - offset, z - offset), newSize),
        new Octree(new THREE.Vector3(x + offset, y - offset, z - offset), newSize),
        new Octree(new THREE.Vector3(x - offset, y + offset, z - offset), newSize),
        new Octree(new THREE.Vector3(x + offset, y + offset, z - offset), newSize),
        new Octree(new THREE.Vector3(x - offset, y - offset, z + offset), newSize),
        new Octree(new THREE.Vector3(x + offset, y - offset, z + offset), newSize),
        new Octree(new THREE.Vector3(x - offset, y + offset, z + offset), newSize),
        new Octree(new THREE.Vector3(x + offset, y + offset, z + offset), newSize),
      ];
      this.divided = true;
    }
  
    insert(object) {
      if (!this.containsPoint(object.position)) return false;
  
      if (this.objects.length < 8 && !this.divided) {
        this.objects.push(object);
        return true;
      }
  
      if (!this.divided) this.subdivide();
  
      for (const child of this.children) {
        if (child.insert(object)) return true;
      }
  
      return false;
    }
  
    containsPoint(point) {
      return (
        point.x >= this.center.x - this.size / 2 &&
        point.x < this.center.x + this.size / 2 &&
        point.y >= this.center.y - this.size / 2 &&
        point.y < this.center.y + this.size / 2 &&
        point.z >= this.center.z - this.size / 2 &&
        point.z < this.center.z + this.size / 2
      );
    }
  
    intersectsFrustum(frustum) {
        return frustum.intersectsBox(this.boundingBox);
      }
    
      getVisibleOctants(frustum) {
        let count = 0;
        if (this.intersectsFrustum(frustum)) {
          count = 1;
          if (this.divided) {
            for (const child of this.children) {
              count += child.getVisibleOctants(frustum);
            }
          }
        }
        return count;
      }
    }
    
    self.onmessage = function(event) {
      const { type, octree: newOctree, frustum } = event.data;
    
      if (type === 'setOctree') {
        octree = new Octree(
          new THREE.Vector3(newOctree.center.x, newOctree.center.y, newOctree.center.z),
          newOctree.size
        );
        reconstructOctree(octree, newOctree);
      } else if (type === 'performCulling') {
        if (!octree) {
          self.postMessage({ type: 'visibleOctants', data: 0 });
          return;
        }
    
        const frustumObject = new Frustum();
        frustum.forEach((plane, index) => {
          frustumObject.planes[index] = new THREE.Plane(
            new THREE.Vector3(plane.normal.x, plane.normal.y, plane.normal.z),
            plane.constant
          );
        });
    
        const visibleOctants = octree.getVisibleOctants(frustumObject);
        self.postMessage({ type: 'visibleOctants', data: visibleOctants });
      }
    };
    
    function reconstructOctree(octree, data) {
      octree.objects = data.objects;
      octree.divided = data.divided;
    
      if (data.divided) {
        octree.children = data.children.map(childData => {
          const childOctree = new Octree(
            new THREE.Vector3(childData.center.x, childData.center.y, childData.center.z),
            childData.size
          );
          reconstructOctree(childOctree, childData);
          return childOctree;
        });
      }
    }
    
    class Frustum {
      constructor() {
        this.planes = Array(6).fill().map(() => new THREE.Plane());
      }
    
      intersectsBox(box) {
        return this.planes.every(plane => {
          const normal = plane.normal;
          const p = new THREE.Vector3(
            normal.x > 0 ? box.max.x : box.min.x,
            normal.y > 0 ? box.max.y : box.min.y,
            normal.z > 0 ? box.max.z : box.min.z
          );
          return plane.distanceToPoint(p) >= 0;
        });
      }
    }
    
    class THREE {
      static Vector3 = class Vector3 {
        constructor(x, y, z) {
          this.x = x;
          this.y = y;
          this.z = z;
        }
      }
    
      static Plane = class Plane {
        constructor(normal, constant) {
          this.normal = normal;
          this.constant = constant;
        }
    
        distanceToPoint(point) {
          return this.normal.x * point.x + this.normal.y * point.y + this.normal.z * point.z + this.constant;
        }
      }
    
      static Box3 = class Box3 {
        constructor(min, max) {
          this.min = min;
          this.max = max;
        }
    
        setFromCenterAndSize(center, size) {
          const halfSize = new THREE.Vector3(size.x / 2, size.y / 2, size.z / 2);
          this.min = new THREE.Vector3(center.x - halfSize.x, center.y - halfSize.y, center.z - halfSize.z);
          this.max = new THREE.Vector3(center.x + halfSize.x, center.y + halfSize.y, center.z + halfSize.z);
          return this;
        }
      }
    }