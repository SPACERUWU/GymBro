import sqlite3 from 'sqlite3';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

// Use persistent storage path for production, local path for development
// Fallback to local path if persistent storage is not available
let DATABASE_PATH = process.env.DATABASE_PATH || './gymbro.db';

if (process.env.NODE_ENV === 'production') {
  try {
    // Try to use persistent storage path
    const persistentPath = '/app/data/gymbro.db';
    const dbDir = dirname(persistentPath);
    mkdirSync(dbDir, { recursive: true });
    DATABASE_PATH = persistentPath;
    console.log('Using persistent storage:', DATABASE_PATH);
  } catch (err) {
    // Fallback to local path if persistent storage fails
    DATABASE_PATH = './gymbro.db';
    console.log('Persistent storage not available, using local path:', DATABASE_PATH);
  }
}

class Database {
  private db: sqlite3.Database;

  constructor() {
    // Ensure directory exists for database file
    const dbDir = dirname(DATABASE_PATH);
    try {
      mkdirSync(dbDir, { recursive: true });
      console.log('Database directory created/verified:', dbDir);
    } catch (err) {
      console.warn('Could not create database directory:', err);
      // Continue anyway, directory might already exist
    }
    
    try {
      this.db = new sqlite3.Database(DATABASE_PATH);
      console.log('Database connection established:', DATABASE_PATH);
      this.initializeDatabase();
    } catch (err) {
      console.error('Failed to create database connection:', err);
      throw err;
    }
  }

  private initializeDatabase() {
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    
    this.db.exec(schema, (err) => {
      if (err) {
        console.error('Error initializing database:', err);
      } else {
        console.log('Database initialized successfully');
      }
    });
  }

  // Generic query method
  query(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Generic run method for INSERT, UPDATE, DELETE
  run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  // Get single row
  get(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  close() {
    this.db.close();
  }
}

export default new Database();
