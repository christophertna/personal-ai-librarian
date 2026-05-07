-- Run this file in MySQL to set up your tables
-- Command: mysql -u root -p < db/schema.sql


CREATE DATABASE IF NOT EXISTS ai_librarian;
USE ai_librarian;

-- --------------------------
-- USERS TABLE
-- Stores login credentials.
-- bcryptjs will hash passwords before storing them (never store plain text!).
-- --------------------------
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  username   VARCHAR(100) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,   -- This will be a bcrypt hash, not the real password
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------
-- DOCUMENTS TABLE
-- Stores the raw documents you upload to your library.
-- Think of this as the "book shelf" metadata.
-- --------------------------
CREATE TABLE IF NOT EXISTS documents (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  title      VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- --------------------------
-- CHUNKS TABLE
-- This is the heart of RAG. Documents are split into smaller "chunks"
-- so we can find the most relevant paragraph, not just the whole document.
--
-- FULLTEXT index is the magic: it lets MySQL search for keywords
-- across all chunks very efficiently.
-- --------------------------
CREATE TABLE IF NOT EXISTS chunks (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  document_id INT NOT NULL,
  user_id     INT NOT NULL,
  content     TEXT NOT NULL,           -- The actual text of this chunk
  chunk_index INT NOT NULL,            -- Which chunk in the document (0, 1, 2...)
  FOREIGN KEY (document_id) REFERENCES documents(id),
  FOREIGN KEY (user_id)     REFERENCES users(id),

  -- HINT: This FULLTEXT index is what makes keyword search possible.
  -- Your retrieval.js will use MATCH(content) AGAINST(?) to search it.
  FULLTEXT INDEX ft_content (content)
);
