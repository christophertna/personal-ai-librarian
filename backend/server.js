// This is the entry point of the app.
// It sets up Express and connects all the routes.

const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const app = express();

// --- Middleware ---
// These run on EVERY request before your routes.

// Allows your frontend (different port) to talk to your backend
app.use(cors());

// Lets Express read JSON request bodies (req.body)
app.use(express.json());

// Serve frontend files as static HTML/CSS/JS
app.use(express.static(path.join(__dirname, '../frontend')));


// --- Routes ---
// Each file handles a group of related endpoints.

const authRoutes = require('./routes/auth');
//That means any request that starts with /api/auth gets sent to auth.js to handle. 
// The route file is like a receptionist — it listens for specific requests and decides what to do with them.

const documentRoutes  = require('./routes/documents');
const askRoutes       = require('./routes/ask');

app.use('/api/auth',      authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api',           askRoutes);


// --- Start the server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📚 Open your browser and go to http://localhost:${PORT}`);
});
