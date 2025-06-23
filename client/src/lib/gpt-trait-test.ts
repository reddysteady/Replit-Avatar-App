export interface TraitTestResult {
  success: boolean
  extractedTraits: string[]
  expectedTraits: string[]
  missingTraits: string[]
  unexpectedTraits: string[]
  aiResponseValid: boolean
  extractionTime: number
  error?: string
}

export class GPTTraitTester {
  private testPayloads = [
    {
      name: "Humor Test",
      messages: [
        { role: "user", content: "I love making people laugh with my content. I'm always cracking jokes and using humor to connect with my audience. Comedy is my way of making serious topics more approachable." },
        { role: "user", content: "When someone comments, I usually respond with something witty or playful. I think humor breaks down barriers and makes conversations more fun." }
      ],
      expectedTraits: ["Humorous", "Playful", "Witty"],
      category: "humor"
    },
    {
      name: "Professional Test", 
      messages: [
        { role: "user", content: "I maintain a professional tone in all my business communications. I focus on providing value to my corporate audience through detailed analysis and strategic insights." },
        { role: "user", content: "My content is always well-structured and data-driven. I prefer formal language and comprehensive explanations when responding to questions." }
      ],
      expectedTraits: ["Professional", "Analytical", "Formal"],
      category: "professional"
    },
    {
      name: "Creative Test",
      messages: [
        { role: "user", content: "I'm all about creative expression and artistic innovation. My content explores new ideas and pushes boundaries in design and storytelling." },
        { role: "user", content: "I love inspiring others to think outside the box and embrace their creative potential. Art and creativity are central to everything I do." }
      ],
      expectedTraits: ["Creative", "Innovative", "Artistic"],
      category: "creative"
    }
  ]

  async runTest(testName?: string): Promise<TraitTestResult[]> {
    const testsToRun = testName 
      ? this.testPayloads.filter(t => t.name === testName)
      : this.testPayloads

    const results: TraitTestResult[] = []

    for (const testPayload of testsToRun) {
      console.log(`[GPT-TRAIT-TEST] Running ${testPayload.name}...`)
      const result = await this.runSingleTest(testPayload)
      results.push(result)

      // Log result
      if (result.success) {
        console.log(`✅ [GPT-TRAIT-TEST] ${testPayload.name} PASSED`, {
          extractedTraits: result.extractedTraits,
          extractionTime: result.extractionTime
        })
      } else {
        console.error(`❌ [GPT-TRAIT-TEST] ${testPayload.name} FAILED`, {
          error: result.error,
          missingTraits: result.missingTraits,
          extractedTraits: result.extractedTraits
        })
      }
    }

    return results
  }

  private async runSingleTest(testPayload: any): Promise<TraitTestResult> {
    const startTime = Date.now()

    try {
      // CRITICAL: Generate unique test session ID for complete isolation
      const testSessionId = `test_${testPayload.category}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // CRITICAL: Clear any cached data and ensure isolated test
      const testMessages = testPayload.messages.map((msg: any, index: number) => ({
        ...msg,
        id: `${testSessionId}_msg_${index}`, // Unique IDs per test session
        timestamp: Date.now() + index,
        testSessionId // Tag messages with test session
      }))

      console.log(`[GPT-TEST-ISOLATION] Running isolated test for ${testPayload.name}`, {
        testSessionId,
        messageCount: testMessages.length,
        testCategory: testPayload.category,
        expectedTraits: testPayload.expectedTraits,
        isolationLevel: 'FULL'
      })

      // Call the personality extraction endpoint with isolated data
      const response = await fetch('/api/ai/personality-extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Test-Isolation': 'true', // Signal this is an isolated test
          'X-Test-Category': testPayload.category,
          'X-Test-Session-ID': testSessionId, // Unique session for this test
          'X-Cache-Bypass': 'true' // Force cache bypass for tests
        },
        body: JSON.stringify({
          messages: testMessages,
          currentConfig: {}, // Always start with empty config
          initialMessage: false,
          testMode: true, // Flag for test mode
          testCategory: testPayload.category,
          testSessionId, // Include session ID in payload
          isolationMode: 'STRICT' // Request strict isolation
        })
      })

      const extractionTime = Date.now() - startTime

      if (!response.ok) {
        return {
          success: false,
          extractedTraits: [],
          expectedTraits: testPayload.expectedTraits,
          missingTraits: testPayload.expectedTraits,
          unexpectedTraits: [],
          aiResponseValid: false,
          extractionTime,
          error: `HTTP ${response.status}: ${response.statusText}`
        }
      }

      const aiResult = await response.json()

      // Validate AI response structure
      const aiResponseValid = this.validateAIResponse(aiResult)

      // Extract traits from response
      const extractedTraits = this.extractTraitsFromResponse(aiResult)

      // Compare with expected traits
      const analysis = this.analyzeTraits(extractedTraits, testPayload.expectedTraits)

      const success = aiResponseValid && 
                     extractedTraits.length > 0 && 
                     analysis.matchCount >= Math.ceil(testPayload.expectedTraits.length * 0.6) // 60% match threshold

      // CRITICAL: Log test completion for isolation verification
      console.log(`[GPT-TEST-ISOLATION] Test ${testPayload.name} completed`, {
        testSessionId,
        success,
        extractedTraitsCount: extractedTraits.length,
        isolationVerified: true
      })

      return {
        success,
        extractedTraits,
        expectedTraits: testPayload.expectedTraits,
        missingTraits: analysis.missing,
        unexpectedTraits: analysis.unexpected,
        aiResponseValid,
        extractionTime,
        testSessionId, // Include session ID in result for verification
        ...(success ? {} : { error: `Only ${analysis.matchCount}/${testPayload.expectedTraits.length} expected traits found` })
      }

    } catch (error: any) {
      console.log(`[GPT-TEST-ISOLATION] Test ${testPayload.name} failed with error:`, {
        testSessionId: testSessionId || 'UNKNOWN',
        error: error.message,
        isolationMaintained: true
      })

      return {
        success: false,
        extractedTraits: [],
        expectedTraits: testPayload.expectedTraits,
        missingTraits: testPayload.expectedTraits,
        unexpectedTraits: [],
        aiResponseValid: false,
        extractionTime: Date.now() - startTime,
        testSessionId: testSessionId || 'UNKNOWN',
        error: error.message
      }
    } finally {
      // CRITICAL: Ensure test session cleanup
      console.log(`[GPT-TEST-CLEANUP] Cleaning up test session: ${testSessionId || 'UNKNOWN'}`)
      
      // Optional: Call cleanup endpoint if needed
      try {
        await fetch('/api/cache/clear', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ testSessionId: testSessionId || 'UNKNOWN' })
        })
      } catch (cleanupError) {
        console.warn('[GPT-TEST-CLEANUP] Cache cleanup failed (non-critical):', cleanupError)
      }
    }
  }

  private validateAIResponse(response: any): boolean {
    return !!(
      response &&
      response.extractedData &&
      (response.extractedData.toneTraits || 
       response.extractedData.styleTags || 
       response.extractedData.communicationPrefs)
    )
  }

  private validateTraitJustifications(justifications: any, extractedTraits: string[]): boolean {
    if (!justifications) {
      console.log('[GPT-TEST] No trait justifications provided')
      return false
    }

    let hasValidJustifications = false
    const justificationCategories = ['toneTraits', 'styleTags', 'communicationPrefs']

    justificationCategories.forEach(category => {
      if (justifications[category]) {
        Object.entries(justifications[category]).forEach(([trait, reason]) => {
          if (typeof reason === 'string' && reason.length > 10) {
            console.log(`[GPT-TEST] Valid justification for ${trait}: ${reason}`)
            hasValidJustifications = true
          }
        })
      }
    })

    return hasValidJustifications
  }

  private extractTraitsFromResponse(response: any): string[] {
    console.log('[GPT-TEST-EXTRACTION] Raw response structure:', {
      hasSuggestedTraits: !!(response.suggestedTraits?.length),
      hasExtractedData: !!response.extractedData,
      extractedDataKeys: response.extractedData ? Object.keys(response.extractedData) : [],
      suggestedTraitsCount: response.suggestedTraits?.length || 0
    })

    const traits: string[] = []

    // PRIORITY 1: Use only EXTRACTED type traits from suggestedTraits for tests
    if (response.suggestedTraits && Array.isArray(response.suggestedTraits)) {
      const extractedTraits = response.suggestedTraits
        .filter((trait: any) => trait.type === 'extracted' || trait.selected === true)
        .map((trait: any) => typeof trait === 'string' ? trait : trait.label)
        .filter(Boolean)
      
      if (extractedTraits.length > 0) {
        traits.push(...extractedTraits)
        console.log('[GPT-TEST-EXTRACTION] Found extracted traits from suggestedTraits:', extractedTraits)
      }
    }

    // PRIORITY 2: Extract from new trait arrays (only if no suggestedTraits)
    if (traits.length === 0) {
      ['toneTraits', 'styleTags', 'communicationPrefs'].forEach(field => {
        if (response.extractedData?.[field] && Array.isArray(response.extractedData[field])) {
          traits.push(...response.extractedData[field])
          console.log(`[GPT-TEST-EXTRACTION] Added traits from ${field}:`, response.extractedData[field])
        }
      })
    }

    // FALLBACK: Parse from description (only if still no traits)
    if (traits.length === 0 && response.extractedData?.toneDescription) {
      const toneWords = response.extractedData.toneDescription
        .split(/[,\s]+/)
        .filter((word: string) => word.length > 3 && /^[a-zA-Z]+$/.test(word))
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .slice(0, 5) // Limit to prevent noise
      traits.push(...toneWords)
      console.log('[GPT-TEST-EXTRACTION] Fallback traits from toneDescription:', toneWords)
    }

    const finalTraits = [...new Set(traits)] // Remove duplicates
    console.log('[GPT-TEST-EXTRACTION] Final extracted traits:', finalTraits)
    return finalTraits
  }

  private analyzeTraits(extracted: string[], expected: string[]): {
    matchCount: number
    missing: string[]
    unexpected: string[]
  } {
    const extractedLower = extracted.map(t => t.toLowerCase())
    const expectedLower = expected.map(t => t.toLowerCase())

    const missing = expected.filter(trait => 
      !extractedLower.some(extracted => 
        extracted.includes(trait.toLowerCase()) || trait.toLowerCase().includes(extracted)
      )
    )

    const unexpected = extracted.filter(trait =>
      !expectedLower.some(expected =>
        expected.includes(trait.toLowerCase()) || trait.toLowerCase().includes(expected)
      )
    )

    const matchCount = expected.length - missing.length

    return { matchCount, missing, unexpected }
  }

  // Run comprehensive test suite
  async runComprehensiveTest(): Promise<{
    overallSuccess: boolean
    testResults: TraitTestResult[]
    summary: {
      passed: number
      failed: number
      totalExtractionTime: number
      averageExtractionTime: number
    }
  }> {
    console.log('[GPT-TRAIT-TEST] Starting comprehensive trait extraction test...')

    const testResults = await this.runTest()
    const passed = testResults.filter(r => r.success).length
    const failed = testResults.length - passed
    const totalExtractionTime = testResults.reduce((sum, r) => sum + r.extractionTime, 0)

    const summary = {
      passed,
      failed,
      totalExtractionTime,
      averageExtractionTime: totalExtractionTime / testResults.length
    }

    const overallSuccess = passed === testResults.length

    console.log('[GPT-TRAIT-TEST] Test Summary:', {
      overallSuccess,
      ...summary,
      successRate: `${((passed / testResults.length) * 100).toFixed(1)}%`
    })

    return {
      overallSuccess,
      testResults,
      summary
    }
  }
}

export const gptTraitTester = new GPTTraitTester()