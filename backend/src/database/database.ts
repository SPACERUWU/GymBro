import sqlite3 from 'sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

const DATABASE_PATH = process.env.DATABASE_PATH || './gymbro.db';

class Database {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database(DATABASE_PATH);
    this.initializeDatabase();
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
