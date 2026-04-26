// IndexedDB Storage Manager
class StorageManager {
    constructor() {
        this.db = null;
        this.dbName = 'ArcheryScorerDB';
        this.dbVersion = 1;
    }

    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject('Database failed to open');
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ Database opened successfully');
                resolve();
            };
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                
                if (!db.objectStoreNames.contains('scores')) {
                    const objectStore = db.createObjectStore('scores', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    objectStore.createIndex('name', 'name', { unique: false });
                    objectStore.createIndex('category', 'category', { unique: false });
                    objectStore.createIndex('gender', 'gender', { unique: false });
                    objectStore.createIndex('club', 'club', { unique: false });
                    objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                    console.log('📦 Database schema created');
                }
            };
        });
    }

    saveScore(scoreData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['scores'], 'readwrite');
            const objectStore = transaction.objectStore('scores');
            const request = objectStore.add(scoreData);

            request.onsuccess = () => {
                console.log('💾 Score saved:', scoreData.name);
                resolve(request.result);
            };

            request.onerror = () => reject(request.error);
        });
    }

    getAllScores() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['scores'], 'readonly');
            const objectStore = transaction.objectStore('scores');
            const request = objectStore.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    deleteScore(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['scores'], 'readwrite');
            const objectStore = transaction.objectStore('scores');
            const request = objectStore.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    clearAllScores() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['scores'], 'readwrite');
            const objectStore = transaction.objectStore('scores');
            const request = objectStore.clear();

            request.onsuccess = () => {
                console.log('🗑️ All scores cleared');
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }
}