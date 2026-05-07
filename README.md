# 📚 Personal AI Librarian

A beginner-friendly RAG (Retrieval-Augmented Generation) app.
You ask questions. It searches your document library. It gives an AI model (OpenAI in this case) the right context to answer accurately.

## Project Structure

```
ai-librarian/
├── backend/
│   ├── server.js              ← Entry point. Sets up Express.
│   ├── routes/
│   │   ├── auth.js            ← Login/register routes 
│   │   ├── documents.js       ← Upload/ingest documents 
│   │   └── ask.js             ← The main RAG question route 
│   ├── middleware/
│   │   └── authMiddleware.js  ← Protects routes with JWT 
│   ├── db/
│   │   └── connection.js      ← MySQL connection setup
│   └── services/
│       ├── retrieval.js       ← Searches MySQL for relevant chunks 
│       ├── augmentation.js    ← Builds the prompt for Gemini (anything gemini named is just OpenAI instead)
│       └── gemini.js          ← Calls the OpenAI API (originally gemini, but had too many issues)
├── frontend/
│   ├── index.html             ← Login page
│   ├── pages/
│   │   ├── library.html       ← Upload documents page
│   │   └── ask.html           ← Ask questions page
│   └── styles/
│       └── main.css           ← Tailwind + custom styles
├── .env                       
└── package.json
```

## How RAG Works (The Big Idea)

Normal AI: User question → AI answers from memory (can hallucinate)

RAG:        User question → Search your DB for relevant text
                         → Give that text to the AI as context
                         → AI answers ONLY from that context (accurate!)

## Setup Steps

1. `npm install`
2. Fill in your `.env` file
3. Run the SQL in `db/schema.sql` to create your tables
4. `npm start`

## Learning Goals

- Understand how JWT authentication works
- Understand how to search a database
- Understand how to build a prompt for an AI
- Understand how to call an external API
