/* eslint-disable no-restricted-globals */

self.onmessage = function (e) {
    const { boxPositions, cameraPosition } = e.data;
    const level1 = [], level2 = [], level3 = [];
  
    boxPositions.forEach((position, index) => {
      const distance = Math.sqrt(
        (position.x - cameraPosition[0]) ** 2 +
        (position.y - cameraPosition[1]) ** 2 +
        (position.z - cameraPosition[2]) ** 2
      );
  
      console.log(`Box ${index} at position:`, position, 'Distance from camera:', distance);
  
      if (distance < 20) {
        level1.push(index);
      } else if (distance < 100) {
        level2.push(index);
      } else {
        level3.push(index);
      }
    });
  
    self.postMessage({ level1, level2, level3 });
  };
  