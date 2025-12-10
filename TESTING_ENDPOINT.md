# Testing the Dashboard Endpoint

## Prerequisites

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Seed the database**:
   ```bash
   npm run db:seed
   ```

3. **Start the server**:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`

## Endpoint URL

**Base URL:** `http://localhost:5000/api/dashboard`

## Testing Methods

### 1. Using cURL (Command Line)

**Basic request (no filters):**
```bash
curl http://localhost:5000/api/dashboard
```

**With date range filter:**
```bash
curl "http://localhost:5000/api/dashboard?dateRange=last30days"
```

**With multiple filters:**
```bash
curl "http://localhost:5000/api/dashboard?dateRange=last30days&branch=Nairobi&agent=Jane%20Doe"
```

**Pretty print JSON response:**
```bash
curl http://localhost:5000/api/dashboard | jq
```

**Or using Python for pretty printing:**
```bash
curl http://localhost:5000/api/dashboard | python3 -m json.tool
```

### 2. Using Browser

Simply open your browser and navigate to:
```
http://localhost:5000/api/dashboard
```

Or with filters:
```
http://localhost:5000/api/dashboard?dateRange=last30days&branch=Nairobi
```

### 3. Using Postman

1. Create a new GET request
2. URL: `http://localhost:5000/api/dashboard`
3. Add query parameters:
   - `dateRange`: `last30days`
   - `branch`: `Nairobi`
   - `agent`: `Jane Doe`
   - etc.
4. Click "Send"

### 4. Using HTTPie (if installed)

```bash
http GET http://localhost:5000/api/dashboard
http GET http://localhost:5000/api/dashboard dateRange==last30days branch==Nairobi
```

### 5. Using Node.js Script

Create a test file `test-endpoint.js`:
```javascript
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/dashboard?dateRange=last30days',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(JSON.parse(data));
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();
```

Run it:
```bash
node test-endpoint.js
```

## Expected Response Structure

```json
{
  "success": true,
  "data": {
    "kpis": [
      {
        "id": "tat",
        "label": "Turn Around Time",
        "value": "6.27 (days)",
        "change": 0,
        "changeType": "decrease",
        "changePeriod": "31 days ago"
      },
      {
        "id": "conversion",
        "label": "Conversion Rate",
        "value": "1.06%",
        "change": 0,
        "changeType": "increase",
        "changePeriod": "31 days ago"
      },
      {
        "id": "contacted",
        "label": "Total Contacted Leads",
        "value": 17,
        "changeType": "neutral"
      },
      {
        "id": "total",
        "label": "Total Leads",
        "value": 471,
        "changeType": "neutral"
      }
    ],
    "leadsByBranch": [...],
    "revenueByBranch": [...],
    "leadStatus": [...],
    "agentPerformance": [...],
    "topPerformingAgents": [...],
    "branchAgentRanking": [...],
    "filters": {...}
  },
  "message": "Dashboard data retrieved successfully",
  "timestamp": "2024-12-11T..."
}
```

## Query Parameters

All parameters are optional:

- `dateRange`: `last7days`, `last30days`, `last90days`, `lastYear`, `all`
- `branch`: Branch name (e.g., "Nairobi", "Mombasa")
- `agent`: Agent name (e.g., "Jane Doe")
- `product`: Product type (e.g., "Insurance")
- `segment`: Customer segment (e.g., "Premium")
- `campaign`: Campaign name (e.g., "Summer Campaign")

## Example Test Scenarios

### Test 1: Get all data (last 30 days default)
```bash
curl http://localhost:5000/api/dashboard
```

### Test 2: Get last 7 days data
```bash
curl "http://localhost:5000/api/dashboard?dateRange=last7days"
```

### Test 3: Filter by branch
```bash
curl "http://localhost:5000/api/dashboard?branch=Nairobi"
```

### Test 4: Filter by branch and date range
```bash
curl "http://localhost:5000/api/dashboard?dateRange=last30days&branch=Nairobi"
```

### Test 5: Multiple filters
```bash
curl "http://localhost:5000/api/dashboard?dateRange=last30days&branch=Nairobi&product=Insurance&segment=Premium"
```

## Health Check Endpoint

Test if the server is running:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Service is healthy",
  "timestamp": "2024-12-11T...",
  "uptime": 123.45
}
```

## Troubleshooting

### Server not starting?
- Check if port 5000 is already in use
- Check logs in `logs/` directory
- Verify database is initialized: `npm run db:init`

### No data returned?
- Make sure database is seeded: `npm run db:seed`
- Check if database file exists: `ls -la data/dashboard.db`

### CORS errors?
- Make sure frontend URL matches `CORS_ORIGIN` in `.env`
- Default is `http://localhost:5173` (Vite default port)

### Database errors?
- Check if better-sqlite3 is installed: `npm list better-sqlite3`
- Reinitialize database: `npm run db:init`
- Reseed database: `npm run db:seed`

