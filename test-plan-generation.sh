#!/bin/bash

BASE_URL="http://localhost:3000"
EMAIL="test@example.com"
PASSWORD="Test123456"
FULL_NAME="Test User"

echo "🧪 AI Plan Generation Test"
echo "=========================="

# Test 1: Signup
echo "📝 Creating test user..."
SIGNUP_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"full_name\": \"$FULL_NAME\"
  }")

echo "Signup Response: $SIGNUP_RESPONSE"

# Test 2: Signin
echo "🔐 Signing in..."
SIGNIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

echo "Signin Response: $SIGNIN_RESPONSE"

# Extract access token
ACCESS_TOKEN=$(echo $SIGNIN_RESPONSE | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$ACCESS_TOKEN" ]; then
    echo "✅ Access token extracted: ${ACCESS_TOKEN:0:20}..."
    
    # Test 3: Generate Plan
    echo "🤖 Generating AI learning plan..."
    PLAN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/generate-plan \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -d "{
        \"userData\": {
          \"learningGoal\": \"Frontend Development\",
          \"dailyTime\": \"1hour\",
          \"duration\": \"4weeks\",
          \"learningStyle\": \"practical\",
          \"targetLevel\": \"intermediate\"
        }
      }")
    
    echo "Plan Generation Response: $PLAN_RESPONSE"
    
    # Test 4: Get User Plans
    echo "📋 Getting user plans..."
    PLANS_RESPONSE=$(curl -s -X GET http://localhost:3000/api/get-user-plans \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    
    echo "Plans Response: $PLANS_RESPONSE"
    
    # Test 5: Signout
    echo "🚪 Signing out..."
    SIGNOUT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/signout \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    
    echo "Signout Response: $SIGNOUT_RESPONSE"
else
    echo "❌ Failed to extract access token"
fi

echo "✅ AI Plan Generation test completed!" 