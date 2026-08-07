// services/backup.service.js
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');
const { logger } = require('../middleware/logger');
const { AuditLog } = require('../models/AuditLog');
const cron = require('node-cron');
const AWS = require('aws-sdk');

const execPromise = promisify(exec);

class BackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '../backups');
    this.ensureBackupDirectory();
    this.initializeS3();
    this.scheduleBackups();
  }

  // Ensure backup directory exists
  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  // Initialize S3 for cloud backups
  initializeS3() {
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1'
      });
      this.s3Bucket = process.env.AWS_S3_BUCKET;
      logger.info('S3 backup initialized');
    }
  }

  // Schedule automatic backups
  scheduleBackups() {
    // Daily backup at 2 AM
    cron.schedule('0 2 * * *', async () => {
      logger.info('Starting scheduled daily backup');
      await this.createBackup('daily');
    });

    // Weekly backup on Sunday at 3 AM
    cron.schedule('0 3 * * 0', async () => {
      logger.info('Starting scheduled weekly backup');
      await this.createBackup('weekly');
    });

    // Monthly backup on 1st at 4 AM
    cron.schedule('0 4 1 * *', async () => {
      logger.info('Starting scheduled monthly backup');
      await this.createBackup('monthly');
    });
  }

  // Create backup
  async createBackup(type = 'manual') {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `backup_${type}_${timestamp}`;
      const backupPath = path.join(this.backupDir, backupName);
      
      // Create backup directory
      fs.mkdirSync(backupPath, { recursive: true });

      // Backup MongoDB
      await this.backupMongoDB(backupPath);

      // Backup files
      await this.backupFiles(backupPath);

      // Compress backup
      const compressedPath = await this.compressBackup(backupPath);

      // Upload to cloud (if configured)
      if (this.s3) {
        await this.uploadToCloud(compressedPath, backupName);
      }

      // Clean up old backups
      await this.cleanupOldBackups();

      // Log backup
      await AuditLog.logAction({
        action: 'backup',
        resource: 'system',
        details: {
          type,
          name: backupName,
          path: compressedPath,
          size: this.getFileSize(compressedPath)
        },
        status: 'success'
      });

      logger.info(`Backup completed: ${backupName}`);
      return {
        success: true,
        name: backupName,
        path: compressedPath
      };
    } catch (error) {
      logger.error('Backup error:', error);
      
      await AuditLog.logAction({
        action: 'backup',
        resource: 'system',
        details: {
          type,
          error: error.message
        },
        status: 'failure',
        severity: 'critical'
      });

      throw error;
    }
  }

  // Backup MongoDB
  async backupMongoDB(backupPath) {
    try {
      const dbName = process.env.MONGODB_DB || 'emergency_system';
      const uri = process.env.MONGODB_URI;

      if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
        // Local MongoDB - use mongodump
        const command = `mongodump --db ${dbName} --out ${backupPath}/mongodb`;
        await execPromise(command);
      } else {
        // Remote MongoDB - use mongoose connection
        const collections = await mongoose.connection.db.listCollections().toArray();
        const dataDir = path.join(backupPath, 'mongodb');
        fs.mkdirSync(dataDir, { recursive: true });

        for (const collection of collections) {
          const collectionName = collection.name;
          const documents = await mongoose.connection.db
            .collection(collectionName)
            .find()
            .toArray();
          
          const filePath = path.join(dataDir, `${collectionName}.json`);
          fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));
        }
      }
    } catch (error) {
      logger.error('MongoDB backup error:', error);
      throw error;
    }
  }

  // Backup files
  async backupFiles(backupPath) {
    try {
      const filesDir = path.join(backupPath, 'files');
      fs.mkdirSync(filesDir, { recursive: true });

      // Backup uploads
      const uploadsDir = path.join(__dirname, '../uploads');
      if (fs.existsSync(uploadsDir)) {
        const uploadsBackup = path.join(filesDir, 'uploads');
        fs.cpSync(uploadsDir, uploadsBackup, { recursive: true });
      }

      // Backup logs
      const logsDir = path.join(__dirname, '../logs');
      if (fs.existsSync(logsDir)) {
        const logsBackup = path.join(filesDir, 'logs');
        fs.cpSync(logsDir, logsBackup, { recursive: true });
      }

      // Backup config
      const configDir = path.join(__dirname, '../config');
      if (fs.existsSync(configDir)) {
        const configBackup = path.join(filesDir, 'config');
        fs.cpSync(configDir, configBackup, { recursive: true });
      }
    } catch (error) {
      logger.error('Files backup error:', error);
      throw error;
    }
  }

  // Compress backup
  async compressBackup(backupPath) {
    try {
      const dirName = path.basename(backupPath);
      const parentDir = path.dirname(backupPath);
      const compressedFile = path.join(parentDir, `${dirName}.tar.gz`);

      const command = `tar -czf "${compressedFile}" -C "${parentDir}" "${dirName}"`;
      await execPromise(command);

      // Remove uncompressed directory
      fs.rmSync(backupPath, { recursive: true, force: true });

      return compressedFile;
    } catch (error) {
      logger.error('Compression error:', error);
      throw error;
    }
  }

  // Upload to cloud
  async uploadToCloud(filePath, backupName) {
    try {
      if (!this.s3 || !this.s3Bucket) {
        logger.warn('S3 not configured, skipping cloud upload');
        return;
      }

      const fileContent = fs.readFileSync(filePath);
      const key = `backups/${backupName}.tar.gz`;

      const params = {
        Bucket: this.s3Bucket,
        Key: key,
        Body: fileContent,
        ContentType: 'application/gzip',
        StorageClass: 'STANDARD_IA'
      };

      const result = await this.s3.upload(params).promise();
      logger.info(`Backup uploaded to S3: ${result.Location}`);
      
      return result;
    } catch (error) {
      logger.error('S3 upload error:', error);
      throw error;
    }
  }

  // Restore backup
  async restoreBackup(backupFile) {
    try {
      // Download from cloud if not exists locally
      if (!fs.existsSync(backupFile) && this.s3) {
        const key = `backups/${path.basename(backupFile)}`;
        const params = {
          Bucket: this.s3Bucket,
          Key: key
        };
        const data = await this.s3.getObject(params).promise();
        fs.writeFileSync(backupFile, data.Body);
      }

      if (!fs.existsSync(backupFile)) {
        throw new Error('Backup file not found');
      }

      // Extract backup
      const extractDir = path.join(this.backupDir, 'restore');
      fs.mkdirSync(extractDir, { recursive: true });

      const command = `tar -xzf "${backupFile}" -C "${extractDir}"`;
      await execPromise(command);

      // Find extracted directory
      const extractedDirs = fs.readdirSync(extractDir);
      if (extractedDirs.length === 0) {
        throw new Error('No data found in backup');
      }

      const backupDataDir = path.join(extractDir, extractedDirs[0]);

      // Restore MongoDB
      await this.restoreMongoDB(backupDataDir);

      // Restore files
      await this.restoreFiles(backupDataDir);

      // Clean up
      fs.rmSync(extractDir, { recursive: true, force: true });

      await AuditLog.logAction({
        action: 'restore',
        resource: 'system',
        details: {
          backupFile: path.basename(backupFile)
        },
        status: 'success',
        severity: 'critical'
      });

      logger.info('Restore completed successfully');
      return { success: true };
    } catch (error) {
      logger.error('Restore error:', error);
      
      await AuditLog.logAction({
        action: 'restore',
        resource: 'system',
        details: {
          error: error.message
        },
        status: 'failure',
        severity: 'critical'
      });

      throw error;
    }
  }

  // Restore MongoDB
  async restoreMongoDB(backupDataDir) {
    const mongoDir = path.join(backupDataDir, 'mongodb');
    if (!fs.existsSync(mongoDir)) {
      throw new Error('MongoDB backup not found');
    }

    // Check if it's a mongodump output
    const collections = fs.readdirSync(mongoDir);
    const isDumpFormat = collections.some(file => file.endsWith('.bson'));

    if (isDumpFormat) {
      // Use mongorestore
      const command = `mongorestore --drop --dir "${mongoDir}"`;
      await execPromise(command);
    } else {
      // JSON format
      const db = mongoose.connection.db;
      const jsonFiles = fs.readdirSync(mongoDir).filter(file => file.endsWith('.json'));

      for (const file of jsonFiles) {
        const collectionName = path.basename(file, '.json');
        const data = JSON.parse(fs.readFileSync(path.join(mongoDir, file), 'utf8'));
        
        const collection = db.collection(collectionName);
        await collection.deleteMany({});
        if (data.length > 0) {
          await collection.insertMany(data);
        }
      }
    }
  }

  // Restore files
  async restoreFiles(backupDataDir) {
    const filesDir = path.join(backupDataDir, 'files');
    if (!fs.existsSync(filesDir)) {
      return; // No files to restore
    }

    // Restore uploads
    const uploadsBackup = path.join(filesDir, 'uploads');
    if (fs.existsSync(uploadsBackup)) {
      const uploadsDir = path.join(__dirname, '../uploads');
      fs.rmSync(uploadsDir, { recursive: true, force: true });
      fs.cpSync(uploadsBackup, uploadsDir, { recursive: true });
    }

    // Restore logs
    const logsBackup = path.join(filesDir, 'logs');
    if (fs.existsSync(logsBackup)) {
      const logsDir = path.join(__dirname, '../logs');
      fs.rmSync(logsDir, { recursive: true, force: true });
      fs.cpSync(logsBackup, logsDir, { recursive: true });
    }
  }

  // Cleanup old backups
  async cleanupOldBackups() {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.endsWith('.tar.gz'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          time: fs.statSync(path.join(this.backupDir, file)).mtimeMs
        }))
        .sort((a, b) => b.time - a.time);

      const retention = {
        daily: 7,  // Keep 7 daily backups
        weekly: 4, // Keep 4 weekly backups
        monthly: 6 // Keep 6 monthly backups
      };

      let toDelete = [];

      // Group backups by type
      const groups = {
        daily: [],
        weekly: [],
        monthly: [],
        manual: []
      };

      files.forEach(file => {
        const type = file.name.split('_')[1];
        if (groups[type]) {
          groups[type].push(file);
        }
      });

      // Mark old backups for deletion
      Object.keys(groups).forEach(type => {
        const limit = retention[type] || 3;
        if (groups[type].length > limit) {
          toDelete = toDelete.concat(groups[type].slice(limit));
        }
      });

      // Delete old backups
      for (const file of toDelete) {
        fs.unlinkSync(file.path);
        logger.info(`Deleted old backup: ${file.name}`);
      }

      // Clean up cloud backups
      if (this.s3) {
        await this.cleanupCloudBackups();
      }
    } catch (error) {
      logger.error('Cleanup old backups error:', error);
    }
  }

  // Cleanup cloud backups
  async cleanupCloudBackups() {
    try {
      const params = {
        Bucket: this.s3Bucket,
        Prefix: 'backups/'
      };

      const data = await this.s3.listObjectsV2(params).promise();
      const backups = data.Contents
        .filter(obj => obj.Key.endsWith('.tar.gz'))
        .map(obj => ({
          key: obj.Key,
          lastModified: obj.LastModified
        }))
        .sort((a, b) => b.lastModified - a.lastModified);

      // Keep only the latest 10 backups
      if (backups.length > 10) {
        const toDelete = backups.slice(10);
        for (const backup of toDelete) {
          const deleteParams = {
            Bucket: this.s3Bucket,
            Key: backup.key
          };
          await this.s3.deleteObject(deleteParams).promise();
          logger.info(`Deleted old cloud backup: ${backup.key}`);
        }
      }
    } catch (error) {
      logger.error('Cleanup cloud backups error:', error);
    }
  }

  // Get file size
  getFileSize(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  // List backups
  async listBackups() {
    try {
      const localBackups = fs.readdirSync(this.backupDir)
        .filter(file => file.endsWith('.tar.gz'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          type: file.split('_')[1],
          size: this.getFileSize(path.join(this.backupDir, file)),
          created: fs.statSync(path.join(this.backupDir, file)).mtime
        }))
        .sort((a, b) => b.created - a.created);

      let cloudBackups = [];
      if (this.s3) {
        const params = {
          Bucket: this.s3Bucket,
          Prefix: 'backups/'
        };
        const data = await this.s3.listObjectsV2(params).promise();
        cloudBackups = data.Contents
          .filter(obj => obj.Key.endsWith('.tar.gz'))
          .map(obj => ({
            name: path.basename(obj.Key),
            key: obj.Key,
            size: obj.Size,
            created: obj.LastModified,
            location: 's3'
          }))
          .sort((a, b) => b.created - a.created);
      }

      return {
        local: localBackups,
        cloud: cloudBackups
      };
    } catch (error) {
      logger.error('List backups error:', error);
      throw error;
    }
  }

  // Download backup from cloud
  async downloadBackup(key, localPath) {
    try {
      if (!this.s3) {
        throw new Error('S3 not configured');
      }

      const params = {
        Bucket: this.s3Bucket,
        Key: key
      };

      const data = await this.s3.getObject(params).promise();
      fs.writeFileSync(localPath, data.Body);
      
      return {
        success: true,
        path: localPath
      };
    } catch (error) {
      logger.error('Download backup error:', error);
      throw error;
    }
  }

  // Export data
  async exportData(collection, format = 'json', filters = {}) {
    try {
      const data = await mongoose.connection.db
        .collection(collection)
        .find(filters)
        .toArray();

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `export_${collection}_${timestamp}.${format}`;
      const filepath = path.join(this.backupDir, filename);

      if (format === 'json') {
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
      } else if (format === 'csv') {
        // Simple CSV export
        if (data.length === 0) {
          throw new Error('No data to export');
        }
        const headers = Object.keys(data[0]);
        const csv = [
          headers.join(','),
          ...data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))
        ].join('\n');
        fs.writeFileSync(filepath, csv);
      }

      return {
        success: true,
        filepath,
        count: data.length
      };
    } catch (error) {
      logger.error('Export data error:', error);
      throw error;
    }
  }

  // Import data
  async importData(collection, filePath) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      if (!Array.isArray(data)) {
        throw new Error('Data must be an array');
      }

      const result = await mongoose.connection.db
        .collection(collection)
        .insertMany(data);

      return {
        success: true,
        insertedCount: result.insertedCount,
        ids: Object.values(result.insertedIds)
      };
    } catch (error) {
      logger.error('Import data error:', error);
      throw error;
    }
  }
}

module.exports = new BackupService();
