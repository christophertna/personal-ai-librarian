// THE MAIN EVENT: This route ties together all three
// services into the complete RAG pipeline.
//
// POST /api/ask
//
// This is where everything comes together:
//   1. Get the user's question
//   2. Search the DB for relevant chunks  (retrieval.js)
//   3. Build the augmented prompt         (augmentation.js)
//   4. Send to Gemini and get an answer   (gemini.js)
//   5. Return the answer to the frontend

const express     = require('express');
const protect     = require('../middleware/authMiddleware');
const { searchDocuments }    = require('../services/retrieval');
const { buildAugmentedPrompt } = require('../services/augmentation');
const { callGemini }         = require('../services/gemini');

const router = express.Router();


// ASK — POST /api/ask
// Protected route (requires JWT token)
// Expected request body: { question }
router.post('/ask', protect, async (req, res) => {

  // STEP 1: Get the question from the request body.
  // Get the user ID from req.user (set by authMiddleware).
  const { question } = req.body;
  const userId = req.user.id;
  /*
  Almost the same thing in documents.js, recall:

  javascriptconst { title, content } = req.body;
  const userId = req.user.id;

  It's the same pattern every time — get the data the user sent, get who sent it. 
  It repeats in every protected route because every route needs to know what was asked and who is asking.
  */

  // Return 400 if question is missing or empty
  if (!question || question.trim() === '') { // .trim checks if question is just all 'spaces'
    return res.status(400).json({ message: 'Question is required' });
  }


  // STEP 2: Retrieve relevant chunks from the database.
  
  // HINT: const chunks = await searchDocuments(question, userId);
  const chunks = await searchDocuments(question, userId);
  /*
  Calls your retrieval.js service. Passes the question as the search term and userId so it only searches that user's documents. 
  await because it's hitting the database. Returns an array of the most relevant chunk objects.
  */

  // Log what you get back (debugging):
  // console.log(`Found ${chunks.length} relevant chunks`);
  console.log(`Found ${chunks.length} relevant chunks`);
  /*
  The backtick string with ${} is called a template literal — it injects the value directly into the string. 
  */

  // STEP 3: Build the augmented prompt.
  const prompt = buildAugmentedPrompt(question, chunks); //from augmentation.js
  /*
  Calls your augmentation.js service. Passes both the original question and the chunks. 
  Gets back one big formatted string. No await needed
  remember augmentation is pure JavaScript, no database or API calls, so it's instant.
  */

  // dsebugging again
  console.log(prompt); //test the prompt output in the console

  // STEP 4: Send the prompt to the AI model and get the answer.

  try { 

    const answer = await callGemini(prompt);
    /*
    Calls the AI service with the augmented prompt. 
    await because it's calling OpenAI's external API. 
    Returns a plain string — the AI model's answer.
    */

    // STEP 5: Send back the answer plus the sources used.
    // Showing sources builds trust — the user can see WHERE the answer came from.
    res.json({
    /*
    res.json({ answer, sources: ... }) sends two things back to the frontend:
    answer — the plain string Gemini returned
    sources — a transformed version of your chunks array
    */
    answer,

    sources: chunks.map(c => ({title: c.title, snippet: c.content.substring(0,100)}))
    /*
    .map() loops through every chunk and transforms it into a new object: c is each chunk. 
    Instead of sending the full chunk content back, you send just the title and a short snippet. 
    .substring(0, 100) means "give me characters 0 through 100" — just the first 100 characters as a preview so the user can see which documents were used.
    */

  });



  } catch (error) {

    return res.status(500).json({ message: 'AI service error', error: error.message});
  }


});



module.exports = router;
