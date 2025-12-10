# Backend Remaining Tasks - Based on Dashboard Screenshot

## ✅ Already Implemented

1. **KPIs (4 Cards)** ✅
   - Turn Around Time (with change indicator)
   - Conversion Rate (with change indicator)
   - Total Contacted Leads
   - Total Leads

2. **Leads By Branch Chart** ✅
   - Line chart with leads and conversion rate over 7 periods

3. **Lead Status Donut Chart** ✅
   - Breakdown: Open, Closed, Product/Service Sold, To Callback Later

4. **Revenue By Branch Chart** ✅
   - Line chart showing revenue over time periods

5. **Agent Performance Bar Chart** ✅
   - Agent performance data with leads, revenue, conversion rate

6. **Top Performing Agents Table** ✅
   - Agents with TAT, Conversion Rate, Branch

7. **Branch Agent Ranking Table** ✅
   - Agents with Target KES, Realised KES

---

## ❌ Missing Features (To Be Implemented)

### 1. **Actionable Insights/Recommendations** ❌
**From Screenshot:**
- Two large gradient cards with actionable advice:
  - **"Improve Your Turn Around Time"**: "increase your turn around time by 2% by calling your clients between 8:30 am- 12:00 pm."
  - **"Increase Conversion Rate"**: "increase your conversion rate 2% by calling your clients between 8:30 am- 12:00 pm."

**What's Needed:**
- Business logic to analyze data patterns
- Time-based analysis (best calling hours)
- Generate recommendations based on data trends
- Calculate potential improvement percentages

**Implementation:**
- Add `ActionableInsight` type to `dashboard.types.ts`
- Create `insights.service.ts` with recommendation logic
- Add repository functions to analyze calling patterns
- Return insights in dashboard response

---

### 2. **Branch Ranking** ❌
**From Screenshot:**
- Card showing: "Branch Ranking: 93" with "View All" button

**What's Needed:**
- Calculate branch ranking based on performance metrics
- Compare current branch against all branches
- Return numeric ranking position

**Implementation:**
- Add `BranchRanking` type
- Create repository function to calculate branch rankings
- Compare performance metrics (revenue, conversion rate, leads)
- Return ranking number in dashboard response

---

### 3. **Country Ranking** ❌
**From Screenshot:**
- Card showing: "Country Ranking: 493" with "View All" button
- Table header visible: "Country Ranking"

**What's Needed:**
- Calculate country-level ranking
- Aggregate all branches in the country
- Compare against other countries (if multi-country)
- Return ranking number and table data

**Implementation:**
- Add `CountryRanking` type
- Create repository function for country-level aggregation
- Calculate country performance metrics
- Return ranking number and country ranking table

---

### 4. **Enhanced Data Analysis** ❌
**For Insights Generation:**
- Time-of-day analysis (best calling hours)
- Day-of-week analysis (best calling days)
- Performance trend analysis
- Comparative analysis (current vs historical)

---

## 📋 Implementation Checklist

### Phase 1: Types & Interfaces
- [ ] Add `ActionableInsight` interface
- [ ] Add `BranchRanking` interface
- [ ] Add `CountryRanking` interface
- [ ] Update `DashboardData` to include new fields

### Phase 2: Repository Layer
- [ ] `getCallingPatternAnalysis()` - Analyze best calling times
- [ ] `getBranchRanking()` - Calculate branch ranking position
- [ ] `getCountryRanking()` - Calculate country ranking position
- [ ] `getCountryRankingTable()` - Get country ranking table data

### Phase 3: Service Layer
- [ ] `insights.service.ts` - Generate actionable insights
- [ ] `ranking.service.ts` - Calculate rankings
- [ ] Update `dashboard.service.ts` to include new data

### Phase 4: Integration
- [ ] Update dashboard controller to return new data
- [ ] Update response structure
- [ ] Test all new endpoints

---

## 🎯 Priority Order

1. **Branch Ranking** (High Priority - Visible in screenshot)
2. **Country Ranking** (High Priority - Visible in screenshot)
3. **Actionable Insights** (Medium Priority - Adds value)
4. **Enhanced Analytics** (Low Priority - Nice to have)

---

## 📊 Expected Response Structure (Updated)

```json
{
  "success": true,
  "data": {
    "kpis": [...],
    "leadsByBranch": [...],
    "revenueByBranch": [...],
    "leadStatus": [...],
    "agentPerformance": [...],
    "topPerformingAgents": [...],
    "branchAgentRanking": [...],
    "countryRanking": [...],           // NEW
    "branchRanking": {                 // NEW
      "position": 93,
      "totalBranches": 100
    },
    "countryRankingPosition": {        // NEW
      "position": 493,
      "totalCountries": 500
    },
    "actionableInsights": [            // NEW
      {
        "id": "improve-tat",
        "title": "Improve Your Turn Around Time",
        "description": "increase your turn around time by 2% by calling your clients between 8:30 am- 12:00 pm.",
        "improvement": 2,
        "metric": "turnAroundTime"
      },
      {
        "id": "improve-conversion",
        "title": "Increase Conversion Rate",
        "description": "increase your conversion rate 2% by calling your clients between 8:30 am- 12:00 pm.",
        "improvement": 2,
        "metric": "conversionRate"
      }
    ],
    "filters": {...}
  },
  "message": "Dashboard data retrieved successfully",
  "timestamp": "2024-12-11T..."
}
```

---

## 🔧 Technical Details

### Branch Ranking Logic
- Compare current branch's metrics against all branches
- Rank by: Revenue, Conversion Rate, Leads, TAT
- Return position (e.g., 93 out of 100)

### Country Ranking Logic
- Aggregate all branches in country
- Compare country metrics against other countries
- Return position (e.g., 493 out of 500)

### Insights Generation Logic
- Analyze calling patterns by time of day
- Identify best performing time slots
- Calculate potential improvement
- Generate actionable recommendations

---

## 📝 Next Steps

1. Start with Branch Ranking (simplest)
2. Then Country Ranking
3. Finally, Actionable Insights (most complex)

