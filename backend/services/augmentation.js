// THE PROMPT BUILDER: Takes the user's question
// and the retrieved chunks, and combines them into
// a single, well-structured prompt for the AI model
//
// This is the "A" in RAG — Augmentation.
//
// Without this step, you'd just send the question to the AI model
// and it would answer from general knowledge (and might hallucinate, e.g not enough context, will answer in general).
//
// With this step, you're essentially handing the AI model an "open book"
// and saying "answer ONLY using what's in this book."


// buildAugmentedPrompt
//
// @param {string} question  - The user's original question
// @param {Array}  chunks    - Array of chunk objects from retrieval.js
//                             Each has: { content, title, chunk_index }
// @returns {string}         - The full prompt string to send to the AI model
// ============================================
function buildAugmentedPrompt(question, chunks) {
  
  // STEP 1: Handle the case where no chunks were found.

  // If retrieval found nothing relevant, tell the AI model that,
  // so it doesn't make something up.

  if (chunks.length === 0) {
    return `User asked: "${question}"
    But there are no relevant documents in the SQL db about this topic.
    Please upload a relevant document first.`;
  } // future tip: maybe we exit early instead of building a prompt for the AI in the first place if we get here.

  // STEP 2: Format the chunks into readable context text
  // Use .map() to transform each chunk into a formatted string,
  // then .join() to combine them.

  const contextText = chunks.map((chunk, index) => {
    return `--- Source ${index + 1}: "${chunk.title}" ---\n${chunk.content}`;
  }).join('\n\n');

  // This creates something like:
  //   --- Source 1: "Project Notes March" ---
  //   We identified three main risks: budget overrun, timeline...
  //
  //   --- Source 2: "Meeting Minutes" ---
  //   The team discussed...

  
  // STEP 3: Build the final prompt string.
  //
  // This is the most important part: The prompt structure teaches the model
  // how to behave, given a specific scenario/context. A good RAG prompt:
  //   1. Gives the AI model the context (the retrieved, relevant chunks)
  //   2. Tells it to ONLY use that context (prevents hallucination)
  //   3. Asks the actual question
 
  // Return the complete prompt string
  return `You are a helpful assistant answering questions about a personal document library.

  CONTEXT: 
  ${contextText}

  QUESTION: ${question}

  ANSWER:`;


} // we return the contextText that we just built using the mapped chunks we got from retrieval.js
// we also include the original question with ${question} in the prompt

module.exports = { buildAugmentedPrompt };
