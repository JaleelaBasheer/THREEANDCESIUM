export const setupDatabase = () => {
    const dbName = "fbx-files-db";
    const dbVersion = 1;
  
    const request = indexedDB.open(dbName, dbVersion);
  
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("files")) {
        const store = db.createObjectStore("files", { keyPath: "name" });
        store.createIndex("priority", "priority");
      }
    };
  
    request.onsuccess = () => {
      console.log("Database setup complete.");
    };
  
    request.onerror = (event) => {
      console.error("Database setup error:", event.target.errorCode);
    };
  };
  
  export const clearDatabase = () => {
    const dbName = "fbx-files-db";
  
    const request = indexedDB.deleteDatabase(dbName);
  
    request.onsuccess = () => {
      console.log("Database cleared successfully.");
    };
  
    request.onerror = (event) => {
      console.error("Error clearing the database:", event.target.errorCode);
    };
  };
  