// Handles two endpoints:
//   POST /api/auth/register  — create a new account
//   POST /api/auth/login     — log in and get a JWT token

const express  = require('express');
// Your app needs to listen for incoming requests (register, login, ask a question) and send back responses. 
// You could build all of that from scratch in plain JavaScript, but it would take hundreds of lines just to get basic things working (have to use Node.js HTTP)

/* Express is a popular library that handles all of that for you. It gives you:

A way to listen on a port (app.listen(3000))
A way to define routes (router.post('/login', ...))
A way to read request bodies (req.body)
A way to send responses (res.json(...)) 
*/

const bcrypt   = require('bcryptjs'); // hashes passwords securely before saving them
// You can never reverse it, which means even if your database gets stolen, nobody can read the passwords

const jwt      = require('jsonwebtoken'); // creates and verifies JWT tokens.
//After a successful LOGIN, you give the user a signed token they carry around like an ID badge.

const pool     = require('../db/connection'); // your MySQL connection. 
// You'll use it to save new users and look up existing ones

require('dotenv').config();

const router = express.Router(); // express.Router() gives a mini version of the whole Express app, just for organizing a group of related routes
//  Instead of defining routes on the whole app, you define them on this smaller router object, then export it. server.js then attaches it under /api/auth.

// Router(): It's a tool already built into Express that lets you group related routes together in their own file, instead of dumping everything into server.js.
/* With Router, each file handles its own group:

auth.js       → handles /api/auth/*
documents.js  → handles /api/documents/*
ask.js        → handles /api/ask

And server.js just connects them cleanly:

javascriptapp.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api', askRoutes);
*/


// REGISTER — POST /api/auth/register

router.post('/register', async (req, res) => { //req = the incoming request (contains the data sent by the user) & res = your response back to them
//router.post('/register', ...) means: "when a POST request comes in for /register, run this function."

// req is an object that contains:
//req.body:        the data the frontend sent ({ username, password })
//req.headers:     things like the Authorization token
//req.params:      URL parameters like /users/:id
//req.user:        added by authMiddleware after token verification

// Express automatically creates the req object when a request comes in

  // STEP 1: Get username and password from the request body.
  const { username, password } = req.body; // destructure username and password from the request body (the data sent by the frontend)

  // Basic validation — return a 400 error if either is missing

  if (!username || !password) return res.status(400).json({message: 'Username and password are required'});
  // if username OR password is missing --> error


  // STEP 2: Hash the password before saving it.
  // NEVER store plain-text passwords in a database.

  // Hash the password
  const hashedPassword = await bcrypt.hash(password,10); // store the newly hashed password into a const var with hash level 10
  // using await (inside a async(req, res) funciton), so need to actually wait until hashing finishes before moving on

  /* debug
  console.log('plain:', password);
  console.log('hashed:', hashedPassword);
  */

  // simple tip for 'await':
  // anything that leaves your JavaScript code → 'await' (ex: talk to db, calling external API, read/write files, hashing password, etc)
  // anything that stays inside your JavaScript code → no need

  // STEP 3: Insert the new user into the database.
  // Insert user into DB (wrap in try/catch in case the username already exists)
  // SQL automatically checks for duplicates for usernames (because it is set to UNIQUE in the database)
  try {
    const [result] = await pool.execute(
      'INSERT INTO users (username, password) VALUES (?,?)', // '?' placeholders for security, preventing SQL injection attacks
      [username, hashedPassword]
    ); 
  } catch (error) {
    return res.status(400).json({ message: 'Username already exists' });
  }

  /*
  pool.execute() always returns an array of two things:
  javascript[rows, fields]

    rows  = the actual data (results of the query)
    fields = metadata about the columns (rarely needed)

    so we destructure/extract the 'rows' element, and place it inside a const var called 'result'

    essentially a shortcut for:
    const response = await pool.execute(...);
    const result = response[0];
  */

  // Send back a success response
  res.status(201).json({ message: 'User created successfully'});

});



// LOGIN — POST /api/auth/login
// It contains the user's ID and username, and is signed with your secret key so it can't be tampered with.

//POST means the request is sending data to your server (as opposed to GET which just asks for data).
router.post('/login', async (req, res) => {
  // STEP 1: Find the user in the database.
  // -Get username and password from req.body
  // -Find user in DB
  // -If no user found → return 401 (don't say "wrong password" specifically,
  // that leaks info. Say "Invalid credentials" for both cases.)

  const { username, password } = req.body;

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE username = ?', // select from ALL the users in the db, match with the user-inputted 'username' (which is the '?')
      [username]
    );
    const user = rows[0]; // since rows is an array and we want the first result, we can just extract it directly into a const var called 'user'

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }


  // STEP 2: Compare the submitted password to the stored hash.

  // Compare passwords
  // If no match → return 401 with 'Invalid credentials'

    const isMatch = await bcrypt.compare(password, user.password); // compare the user-inputted password with the hashed password stored in the database (user.password), returns true/false
    /*
    user.password is the hashed password that already lives in the database, the one you saved during registration.
    bcrypt.compare takes the plain text the user just typed and hashes it the same way, then checks if they match.

    Same password = same hash? NO

    Same password = different hash every time
    This surprises everyone. If two users both use "password123", their stored hashes will look completely different:
    user alice:  "password123" → "$2a$10$xK9mQ2pL7nR4..."
    user bob:    "password123" → "$2a$10$3fGhJ8kM2pQ9..."

    This is because bcrypt adds a RANDOM SALT — a random STRING MIXED INTO THE HASH before hashing. 
    The salt is different every time, so the output is different every time, even for identical passwords.

    Then how does bcrypt.compare know if it matches?

    The salt is actually stored inside the hash string itself. So when you call:
    javascriptbcrypt.compare("password123", "$2a$10$xK9mQ2pL7nR4...")

    Bcrypt reads the salt out of the hash, re-hashes the submitted password using that same salt, then compares the result. If they match, it returns true.
    */

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

  // STEP 3: Create a JWT token.

  /*
  A JWT token has three parts separated by dots:

  header.payload.signature

  The payload (data store inside a JWT/token) is just base64 encoded — not encrypted. Anyone can decode it and read, ex:{ id: 1, username: "alice" }.
  But the signature is created using your JWT_SECRET. If someone tries to change the payload (like changing their id to get admin access), 
  the signature won't match anymore and jwt.verify() will reject it.
  So:

  Anyone can read the payload ← not secret
  Nobody can modify it without being detected ← tamper-proof
  */

  // The payload is NOT secret (it's base64 encoded), but it IS tamper-proof.
  // Anyone can read it, but only someone with JWT_SECRET can create a valid one.

  // Create the token
    const token = jwt.sign(
      { id: user.id, username: user.username }, //payload: the data you want to store in the token. (You can put anything you want, but usually just user's ID and maybe their username)
      // When the user sends this token back on future requests, your authMiddleware can read it and know exactly who they are without hitting the database again.
      
      process.env.JWT_SECRET,
      /*
      'process' is a global object that Node.js automatically provides everywhere — you never import it. It contains information about the running application:

      javascriptprocess.env       // your environment variables from .env
      process.exit()    // stop the application
      process.version   // which version of Node.js is running

      So process.env.JWT_SECRET is just Node.js reading the variable you set in your .env file.
      */

      { expiresIn: process.env.JWT_EXPIRES_IN } // options — token expires after the set amount of days defined in the .env file 
    );

  // Send back the token
    res.json({ token, username: user.username });

  } catch (error) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  

});


module.exports = router;
/*
This is how JavaScript shares things between files. 
By default, everything you write in a file is private to that file. 
module.exports is how you say: "this is the thing I want to make available to other files."
*/
