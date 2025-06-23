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
      // Call the personality extraction endpoint directly
      const response = await fetch('/api/ai/personality-extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: testPayload.messages,
          currentConfig: {},
          initialMessage: false
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

      return {
        success,
        extractedTraits,
        expectedTraits: testPayload.expectedTraits,
        missingTraits: analysis.missing,
        unexpectedTraits: analysis.unexpected,
        aiResponseValid,
        extractionTime,
        ...(success ? {} : { error: `Only ${analysis.matchCount}/${testPayload.expectedTraits.length} expected traits found` })
      }

    } catch (error: any) {
      return {
        success: false,
        extractedTraits: [],
        expectedTraits: testPayload.expectedTraits,
        missingTraits: testPayload.expectedTraits,
        unexpectedTraits: [],
        aiResponseValid: false,
        extractionTime: Date.now() - startTime,
        error: error.message
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
    const traits: string[] = []

    // Extract from suggestedTraits
    if (response.suggestedTraits && Array.isArray(response.suggestedTraits)) {
      traits.push(...response.suggestedTraits.map((trait: any) => 
        typeof trait === 'string' ? trait : trait.label
      ).filter(Boolean))
    }

    // Extract from extractedData.toneTraits (NEW)
    if (response.extractedData?.toneTraits && Array.isArray(response.extractedData.toneTraits)) {
      traits.push(...response.extractedData.toneTraits)
    }

    // Extract from extractedData.styleTags
    if (response.extractedData?.styleTags && Array.isArray(response.extractedData.styleTags)) {
      traits.push(...response.extractedData.styleTags)
    }

    // Extract from extractedData.communicationPrefs (NEW)
    if (response.extractedData?.communicationPrefs && Array.isArray(response.extractedData.communicationPrefs)) {
      traits.push(...response.extractedData.communicationPrefs)
    }

    // Extract from toneDescription (fallback for legacy responses)
    if (response.extractedData?.toneDescription && traits.length === 0) {
      const toneWords = response.extractedData.toneDescription
        .split(/[,\s]+/)
        .filter((word: string) => word.length > 3 && /^[a-zA-Z]+$/.test(word))
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      traits.push(...toneWords)
    }

    return [...new Set(traits)] // Remove duplicates
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