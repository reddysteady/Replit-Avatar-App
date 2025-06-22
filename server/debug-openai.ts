/**
 * OpenAI Debug Utility
 * Tests OpenAI API connection and diagnoses issues
 */

import OpenAI from 'openai'
import { storage } from './storage'

export async function debugOpenAI() {
  console.log('🔍 [OPENAI-DEBUG] Starting OpenAI diagnostic...')
  
  // Check API key sources
  const settings = await storage.getSettings(1)
  const envKey = process.env.OPENAI_API_KEY
  const storageKey = settings.openaiToken
  
  console.log('🔑 [OPENAI-DEBUG] API Key Analysis:', {
    envKeyExists: !!envKey,
    envKeyFormat: envKey ? `${envKey.substring(0, 10)}...` : 'None',
    storageKeyExists: !!storageKey,
    storageKeyFormat: storageKey ? `${storageKey.substring(0, 10)}...` : 'None'
  })
  
  // Determine which key to use
  const apiKey = envKey || storageKey
  if (!apiKey) {
    console.error('❌ [OPENAI-DEBUG] No API key found in environment or storage')
    return { success: false, error: 'No API key found' }
  }
  
  // Validate key format
  const isValidFormat = apiKey.startsWith('sk-') && apiKey.length >= 20
  console.log('✅ [OPENAI-DEBUG] API Key Format:', {
    startsWithSk: apiKey.startsWith('sk-'),
    length: apiKey.length,
    isValid: isValidFormat
  })
  
  if (!isValidFormat) {
    console.error('❌ [OPENAI-DEBUG] Invalid API key format')
    return { success: false, error: 'Invalid API key format' }
  }
  
  // Test API connection
  try {
    console.log('🌐 [OPENAI-DEBUG] Testing API connection...')
    const client = new OpenAI({ apiKey })
    
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hello, this is a test. Respond with "API working"' }],
      max_tokens: 10,
      temperature: 0
    })
    
    const content = response.choices[0]?.message?.content || ''
    console.log('✅ [OPENAI-DEBUG] API Response:', content)
    
    return { 
      success: true, 
      response: content,
      keySource: envKey ? 'environment' : 'storage'
    }
    
  } catch (error: any) {
    console.error('❌ [OPENAI-DEBUG] API Test Failed:', {
      message: error.message,
      code: error.code,
      status: error.status,
      type: error.constructor.name
    })
    
    return { 
      success: false, 
      error: error.message,
      errorCode: error.code,
      errorStatus: error.status 
    }
  }
}

// Test personality extraction specifically
export async function testPersonalityExtraction() {
  console.log('🧠 [PERSONALITY-DEBUG] Testing personality extraction...')
  
  try {
    const response = await fetch('http://localhost:5000/api/ai/personality-extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'I love making people laugh with my content. Comedy is my passion.' }
        ],
        currentConfig: {},
        initialMessage: false
      })
    })
    
    const data = await response.json()
    console.log('🧠 [PERSONALITY-DEBUG] Extraction Result:', {
      success: response.ok,
      status: response.status,
      hasResponse: !!data.response,
      extractedFields: Object.keys(data.extractedData || {}),
      suggestedTraits: data.suggestedTraits?.length || 0,
      fallbackUsed: data.fallbackUsed
    })
    
    return { success: response.ok, data }
    
  } catch (error: any) {
    console.error('❌ [PERSONALITY-DEBUG] Extraction test failed:', error.message)
    return { success: false, error: error.message }
  }
}