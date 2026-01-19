// Utility to get the correct SQLite database path for all uses (main DB and session store)
import fs from 'fs';
import path from 'path';

export function getDatabasePath() {
  // Use DATABASE_PATH environment variable if set
  if (process.env.DATABASE_PATH) {
    const dbPath = process.env.DATABASE_PATH;
    const dbDir = path.dirname(dbPath);
    
    try {
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      // Check if directory is writable
      fs.accessSync(dbDir, fs.constants.W_OK);
      return dbPath;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('DATABASE_PATH not writable, using fallback:', error);
      }
      // Fallback to default
    }
  }

  // Default paths based on environment
  if (process.env.NODE_ENV === 'production') {
    // Try Fly.io volume mount path first
    const flyVolumePath = '/app/data/paidin.db';
    const flyVolumeDir = path.dirname(flyVolumePath);
    
    console.log(`🔍 Checking Fly.io volume path: ${flyVolumeDir}`);
    try {
      if (!fs.existsSync(flyVolumeDir)) {
        console.log(`📁 Creating Fly.io volume directory: ${flyVolumeDir}`);
        fs.mkdirSync(flyVolumeDir, { recursive: true });
        console.log(`✅ Created directory: ${flyVolumeDir}`);
      } else {
        console.log(`✅ Directory exists: ${flyVolumeDir}`);
      }
      
      // Check if directory is writable
      fs.accessSync(flyVolumeDir, fs.constants.W_OK);
      console.log(`✅ Directory is writable: ${flyVolumeDir}`);
      console.log(`📂 Using database path: ${flyVolumePath}`);
      return flyVolumePath;
    } catch (error: any) {
      console.error('❌ Fly.io volume path not available:', error.message);
      console.error('   Attempted path:', flyVolumePath);
      console.error('   Directory exists:', fs.existsSync(flyVolumeDir));
      // Fallback to current directory if volume mount doesn't work
      const fallbackPath = './paidin.db';
      console.log(`⚠️  Falling back to: ${fallbackPath}`);
      return fallbackPath;
    }
  }

  // Development: use local path
  return 'paidin.db';
} 