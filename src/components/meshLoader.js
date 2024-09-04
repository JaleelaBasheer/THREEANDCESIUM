/* eslint-disable no-restricted-globals */
self.onmessage = function(e) {
    const { action, meshData } = e.data;
    if (action === 'load') {
      // Simulate loading time based on priority
      const loadTime = meshData.priority === 'inFrustum' ? 0 : 
                       meshData.priority === 'priority1' ? 100 : 
                       200;
  
      setTimeout(() => {
        self.postMessage({
          action: 'loaded',
          meshData: { id: meshData.id }
        });
      }, loadTime);
    }
  };