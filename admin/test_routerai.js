const { createOpenAI } = require('@ai-sdk/openai');
const { generateText } = require('ai');
require('dotenv').config();

const openai = createOpenAI({
  baseURL: 'https://routerai.ru/api/v1',
  apiKey: process.env.ROUTERAI_API_KEY || 'sk-or-v1-dummy',
  headers: {
    'HTTP-Referer': 'http://localhost:3000',
    'X-Title': 'Chat Bot Platform'
  }
});

async function run() {
  try {
    const { text } = await generateText({
      model: openai('openai/gpt-4o-mini'), // assume some model
      prompt: 'Hello'
    });
    console.log('Success:', text);
  } catch (err) {
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
  }
}
run();
