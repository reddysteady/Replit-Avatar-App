// Quick test script for GPT extraction debugging
import fetch from 'node-fetch';

async function testGPTExtraction() {
  console.log('Testing GPT extraction endpoint...');
  
  try {
    const response = await fetch('http://localhost:5000/api/ai/personality-extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'I love making people laugh with my content. I use humor and comedy to connect with my audience.' }
        ],
        currentConfig: {},
        initialMessage: false
      })
    });
    
    const data = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
    
    if (data.fallbackUsed) {
      console.log('❌ GPT extraction failed - using fallback response');
    } else {
      console.log('✅ GPT extraction successful');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testGPTExtraction();