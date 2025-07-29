#!/bin/bash

BASE_URL="http://localhost:3000"
EMAIL="test@example.com"
PASSWORD="Test123456"
FULL_NAME="Test User"

echo "🧪 SkillMatchAI API Test Suite"
echo "================================"

# Test 1: Signup
echo "1. Testing Signup..."
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"full_name\": \"$FULL_NAME\"
  }")

echo "Signup Response: $SIGNUP_RESPONSE"
echo ""

# Test 2: Signin
echo "2. Testing Signin..."
SIGNIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/signin" \
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
    echo ""

    # Test 3: Get User
    echo "3. Testing Get User..."
    USER_RESPONSE=$(curl -s -X GET "$BASE_URL/api/auth/me" \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    
    echo "Get User Response: $USER_RESPONSE"
    echo ""

    # Test 4: Signout
    echo "4. Testing Signout..."
    SIGNOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/signout" \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    
    echo "Signout Response: $SIGNOUT_RESPONSE"
    echo ""

else
    echo "❌ Failed to extract access token"
fi

echo "✅ All tests completed!" 