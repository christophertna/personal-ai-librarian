// Handles adding documents to your library.
//
// POST /api/documents/ingest  — upload a document (protected)
// GET  /api/documents         — list your documents (protected)

const express  = require('express');

// mySQL connection 
const pool     = require('../db/connection');

// recall the token verification function in authMiddleware.js
const protect  = require('../middleware/authMiddleware');

const router = express.Router();


// HELPER: Split text into chunks
//
// Long documents are split into smaller pieces ("chunks")
// This is important because:
//   1. We only want to give the AI the RELEVANT part, not everything
//   2. MySQL full-text search works better on smaller pieces

// This function splits text into chunks of about 500 characters, trying to split on paragraph breaks when possible.
function splitIntoChunks(text, chunkSize = 500) {

  // Split the text into paragraphs first (split on blank lines)
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  const chunks = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {

    // If adding this paragraph would make the chunk too big,
    // save the current chunk and start a new one
    if (currentChunk.length + paragraph.length > chunkSize && currentChunk.length > 0) {

      chunks.push(currentChunk.trim());

      currentChunk = '';
    }
    currentChunk += paragraph + '\n\n';
  }

  // the last chunk
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}


// INGEST — POST /api/documents/ingest
// Protected route (requires JWT token)
router.post('/ingest', protect, async (req, res) => {

  // STEP 1: Get the document title and content from req.body
  // Also get the logged-in user's ID from req.user
  // (The authMiddleware puts it there for you!)

  // Get title, content from body and userId from req.user

  try {
  const { title, content } = req.body; // recall req.body is the data sent by the frontend (title and content of the document)

  const userId = req.user.id;// comes from authMiddleware — remember it decoded the JWT and attached the user info to req. So you know exactly who is uploading without asking them.

  // Validate — return 400 if title or content is missing
  if (!title || !content) return res.status(400).json({ message: 'Title and content are required' });


  // STEP 2: Save the document record to the documents table
  // You need to insert a new row into the documents table, which gives you a document ID.
  // You'll use that document ID when you save the chunks, to link them together.

  const [docResult] = await pool.execute(

    'INSERT INTO documents (user_id, title) VALUES (?, ?)',
    [userId, title]

    /*
    This creates a row in the documents table — just the title and who owns it. 
    No content yet. MySQL automatically assigns it an ID, which you grab with insertId. 
    You need this ID because every chunk needs to know which document it belongs to.
    */

    );
  
  const documentId = docResult.insertId; // MySQL gives you the new row's ID


  // STEP 3: Split the content into chunks, then save each chunk.

  const chunks = splitIntoChunks(content);

    for (let i=0; i < chunks.length; i++) {

      await pool.execute(

        'INSERT INTO chunks (document_id, user_id, content, chunk_index) VALUES (?, ?, ?, ?)',
        [documentId, userId, chunks[i], i]

        /*
        splitIntoChunks breaks the text into paragraphs. Then the loop saves each one individually as a row in the chunks table. Each chunk knows:

        -which document it came from (documentId)
        -who owns it (userId) — for security so users only search their own chunks
        -the actual text (chunks[i])
        -its position (i) — so you know chunk 0 came before chunk 1
        */

      );
    }

  // Send success response with how many chunks were created
    res.status(201).json({ message: 'Document ingested/uploaded successfully', chunks: chunks.length });

    } catch (error) {

    console.error('Error ingesting document:', error);
    res.status(500).json({ message: 'Error ingesting document' });

    }

});


// LIST DOCUMENTS — GET /api/documents
// Returns all documents for the logged-in user
router.get('/', protect, async (req, res) => {

  // Query the DB for documents belonging to req.user.id
  try{

    const [documents] = await pool.execute(

      'SELECT id, title, created_at FROM documents WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]     

      /*
      Notice it only selects id, title, created_at — not the chunks or content. 
      This is intentional, you only need the metadata for the library list page. 
      Fetching full content here would be slow and wasteful.
      */

      );

      res.json(documents);

    

  } catch (error) {

    console.error('Error fetching documents:', error);
    return res.status(500).json({ message: 'Error fetching documents' });
  }

  
}); 


module.exports = router;
