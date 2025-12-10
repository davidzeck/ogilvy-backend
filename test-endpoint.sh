#!/bin/bash

# Test Dashboard Endpoint Script

echo "🚀 Testing Dashboard Endpoint"
echo "================================"
echo ""

# Check if server is running
if ! curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo "❌ Server is not running on port 5000"
    echo "Please start the server first with: npm run dev"
    echo ""
    exit 1
fi

echo "✅ Server is running"
echo ""

# Test Health Endpoint
echo "1️⃣ Testing Health Endpoint:"
echo "GET http://localhost:5000/health"
curl -s http://localhost:5000/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:5000/health
echo ""
echo ""

# Test Dashboard Endpoint (Basic)
echo "2️⃣ Testing Dashboard Endpoint (Basic - Last 30 days):"
echo "GET http://localhost:5000/api/dashboard"
curl -s "http://localhost:5000/api/dashboard" | python3 -m json.tool 2>/dev/null | head -50 || curl -s "http://localhost:5000/api/dashboard" | head -50
echo ""
echo ""

# Test Dashboard Endpoint (With filters)
echo "3️⃣ Testing Dashboard Endpoint (With filters):"
echo "GET http://localhost:5000/api/dashboard?dateRange=last7days&branch=Nairobi"
curl -s "http://localhost:5000/api/dashboard?dateRange=last7days&branch=Nairobi" | python3 -m json.tool 2>/dev/null | head -50 || curl -s "http://localhost:5000/api/dashboard?dateRange=last7days&branch=Nairobi" | head -50
echo ""
echo ""

echo "✅ Testing complete!"
echo ""
echo "💡 Tip: Use 'jq' for better JSON formatting:"
echo "   curl http://localhost:5000/api/dashboard | jq"

