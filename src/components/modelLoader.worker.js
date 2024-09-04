// /* eslint-disable no-restricted-globals */
// self.onmessage = function(e) {
//     const { type, data } = e.data;
//     console.log(data);
    
//     switch (type) {
//       case 'loadMesh':
//         // Simulate loading a mesh (replace with actual loading logic)
//         setTimeout(() => {
//           self.postMessage({ type: 'meshLoaded', data: { id: data.id, priority: data.priority } });
//         }, Math.random() * 1000);
//         break;
//       // Add more cases as needed
//     }
//   };
// priorityWorker.js
/* eslint-disable no-restricted-globals */

self.onmessage = function(e) {
  const { action, meshData } = e.data;
  
  if (action === 'load') {
    // Simulate loading a mesh (you'll need to implement actual loading logic)
    setTimeout(() => {
      self.postMessage({ action: 'loaded', meshData });
    }, 100); // Simulating some processing time
  } else if (action === 'unload') {
    // Simulate unloading a mesh
    setTimeout(() => {
      self.postMessage({ action: 'unloaded', meshData });
    }, 50); // Simulating some processing time
  }
};