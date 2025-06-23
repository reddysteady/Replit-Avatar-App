# Codex Agent Prompt: GPT Trait Extraction Contamination Investigation

## Mission Statement
Investigate and eliminate data contamination in GPT trait extraction that causes tests to extract 10+ generic traits instead of 3-5 category-specific traits.

## Problem Context

**CONFIRMED ISSUE:** GPT trait extraction tests are passing but extracting contaminated data:
- Humor test extracts: `["Friendly","Playful","Humorous","Conversational","Engaging","Witty","Interactive","Example-driven"]` (8 traits)
- Professional test extracts: `["Professional","Insightful","Formal","Detailed","Comprehensive","Data-driven"]` (6 traits)
- Expected: 3 category-specific traits per test

**CONTAMINATION EVIDENCE:**
```javascript
[GPT-TEST-EXTRACTION] Raw response structure: {
  suggestedTraitsCount: 17,  // CRITICAL: Should be 3-5 max
  extractedDataKeys: ["toneTraits","styleTags","communicationPrefs",...],
  hasSuggestedTraits: true
}
```

## Investigation Scope

### PRIMARY TARGETS (Fix These First):

1. **`server/services/openai.ts` - AI Prompt Contamination**
   - Line ~600-800: `extractPersonalityFromConversation()` method
   - ISSUE: AI system prompt may include contaminating context
   - VERIFY: Test isolation prompts are truly isolated
   - CHECK: Whether cached prompts are bleeding between test sessions

2. **AI Response Generation Logic**
   - ISSUE: AI generating 17 traits when test mode should limit to 3-5
   - CHECK: Test mode prompt modifications in `buildPersonalityExtractionPrompt()`
   - VERIFY: Ultra-strict test isolation is actually working

3. **Trait Generation Pipeline**
   - File: `server/services/openai.ts` lines ~900-1100
   - ISSUE: `generateFallbackTraits()` may be adding generic traits
   - CHECK: Adjacent/antonym trait generation contaminating extracted traits

### SECONDARY TARGETS:

4. **Client-Side Processing**
   - File: `client/src/lib/gpt-trait-test.ts` line ~200-300
   - VERIFY: `extractTraitsFromResponse()` not accidentally merging trait arrays
   - CHECK: Whether test filtering is happening too late in pipeline

## Specific Investigation Tasks

### Task 1: Trace AI Request Payload
```typescript
// Add to server/services/openai.ts around line 700
console.log('[AI-REQUEST-DEBUG] Test isolation payload:', {
  testMode: isTestIsolationMode,
  testCategory,
  sessionId,
  systemPromptLength: systemPrompt.length,
  systemPromptPreview: systemPrompt.substring(0, 200),
  messageCount: messages.length,
  hasIsolationHeaders: !!headers?.['X-Test-Isolation']
})
```

### Task 2: Validate AI Response Before Processing
```typescript
// Add to processExtractionResponse() around line 1000
console.log('[AI-RESPONSE-DEBUG] Raw AI response analysis:', {
  contentLength: content.length,
  contentPreview: content.substring(0, 300),
  suggestedTraitsRaw: parsed.suggestedTraits?.length,
  extractedDataKeys: Object.keys(parsed.extractedData || {}),
  testMode,
  testCategory
})
```

### Task 3: Check Prompt Cache Contamination
```typescript
// Add to buildPersonalityExtractionPrompt() around line 850
if (isTestIsolationMode) {
  console.log('[PROMPT-ISOLATION-DEBUG] Building test prompt:', {
    testCategory,
    sessionId,
    basePromptLength: basePrompt.length,
    hasTestModifications: systemPrompt.includes('ULTRA-STRICT'),
    conversationState: {
      stage: conversationState.stage,
      fieldsCollected: conversationState.fieldsCollected
    }
  })
}
```

## Expected Outcomes

**FIXED BEHAVIOR:**
- Humor test: `["Humorous", "Playful", "Witty"]` (3 traits)
- Professional test: `["Professional", "Analytical", "Formal"]` (3 traits)
- Creative test: `["Creative", "Innovative", "Artistic"]` (3 traits)

**CONTAMINATION ELIMINATED:**
- No generic traits ("Friendly", "Engaging") in category-specific tests
- Maximum 5 traits per test, not 8-17
- Clean isolation between test runs
- Consistent results across multiple test executions

## Success Criteria

1. **Trait Count Validation**: Tests extract exactly 3-5 relevant traits
2. **Category Specificity**: No cross-contamination between humor/professional/creative
3. **Consistency**: Same test run multiple times produces identical results
4. **Clean AI Responses**: Raw AI response contains <8 total traits, not 17+

## Files to Modify (In Priority Order)

1. `server/services/openai.ts` - Fix AI prompt contamination
2. `client/src/lib/gpt-trait-test.ts` - Add contamination detection
3. Add comprehensive logging to trace contamination source
4. Implement strict trait count limits in AI prompts

## Verification Command

```bash
# Run this after fixes to verify contamination is eliminated
npm run test:gpt-traits
```

Should show consistent 3-trait extraction across all test categories.
