import type { HistoryItem } from '../types';

const DB_NAME = 'TGlaciaDB';
const DB_VERSION = 1;
const STORE_NAME = 'history';

// This interface is for internal use within the DB service
interface StoredHistoryItem extends HistoryItem {
    userEmail: string;
}

let db: IDBDatabase;

const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        // If DB is already initialized, return it
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
            reject('Error opening database.');
        };

        request.onsuccess = (event) => {
            db = (event.target as IDBOpenDBRequest).result;
            resolve(db);
        };

        // This event is only triggered when the version changes.
        request.onupgradeneeded = (event) => {
            const dbInstance = (event.target as IDBOpenDBRequest).result;
            if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
                const store = dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id' });
                // Create an index on userEmail to allow efficient querying for a specific user's history.
                store.createIndex('userEmailIndex', 'userEmail', { unique: false });
            }
        };
    });
};

/**
 * Saves a history item to the IndexedDB.
 * @param userEmail The email of the user to associate the item with.
 * @param item The history item to save.
 */
export const saveHistoryItem = async (userEmail: string, item: HistoryItem): Promise<void> => {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const itemToStore: StoredHistoryItem = { ...item, userEmail };

    return new Promise((resolve, reject) => {
        // Use `put` to add or update the item.
        const request = store.put(itemToStore);
        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error("Failed to save history item:", request.error);
            reject(request.error);
        };
    });
};

/**
 * Retrieves all history items for a specific user.
 * @param userEmail The email of the user whose history is to be retrieved.
 * @returns A promise that resolves to an array of history items, sorted by newest first.
 */
export const getHistoryForUser = async (userEmail: string): Promise<HistoryItem[]> => {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('userEmailIndex');

    return new Promise((resolve, reject) => {
        // Use the index to get all items for the user.
        const request = index.getAll(userEmail);

        request.onsuccess = () => {
            // Sort by timestamp descending to show the newest items first.
            const sortedResult = request.result.sort((a, b) => b.timestamp - a.timestamp);
            resolve(sortedResult);
        };

        request.onerror = () => {
            console.error("Failed to get history:", request.error);
            reject(request.error);
        };
    });
};

/**
 * Deletes a history item from the IndexedDB by its ID.
 * @param itemId The unique ID of the history item to delete.
 */
export const deleteHistoryItem = async (itemId: string): Promise<void> => {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
        const request = store.delete(itemId);
        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error("Failed to delete history item:", request.error);
            reject(request.error);
        };
    });
};