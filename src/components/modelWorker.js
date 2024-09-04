/* eslint-disable no-restricted-globals */
self.onmessage = function(e) {
    const { type, data } = e.data;
    console.log(data);
    
    switch (type) {
      case 'loadMesh':
        // Simulate loading a mesh (replace with actual loading logic)
        setTimeout(() => {
          self.postMessage({ type: 'meshLoaded', data: { id: data.id, priority: data.priority } });
        }, Math.random() * 1000);
        break;
      // Add more cases as needed
    }
  };