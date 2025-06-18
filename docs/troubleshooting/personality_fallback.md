# Personality Chat Fallback Response Troubleshooting Guide

## Issue Description
The AI personality chat system is returning fallback responses instead of proper OpenAI-generated responses. Users see generic messages like "Great! Tell me more about what you'd like your avatar to focus on." instead of engaging personality extraction questions.

## Common Root Causes

**Troubleshooting Steps:**
```bash
# Check if API key is set in environment
echo $OPENAI_API_KEY

# Check if API key is stored in database
curl -X GET http://localhost:5000/api/settings \
  -H "Content-Type: application/json"
```

**Resolution:**
- Ensure `OPENAI_API_KEY` is set in Replit Secrets
- Verify API key format starts with `sk-` and is at least 20 characters
- Test API key validity with a simple OpenAI request

### 2. OpenAI API Quota/Rate Limiting
**Symptoms:**
- Console logs show "[FALLBACK ROOT CAUSE] OpenAI quota/rate limit exceeded"
- Console logs show "[FALLBACK ROOT CAUSE] OpenAI insufficient quota/permissions"
- 429 or 403 HTTP status codes

**Troubleshooting Steps:**
```bash
# Check OpenAI usage dashboard
# Test with a simple API call to verify quota status
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "test"}],
    "max_tokens": 5
  }'
```

### 3. JSON Parsing Failures
**Symptoms:**
- Console logs show "JSON parse error, content was:"
- Console logs show "Personality extraction JSON parse failed"
- Valid API responses but malformed JSON content

**Troubleshooting Steps:**
1. Enable DEBUG_AI logging to see raw OpenAI responses
2. Check if `response_format: { type: 'json_object' }` is working
3. Verify system prompts are requesting valid JSON format

### 4. Network/Connection Issues
**Symptoms:**
- Intermittent failures with same API key
- Timeout errors in console
- Connection refused errors

## Debugging Steps

### Step 1: Enable Debug Logging
Add to your Replit Secrets:
```
DEBUG_AI=true
```

This will log:
- API key source (env vs storage)
- System prompts being sent
- Raw OpenAI responses
- Personality extraction details

### Step 2: Check API Key Configuration
```javascript
// Test in browser console or create a debug endpoint
fetch('/api/debug/openai-status')
  .then(r => r.json())
  .then(console.log)
```

### Step 3: Test OpenAI Connection Directly
```javascript
// In PersonalityChat.tsx, add temporary logging
console.log('Sending request to:', '/api/ai/personality-extract');
console.log('Request payload:', {
  messages: messages.map(msg => ({ role: msg.role, content: msg.content })),
  currentConfig: extractedConfig
});
```

### Step 4: Inspect Network Requests
1. Open browser Developer Tools
2. Go to Network tab
3. Send a message in personality chat
4. Look for `/api/ai/personality-extract` request
5. Check response status and content

### Step 5: Verify System Prompt Generation
Check console for logs like:
```
[DEBUG-AI] Personality extraction request: {...}
[DEBUG-AI] OpenAI raw response: {...}
[PERSONALITY-DEBUG] Raw OpenAI response: {...}
```

## Resolution Strategies

### For API Key Issues:
1. Go to Replit Secrets (🔒 icon in sidebar)
2. Add `OPENAI_API_KEY` with valid OpenAI API key
3. Restart the application
4. Test with a simple message

### For Quota Issues:
1. Check OpenAI billing dashboard
2. Upgrade OpenAI plan if needed
3. Implement request queuing/retry logic
4. Consider using gpt-4o-mini for testing

### For JSON Parsing Issues:
1. Review system prompt in `server/services/openai.ts`
2. Ensure `response_format: { type: 'json_object' }` is set
3. Add JSON validation in the response handler
4. Implement fallback JSON parsing

### For Network Issues:
1. Check Replit's internet connectivity
2. Implement retry logic with exponential backoff
3. Add proper error handling for network timeouts

## Prevention Measures

### 1. Implement Comprehensive Error Handling
```typescript
try {
  const response = await client.chat.completions.create({...});
  return JSON.parse(response.choices[0]?.message?.content || '{}');
} catch (error) {
  console.error('[PERSONALITY-DEBUG] Error details:', {
    message: error.message,
    status: error.status,
    type: error.constructor.name
  });
  return fallbackResponse;
}
```

### 2. Add Health Check Endpoint
Create `/api/health/openai` to test API connectivity

### 3. Implement Request Logging
Log all OpenAI requests/responses for debugging

### 4. Add Graceful Degradation
Provide helpful error messages instead of generic fallbacks

## Monitoring and Alerting

### Key Metrics to Track:
- Fallback response rate
- OpenAI API error rates
- JSON parsing failure rate
- Response time percentiles

### Console Log Patterns to Monitor:
- `[FALLBACK ROOT CAUSE]` - Indicates why fallback was used
- `[DEBUG-AI]` - Debug information when enabled
- `[PERSONALITY-DEBUG]` - Personality extraction specific logs

## Common Solutions Summary

1. **Missing API Key**: Add to Replit Secrets
2. **Invalid API Key**: Verify format and permissions
3. **Quota Exceeded**: Check OpenAI billing
4. **JSON Parse Error**: Review system prompts
5. **Network Issues**: Implement retry logic
6. **Rate Limiting**: Add request queuing

## Testing Checklist

- [ ] API key is properly configured
- [ ] Debug logging is enabled
- [ ] Network requests are successful (200 status)
- [ ] OpenAI responses contain valid JSON
- [ ] Error handling works for all failure modes
- [ ] Fallback responses are helpful and informative
