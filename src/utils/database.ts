/**
 * Database Utility
 * SQLite database connection and initialization
 */

import Database from 'better-sqlite3';
import { databaseConfig } from '../config/database.config';
import path from 'path';
import fs from 'fs';
import logger from './logger';

let db: Database.Database | null = null;

/**
 * Get database connection (singleton)
 */
export const getDatabase = (): Database.Database => {
  if (!db) {
    // Ensure data directory exists
    const dataDir = path.dirname(databaseConfig.databasePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      logger.info(`Created data directory: ${dataDir}`);
    }

    // Create database connection
    db = new Database(databaseConfig.databasePath, databaseConfig.options);
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');
    
    logger.info(`Connected to SQLite database: ${databaseConfig.databasePath}`);
  }

  return db;
};

/**
 * Close database connection
 */
export const closeDatabase = (): void => {
  if (db) {
    db.close();
    db = null;
    logger.info('Database connection closed');
  }
};

/**
 * Initialize database schema
 */
export const initializeDatabase = (): void => {
  const database = getDatabase();

  // Create tables
  database.exec(`
    -- Branches table
    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Agents table
    CREATE TABLE IF NOT EXISTS agents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      branch_id INTEGER,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (branch_id) REFERENCES branches(id)
    );

    -- Leads table
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      agent_id INTEGER,
      status TEXT NOT NULL DEFAULT 'Open',
      product TEXT,
      segment TEXT,
      campaign TEXT,
      revenue REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      contacted_at DATETIME,
      converted_at DATETIME,
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    );

    -- Metrics table (for caching aggregated data)
    CREATE TABLE IF NOT EXISTS metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      metric_type TEXT NOT NULL,
      metric_key TEXT NOT NULL,
      value TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(metric_type, metric_key)
    );

    -- Create indexes for better query performance
    CREATE INDEX IF NOT EXISTS idx_leads_branch_id ON leads(branch_id);
    CREATE INDEX IF NOT EXISTS idx_leads_agent_id ON leads(agent_id);
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
    CREATE INDEX IF NOT EXISTS idx_agents_branch_id ON agents(branch_id);
  `);

  logger.info('Database schema initialized');
};

/**
 * Seed database with sample data (for development)
 */
export const seedDatabase = (): void => {
  const database = getDatabase();

  // Check if data already exists
  const branchCount = database.prepare('SELECT COUNT(*) as count FROM branches').get() as { count: number };
  
  if (branchCount.count > 0) {
    logger.info('Database already contains data, skipping seed');
    return;
  }

  logger.info('Seeding database with sample data...');

  // Insert sample branches
  const insertBranch = database.prepare('INSERT INTO branches (name) VALUES (?)');
  const branches = ['Nairobi', 'Mombasa', 'Kisumu', 'Eldoret'];
  const branchIds: number[] = [];
  
  for (const branchName of branches) {
    const result = insertBranch.run(branchName);
    branchIds.push(Number(result.lastInsertRowid));
  }

  // Insert sample agents
  const insertAgent = database.prepare('INSERT INTO agents (name, branch_id, email) VALUES (?, ?, ?)');
  const agents = [
    ['Jane Doe', branchIds[0], 'jane.doe@example.com'],
    ['John Smith', branchIds[0], 'john.smith@example.com'],
    ['Alice Johnson', branchIds[1], 'alice.johnson@example.com'],
    ['Bob Williams', branchIds[1], 'bob.williams@example.com'],
    ['Charlie Brown', branchIds[2], 'charlie.brown@example.com'],
  ];

  const agentIds: number[] = [];
  for (const [name, branchId, email] of agents) {
    const result = insertAgent.run(name, branchId, email);
    agentIds.push(Number(result.lastInsertRowid));
  }

  // Insert sample leads
  const insertLead = database.prepare(`
    INSERT INTO leads (branch_id, agent_id, status, product, segment, campaign, revenue, created_at, contacted_at, converted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date();
  const statuses = ['Open', 'Closed', 'Product/Service Sold', 'To Callback Later'];
  const products = ['Insurance', 'Loan', 'Investment', 'Savings'];
  const segments = ['Premium', 'Standard', 'Basic'];
  const campaigns = ['Summer Campaign', 'Winter Campaign', 'Spring Campaign'];

  // Generate sample leads
  for (let i = 0; i < 500; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const contactedAt = status !== 'Open' ? new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : null;
    const convertedAt = status === 'Product/Service Sold' ? new Date(contactedAt!.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000) : null;

    insertLead.run(
      branchIds[Math.floor(Math.random() * branchIds.length)],
      agentIds[Math.floor(Math.random() * agentIds.length)],
      status,
      products[Math.floor(Math.random() * products.length)],
      segments[Math.floor(Math.random() * segments.length)],
      campaigns[Math.floor(Math.random() * campaigns.length)],
      status === 'Product/Service Sold' ? Math.floor(Math.random() * 100000) + 10000 : 0,
      createdAt.toISOString(),
      contactedAt?.toISOString() || null,
      convertedAt?.toISOString() || null
    );
  }

  logger.info('Database seeded with sample data');
};

export default getDatabase;

