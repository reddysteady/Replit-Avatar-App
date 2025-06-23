# GPT Trait Extraction Data Leakage Investigation Plan

## 1. Context & Background

**Problem:** GPT trait extraction tests are showing data contamination between test runs and previous conversations. Evidence includes:

- Humor Test extracting 9+ traits instead of expected 3 (Humorous, Playful, Witty)
- Professional Test extracting unrelated traits like "Casual", "Concise" alongside expected ones
- Creative Test showing traits from other categories (Traditional, Formal, Concise)
- Inconsistent test results between runs (sometimes passing, sometimes failing)
- Tests extracting 17+ traits from `suggestedTraits` when only 3-5 expected

**Error Evidence from Latest Test Run:**
```
✅ [GPT-TRAIT-TEST] Humor Test PASSED
extractedTraits: ["Friendly","Playful","Humorous","Conversational","Engaging","Witty","Interactive","Example-driven"]

✅ [GPT-TRAIT-TEST] Professional Test PASSED  
extractedTraits: ["Professional","Insightful","Formal","Detailed","Comprehensive","Data-driven"]

✅ [GPT-TRAIT-TEST] Creative Test PASSED
extractedTraits: [Test was cut off but showing similar pattern]
```

**CONFIRMED CONTAMINATION PATTERNS:**
1. **Cross-category bleed**: Humor tests extracting "Formal", "Serious" traits
2. **Generic trait injection**: Default traits like "Friendly", "Engaging" appearing in all tests
3. **Excessive trait counts**: 14+ traits extracted when expecting 3-5
4. **Inconsistent isolation**: Some test runs show better isolation than others

**Root Cause:** Multi-layered contamination from AI response processing, cached prompts, and trait expansion logic bleeding between test sessions.

## 2. Objective & Scope

**Goal:** Eliminate data contamination in GPT trait extraction to ensure clean, isolated test results that match expected trait categories.

**In Scope:**
- `/api/ai/personality-extract` endpoint isolation
- GPT prompt context contamination 
- Test session data persistence/caching
- AI response processing and trait extraction logic
- Test isolation mechanisms in `gpt-trait-test.ts`

**Out of Scope:** 
- Don't change core AI prompt structure
- Don't modify database schema
- Don't refactor unrelated personality chat logic

## 3. Investigation & Steps

### Phase 1: Identify Contamination Sources

**A. Server-Side Context Bleeding - CONFIRMED ISSUE**
- **✅ VERIFIED:** Test isolation headers are being sent correctly
- **✅ VERIFIED:** Each test gets unique session ID and cache bypass
- **❌ ISSUE FOUND:** AI responses still contain 17+ traits in `suggestedTraits` array
- **❌ CRITICAL:** Raw AI response shows contamination at source level

**Evidence from logs:**
```
[GPT-TEST-EXTRACTION] Raw response structure: {
  "suggestedTraitsCount": 17,  // Should be 3-5 for clean isolation
  "extractedDataKeys": ["toneTraits","styleTags","communicationPrefs",...], 
  "hasSuggestedTraits": true
}
```

**B. Client-Side State Contamination**
- **Check:** `PersonalityChat.tsx` - Verify conversation state isn't persisting between tests
- **Investigate:** Whether `createExpandedTraits()` function is using cached data
- **Examine:** State manager (`PersonaChatStateManager.ts`) for lingering state
- **Verify:** Test cleanup in `gpt-trait-test.ts` is actually clearing data

**C. AI Response Processing Issues - ROOT CAUSE IDENTIFIED**
- **✅ CONFIRMED:** `extractTraitsFromResponse()` correctly filters by `type: 'extracted'`
- **❌ CRITICAL:** AI is generating excessive traits in initial response
- **❌ CONTAMINATION:** Response shows 17 traits when test isolation should limit to 3-5
- **❌ BLEED:** Generic traits ("Friendly", "Engaging") appearing in category-specific tests

**New Evidence:**
```
[CONTAMINATION-DETECTED] Excessive traits in test mode: {
  testCategory: "humor",
  traitCount: 17,
  action: "FILTERING_TO_RELEVANT_ONLY"
}
```

**Current Filtering Applied:**
- Client-side post-processing limits to 8 traits max
- Test mode filtering to only `type: 'extracted'`
- But contamination occurs at AI generation level, not filtering level

### Phase 2: Root Cause Analysis

**A. Examine Current Test Flow:**
1. Test generates unique `testSessionId`
2. Sends isolated messages with test headers
3. Calls `/api/ai/personality-extract` endpoint
4. Processes AI response for traits
5. Attempts cleanup via cache clear

**B. Identify Failure Points:**
- **Hypothesis 1:** OpenAI service retaining conversation context between calls
- **Hypothesis 2:** AI prompt includes previous conversation history
- **Hypothesis 3:** Response processing extracting from contaminated trait arrays
- **Hypothesis 4:** Test cleanup not actually clearing relevant caches

**C. Verification Steps:**
1. **Log AI request payload** - Check if clean conversation context sent
2. **Log AI response raw data** - Verify response isn't contaminated at source
3. **Trace trait extraction logic** - Ensure only expected response sections processed
4. **Verify test isolation** - Confirm each test truly starts with clean slate

### Phase 3: Specific Debugging Actions

**A. Add Comprehensive Logging:**
```typescript
// In openai.ts - Log exact AI request context
console.log('[AI-REQUEST-DEBUG] Conversation context:', {
  messageCount: messages.length,
  testSessionId: headers['X-Test-Session-ID'],
  hasHistoryBleed: /* check for unexpected historical context */
})

// In gpt-trait-test.ts - Log response processing steps
console.log('[TRAIT-EXTRACTION-DEBUG] Processing response:', {
  suggestedTraitsCount: response.suggestedTraits?.length,
  extractedDataKeys: Object.keys(response.extractedData || {}),
  extractedTraitsPreFilter: response.suggestedTraits?.map(t => t.label),
  extractedTraitsPostFilter: /* after type=extracted filter */
})
```

**B. Implement Stricter Test Isolation:**
- Ensure AI requests include explicit "start fresh" instructions
- Add conversation context validation before AI calls
- Implement actual cache clearing (not just endpoint calls)
- Add pre-test state verification

**C. Validate Response Processing:**
- Verify `extractTraitsFromResponse()` only processes expected trait sources
- Check why Professional test extracts "Casual" when expecting "Formal"
- Ensure trait filtering logic works correctly
- Validate trait categorization matches test expectations

## 4. Testing & Validation

**A. Verification Test Cases:**
1. **Sequential Isolation Test:** Run same test 3 times, verify identical results
2. **Cross-Contamination Test:** Run Humor → Professional → Humor, verify no bleed
3. **Clean Slate Test:** Clear all caches, run single test, verify minimal trait extraction
4. **Response Structure Test:** Validate AI response contains only expected trait categories

**B. Success Criteria:**
- Each test extracts **exactly** expected traits (3-5 per category)
- No unexpected traits from other test categories
- Consistent results across multiple test runs
- Clean separation between extracted/adjacent/antonym traits

**C. Regression Prevention:**
- Add trait count validation (max 5 extracted traits per test)
- Add trait category validation (no cross-contamination)
- Add response structure validation
- Add test consistency checks

## 5. Implementation Priority

**Priority 1 - Critical (Fix Immediately):**
1. Add comprehensive logging to trace contamination source
2. Verify AI request context is clean for each test
3. Fix trait extraction logic to prevent over-extraction

**Priority 2 - High (Next):**
1. Implement stricter test isolation mechanisms
2. Add response structure validation
3. Fix cleanup processes

**Priority 3 - Medium (Follow-up):**
1. Add regression tests for trait extraction
2. Implement trait count limits
3. Add cross-contamination detection

## 6. Files to Investigate

**Primary Investigation:**
- `server/services/openai.ts` - AI request context and conversation history
- `client/src/lib/gpt-trait-test.ts` - Test isolation and response processing
- `client/src/components/PersonalityChat.tsx` - State management and trait generation

**Secondary Investigation:**
- `client/src/lib/PersonaChatStateManager.ts` - State persistence
- `client/src/lib/trait-expansion.ts` - Trait processing logic
- `server/routes.ts` - API endpoint handling

## 7. Expected Outcomes

**Clean Test Results Should Show:**
```
Humor Test: ["Humorous", "Playful", "Witty"] (3 traits)
Professional Test: ["Professional", "Analytical", "Formal"] (3 traits)  
Creative Test: ["Creative", "Innovative", "Artistic"] (3 traits)
```

**Not:**
```
Humor Test: ["Friendly","Playful","Witty","Conversational","Humorous","Engaging","Interactive","Example-driven","Warm","Welcoming","Informal","Chatty","Formal","Serious"] (14 traits!)
```

## 8. Reference Docs

- [Trait Cloud Extraction Spec](../specs/to_implement/trait_cloud_extraction_spec.md)
- [GPT Trait Test Implementation](../../client/src/lib/gpt-trait-test.ts)
- [OpenAI Service](../../server/services/openai.ts)
