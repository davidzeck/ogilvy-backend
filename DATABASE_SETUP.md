# SQLite Database Setup

## Installation

First, install the SQLite dependencies:

```bash
npm install better-sqlite3
npm install --save-dev @types/better-sqlite3
```

If you encounter permission issues, you may need to fix node_modules permissions or use sudo (not recommended).

## Database Initialization

### Initialize Database Schema

This will create the database file and all necessary tables:

```bash
npm run db:init
```

### Initialize and Seed with Sample Data

This will create the database, tables, and populate with sample data for development:

```bash
npm run db:seed
```

## Database Location

The SQLite database file will be created at:
```
branch-backend/data/dashboard.db
```

## Database Schema

The database includes the following tables:

- **branches** - Branch information
- **agents** - Agent information linked to branches
- **leads** - Lead records with status, product, segment, campaign, and revenue
- **metrics** - Cached aggregated metrics

## Sample Data

When seeding, the database will be populated with:
- 4 sample branches (Nairobi, Mombasa, Kisumu, Eldoret)
- 5 sample agents
- 500 sample leads with various statuses, products, and dates

## Database Features

- **WAL Mode**: Enabled for better concurrency
- **Foreign Keys**: Enabled for data integrity
- **Indexes**: Created on frequently queried columns for performance

## Manual Database Access

You can access the database using SQLite CLI:

```bash
sqlite3 data/dashboard.db
```

Or use a GUI tool like DB Browser for SQLite.

