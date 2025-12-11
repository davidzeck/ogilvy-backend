# Quick Start - New Backend Features

## 🎉 What's New

Three major features have been added to the Branch Manager Dashboard backend:

### 1. Branch Ranking 🏆
Shows how your branch ranks among all branches based on performance.

**Endpoint**: `GET /api/dashboard`
**Response Field**: `data.branchRanking`

```json
{
  "branchRanking": {
    "position": 93,
    "totalBranches": 100,
    "branch": "Nairobi",
    "score": 245.67
  }
}
```

---

### 2. Country Ranking 🌍
Shows your country's ranking based on aggregate performance.

**Endpoint**: `GET /api/dashboard`
**Response Fields**: `data.countryRanking` and `data.countryRankingTable`

```json
{
  "countryRanking": {
    "position": 493,
    "totalCountries": 500,
    "country": "Kenya",
    "score": 789.23
  },
  "countryRankingTable": [
    {
      "rank": 1,
      "country": "Kenya",
      "branches": 4,
      "totalLeads": 500,
      "totalRevenue": 125000.00,
      "conversionRate": 12.5
    }
  ]
}
```

---

### 3. Actionable Insights 💡
Smart recommendations to improve performance based on data analysis.

**Endpoint**: `GET /api/dashboard`
**Response Field**: `data.actionableInsights`

```json
{
  "actionableInsights": [
    {
      "id": "improve-tat",
      "title": "Improve Your Turn Around Time",
      "description": "Increase your turn around time by 2% by calling your clients between 8:30 am - 12:00 pm.",
      "improvement": 2,
      "metric": "turnAroundTime",
      "priority": "high"
    },
    {
      "id": "improve-conversion",
      "title": "Increase Conversion Rate",
      "description": "Increase your conversion rate by 2% by calling your clients between 8:30 am - 12:00 pm.",
      "improvement": 2,
      "metric": "conversionRate",
      "priority": "high"
    }
  ]
}
```

---

## 🚀 How to Test

### 1. Start the Server
```bash
cd branch-backend
npm run db:seed    # Ensure database has data
npm run dev        # Start server on port 5000
```

### 2. Test the Endpoint
```bash
# Basic test (no filters)
curl http://localhost:5000/api/dashboard | python3 -m json.tool

# With branch filter
curl "http://localhost:5000/api/dashboard?branch=Nairobi" | python3 -m json.tool

# With date range
curl "http://localhost:5000/api/dashboard?dateRange=last30days" | python3 -m json.tool
```

### 3. Verify New Fields
Check the response for:
- ✅ `branchRanking` object
- ✅ `countryRanking` object
- ✅ `countryRankingTable` array
- ✅ `actionableInsights` array

---

## 📊 How It Works

### Branch Ranking Algorithm
Calculates a composite score based on:
- **Revenue** (40% weight)
- **Conversion Rate** (30% weight)
- **Total Leads** (20% weight)
- **Turn Around Time** (10% weight)

Branches are then sorted by score and ranked.

### Insights Generation
1. Analyzes calling patterns by hour
2. Finds best performing time slots
3. Compares with current metrics
4. Generates personalized recommendations

---

## 🔧 Implementation Details

### New Files
- `src/services/insights.service.ts` - Generates actionable insights
- `src/services/ranking.service.ts` - Calculates rankings

### Modified Files
- `src/types/dashboard.types.ts` - Added new interfaces
- `src/repositories/data.repository.ts` - Added data access functions
- `src/services/dashboard.service.ts` - Integrated new features

---

## 💻 Frontend Integration

### Display Branch Ranking
```tsx
// Example React component
const BranchRankingCard = ({ ranking }) => (
  <Card>
    <h3>Branch Ranking</h3>
    <div className="rank">{ranking.position}</div>
    <p>out of {ranking.totalBranches} branches</p>
    <button>View All</button>
  </Card>
);
```

### Display Insights
```tsx
// Example React component
const InsightsGrid = ({ insights }) => (
  <div className="insights-grid">
    {insights.map(insight => (
      <InsightCard key={insight.id}>
        <h3>{insight.title}</h3>
        <p>{insight.description}</p>
        <Badge>+{insight.improvement}%</Badge>
      </InsightCard>
    ))}
  </div>
);
```

---

## 📝 Notes

- All new fields are **optional** (backward compatible)
- Caching is enabled (5-minute TTL)
- Error handling returns safe defaults
- Filters work across all new features

---

## 🐛 Troubleshooting

**Issue**: New fields not showing in response
**Solution**: Clear cache or wait 5 minutes for cache to expire

**Issue**: Rankings seem incorrect
**Solution**: Ensure database is seeded with sample data (`npm run db:seed`)

**Issue**: Insights show default recommendations
**Solution**: Check that leads have `contacted_at` timestamps populated

---

## ✅ Complete Feature Checklist

- [x] Branch Ranking (position calculation)
- [x] Country Ranking (aggregate performance)
- [x] Country Ranking Table (detailed view)
- [x] Actionable Insights (TAT improvement)
- [x] Actionable Insights (Conversion improvement)
- [x] Calling pattern analysis
- [x] Performance scoring algorithm
- [x] Error handling
- [x] Caching support
- [x] TypeScript types
- [x] Documentation

---

**Status**: ✅ **READY FOR PRODUCTION**
