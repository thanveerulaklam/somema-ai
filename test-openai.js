// Simple test script to verify OpenAI API key
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '.env.local');
let OPENAI_API_KEY = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/NEXT_PUBLIC_OPENAI_API_KEY=(.+)/);
  if (match) {
    OPENAI_API_KEY = match[1].trim();
  }
}

const OPENAI_BASE_URL = 'https://api.openai.com/v1';

console.log('Testing OpenAI API connection...');
console.log('API Key exists:', !!OPENAI_API_KEY);
console.log('API Key length:', OPENAI_API_KEY ? OPENAI_API_KEY.length : 0);

if (!OPENAI_API_KEY) {
  console.error('❌ OpenAI API key not found in .env.local');
  console.log('Please add NEXT_PUBLIC_OPENAI_API_KEY=your_key_here to .env.local');
  process.exit(1);
}

async function testOpenAI() {
  try {
    console.log('Testing with gpt-4o-mini model...');
    
    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: 'Say "Hello, OpenAI API is working!"'
          }
        ],
        max_tokens: 50,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ OpenAI API error:', response.status, errorData);
      return;
    }

    const data = await response.json();
    console.log('✅ OpenAI API is working!');
    console.log('Response:', data.choices[0].message.content);
    
  } catch (error) {
    console.error('❌ Error testing OpenAI API:', error.message);
  }
}

testOpenAI(); 