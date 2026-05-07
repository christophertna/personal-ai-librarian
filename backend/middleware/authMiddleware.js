// This middleware "guards" routes that require login.
// It checks the request for a VALID JWT token.

/*
 In Express, middleware functions sit between the request arriving and the route handler running. 
 next() is how you say "I'm done, pass this request along to the actual route handler now."

 Control flow: request arrives
→ protect() runs first
  → if no token: stop, send 401
  → if valid token: call next() → route handler runs
*/

// HOW IT WORKS:
// 1. The frontend sends a token in the request header, like this:
//    Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
// 2. This middleware reads that header
// 3. It verifies the token is using your JWT_SECRET
// 4. If valid → it adds the user info to req.user and calls next()
// 5. If invalid → it sends back a 401 Unauthorized error
//
// USAGE: In any route file, import this and add it as a parameter:
//   const protect = require('../middleware/authMiddleware');
//   router.get('/secret', protect, (req, res) => { ... });

const jwt = require('jsonwebtoken');
require('dotenv').config();

const protect = (req, res, next) => {
  // STEP 1: Read the token from the request header.

  // The header looks like: "Bearer eyJhbGci..."
  // You need to get req.headers.authorization
  // Then split it by ' ' (space) and take the second part [1]

  // The full authorization header looks like this:
  // "Bearer eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MX0.abc123..."
  // So authHeader is that entire string — both the word "Bearer" and the token after it combined.

  const authHeader = req.headers.authorization;
  // req.body     ← the data sent in the request (username, password, question)
  // req.headers  ← metadata about the request (token, content type, etc.)

  // Check if authHeader exists AND starts with 'Bearer '
  // If not, return res.status(401).json({ message: 'No token provided' })

    if (!authHeader || !authHeader.startsWith('Bearer ')){
      return res.status(401).json({ message: 'No token provided' });
    }

  // Extract just the token part (everything after "Bearer ")
  const token = authHeader.split(' ')[1]; // split the header by space and take the second part (the token)
 
  // STEP 2: Verify the token.

  // It will throw an error if the token is invalid or expired.
  // If it's valid, it returns the decoded payload (the data
  // you stored inside the token when you created it).

    try { 

       // verify the token using the secret key. If valid, it returns the decoded payload (the data you stored inside the token when you created it)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // jwt.verify() checks token's signature, checks it hasnt expired and decodes & returns the payload

      /* Example:
       what you put IN during login (auth.js):
      jwt.sign({ id: user.id, username: user.username }, secret)

      what you get OUT during verify (authMiddleware.js):
      const decoded = jwt.verify(token, secret)
      decoded = { id: 1, username: "alice", iat: ..., exp: ... }
                   ↑ your data        ↑ these are added automatically by JWT (issued at, expires)
      */

      req.user = decoded; // store the decoded payload (user info) in req.user so later route handlers can access it
      // Remember req is the object that travels through your entire request pipeline. 
      // By attaching decoded to it, you're essentially leaving a note on the request that any later code can read.

      next(); // actually move on to the route handler now that we've verified the user

    } catch (error) {

      return res.status(401).json({ message: 'Invalid or expired token' });

    }

};

module.exports = protect;
