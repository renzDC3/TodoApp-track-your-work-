// src/db.js
import Dexie from 'dexie';

// 1. Create a new database instance
export const db = new Dexie('TodoDatabase');

// 2. Define your tables and the data you want to index
db.version(1).stores({
  tasks: '++id, title' // ++id means auto-incrementing ID. 'title' makes it searchable.
});