#!/bin/bash
BASE_URL="http://localhost:3001"

echo "1. Testing /api/analyze"
curl -s -X POST "$BASE_URL/api/analyze" -H "Content-Type: application/json" -d '{
  "transcript": "Hi, this is Alex from Acme Corp. We are interested in your product and have a budget of $50k. Please send a proposal by next week."
}' | jq .
echo -e "\n----------------------------------\n"

echo "2. Testing /api/draft-followup/1"
curl -s -X POST "$BASE_URL/api/draft-followup/1" | jq .
echo -e "\n----------------------------------\n"

echo "3. Testing /api/leads/2/close"
curl -s -X POST "$BASE_URL/api/leads/2/close" -H "Content-Type: application/json" -d '{
  "outcome": "lost",
  "closeReason": "They said our price was too high and went with a cheaper competitor."
}' | jq .
echo -e "\n----------------------------------\n"

echo "4. Testing /api/leads/1/recall-promises"
curl -s -X POST "$BASE_URL/api/leads/1/recall-promises" | jq .
echo -e "\n----------------------------------\n"

echo "5. Testing /api/alerts"
curl -s -X GET "$BASE_URL/api/alerts" | jq .
echo -e "\n----------------------------------\n"

echo "6. Testing /api/alerts/3/draft-reengagement"
curl -s -X POST "$BASE_URL/api/alerts/3/draft-reengagement" | jq .
echo -e "\n----------------------------------\n"

echo "7. Testing /api/leads/1/pre-call-brief"
curl -s -X POST "$BASE_URL/api/leads/1/pre-call-brief" | jq .
echo -e "\n----------------------------------\n"
