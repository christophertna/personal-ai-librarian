# 📚 Personal AI Librarian

A beginner/simple Retrieval-Augmented Generation (RAG) application.
You ask questions. It searches your document library. It gives an AI model (OpenAI in this case) the right context to answer accurately.

## Project Structure

```
ai-librarian/
├── backend/
│   ├── server.js              ← Entry point, sets up Express.
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

## How RAG Works (Concept)

Normal AI: User question → AI answers from memory (can hallucinate/answers too generally)

RAG:        User question → Search your DB for relevant text/chunks of texts from uploaded documents
                         → Give texts/chunks to the AI as context
                         → AI answers ONLY from that specific context only

## Setup Steps

1. `npm install`
2. Fill in your `.env` file
3. Run the SQL in `db/schema.sql` to create your tables
4. `npm run dev`

## Learning Goals

- Understand how JWT authentication works
- Understand how to search a database
- Understand how to build a prompt for an AI
- Understand how to call an external API

## In Action
<img width="1919" height="911" alt="Upload Documents" src="https://github.com/user-attachments/assets/6f47660b-4037-4728-84a1-52646fde5ad6" />
<br>
<img width="1919" height="904" alt="Question Asked" src="https://github.com/user-attachments/assets/da81ab23-95c0-4162-b3f9-d66b3d98843d" />


