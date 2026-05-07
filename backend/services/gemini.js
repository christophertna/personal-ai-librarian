// Sends the augmented prompt to the OpenAI API
// and returns the AI's response.
//
// This is the "G" in RAG — Generation

// was supposed to be Gemini, but instead I used an OpenAI API,
// which is why all the function and variable names have Gemini

const OpenAI = require('openai');
require('dotenv').config();


// Initialize the OpenAI client with your API key, the key comes from .env
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// object already comes with methods built in (they were defined inside the library by OpenAI's engineers)


// callGemini (calling openAi)
// (keeping the name so nothing else in the app breaks)
// @param {string} prompt  - The full augmented prompt from augmentation.js
// @returns {string}       - OpenAI's text response

async function callGemini(prompt) {

  try {
  // STEP 1: Get the model.
  // Instead of getting a model object like Gemini, OpenAI lets you specify
  // the model directly in the API call

  // STEP 2: Generate content.
  // OpenAI uses a 'messages' array instead of a single prompt string.
  // 'role: user' means this message is coming from the user side.
  const GEMINI_result = await openai.chat.completions.create({
    model: 'gpt-4o-mini',          
    messages: [{ role: 'user', content: prompt }] // the prompt wrapped in a messages array
  }); // await to actually WAIT for this line to finish
      // await only works inside an async function (callGemini(prompt))

  // OpenAI returns a result object that contains CHOICES (array of possible responses)
  // we always take the first choice [0], then .message.content to get the actual text
  const GEMINI_response = GEMINI_result.choices[0].message;
  // similar to Gemini's GEMINI_result.response — just a different structure

  // extracting text from RESPONSE OBJECT
  // OpenAI uses .content instead of .text() — no parentheses, it's a property not a method
  const GEMINI_text = GEMINI_response.content;

  return GEMINI_text; // return the text back to the caller (ask.js)

  } catch (error) {
    console.error('Failed to get OpenAI API response:', error.message);
    throw new Error('Failed to get response from AI');
  }

}


module.exports = { callGemini };