const DB = (() => {
  const DB_NAME = projectName;
  const DB_VERSION = 1;
  const STORES = [{ name: "currentItems", options: { keyPath: "id", autoIncrement: true } }, { name: "settings" }];

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = function (event) {
        const db = event.target.result;
        STORES.forEach((store) => {
          if (!db.objectStoreNames.contains(store.name)) {
            db.createObjectStore(store.name, store.options);
          }
        });
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function getStore(storeName) {
    const db = await openDB();
    const tx = db.transaction(storeName, "readwrite");
    return tx.objectStore(storeName);
  }

  function handleRequest(callback) {
    return new Promise((resolve, reject) => {
      const request = callback();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function getItem(storeName, key) {
    const store = await getStore(storeName);
    return handleRequest(() => store.get(key));
  }

  async function getItems(storeName) {
    const store = await getStore(storeName);
    return handleRequest(() => store.getAll());
  }

  async function addItem(storeName, item, key) {
    const store = await getStore(storeName);
    return handleRequest(() => (key ? store.add(item, key) : store.add(item)));
  }

  async function putItem(storeName, item, key) {
    const store = await getStore(storeName);
    return handleRequest(() => (key ? store.put(item, key) : store.put(item)));
  }

  async function deleteItem(storeName, key) {
    const store = await getStore(storeName);
    return handleRequest(() => store.delete(key));
  }

  return { getItem, getItems, addItem, putItem, deleteItem };
})();
