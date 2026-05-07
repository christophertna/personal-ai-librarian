// THE LIBRARIAN'S JOB: Search the database for
// the most relevant chunks of text for a given question.
//
// This is the "R" in RAG — Retrieval.
//
// HOW MYSQL FULL-TEXT SEARCH WORKS:
//   MATCH(content) AGAINST('your search terms' IN NATURAL LANGUAGE MODE)
//   MySQL scores every row by how relevant it is to your search.
//   We ORDER BY that score and take the top results.

// ensure the mySQL connection
const pool = require('../db/connection');


// searchDocuments
// @param {string} query    - The user's question
// @param {number} userId   - Only search THIS user's documents
// @param {number} topK     - How many chunks to return (default set to 3 for now, but can be changed)
// @returns {Array}         - Array of the most relevant chunk objects

async function searchDocuments(query, userId, topK = 3) {

  /*
  topK returns 3 chunks, which are objects

  Each row MySQL returns is a JavaScript object with the columns as properties:
  So 'rows' is an array of 3 objects. This is exactly what gets passed into buildAugmentedPrompt, 
  which is why in augmentation.js you accessed chunk.content and chunk.title on each one.
  */

  // STEP 1: SQL query using FULLTEXT search.
  try {

  // need the actual sql command 'sql' as a string
  const sql = `
   SELECT
      c.content,
      c.chunk_index,
      d.title,
      MATCH(c.content) AGAINST(? IN NATURAL LANGUAGE MODE) AS relevance_score
    FROM chunks c
    JOIN documents d ON c.document_id = d.id
    WHERE c.user_id = ?
      AND MATCH(c.content) AGAINST(? IN NATURAL LANGUAGE MODE) > 0
    ORDER BY relevance_score DESC
    LIMIT ${topK}
    `;
 
  // Notice the query string appears TWICE (once in SELECT, once in WHERE).
  // So your values array will be: [query, userId, query]

  // Write and execute the SQL query
  const [rows] = await pool.execute(sql, [query, userId, query]);

  // Return the rows (the relevant 3 chunks, array of 3 "most relevant" objects)
  return rows; 

  } catch (error) {

    console.error('Error searching documents:', error);
    // retrieval is in services, so not the usual res.status(401).json(...) error handling we do in routes. 
    // Instead, we just log the error and re-throw it so the route handler can catch it and send a response.

    throw error; // re-throw the error so the route handler can catch it and send a response

  }
}


module.exports = { searchDocuments };
