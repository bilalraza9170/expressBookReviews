const express = require("express");
const jwt = require("jsonwebtoken");
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => {
  return users.some((users) => users.username === username);
};

// Check if the user with the given username and password exists
const authenticatedUser = (username, password) => {
  // Filter the users array for any user with the same username and password
  let validusers = users.filter((user) => {
    return user.username === username && user.password === password;
  });
  // Return true if any valid user is found, otherwise false
  if (validusers.length > 0) {
    return true;
  } else {
    return false;
  }
};
//only registered users can login
regd_users.post("/login", (req, res) => {
  const username = req.query.username;
  const password = req.query.password;
  // Check if username or password is missing
  if (!username || !password) {
    return res.status(404).json({ message: "Error logging in" });
  }
  // Authenticate user
  if (authenticatedUser(username, password)) {
    // Generate JWT access token
    let accessToken = jwt.sign(
      {
        data: password,
      },
      "access",
      { expiresIn: 60 * 60 }
    );
    // Store access token and username in session
    req.session.authorization = {
      accessToken,
      username,
    };
    return res.status(200).send("User successfully logged in");
  } else {
    return res
      .status(208)
      .json({ message: "Invalid Login. Check username and password" });
  }
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.body.review;
  const token = req.header("Authorization").replace("Bearer ", "");

  try {
    const decoded = jwt.verify(token, 'access');
    const user = users.find((user) => user.username === decoded.username);

    if (!books[isbn]) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (!books[isbn].reviews) {
      books[isbn].reviews = [];
    }

    const reviewsBooks = books[isbn].reviews;
    const reviewUser = Object.keys(reviewsBooks).find(
      (r) => r.username === user
    );

    if (reviewUser) {
      return res.status(400).json({ message: "Review already exists" });
    } else {
      books[isbn].reviews[user] = review;
      return res.status(200).json({ message: "Review added successfully" });
    }
  } catch (error) {
    res.status(400).send("Invalid token");
  }
});

regd_users.delete('/auth/review/:isbn', (req, res) => {
  const isbn = req.params.isbn
  const token = req.headers.authorization.split(' ')[1]

  try {
    const decoded = jwt.verify(token, 'access')
    const username = decoded.username

    if (!books[isbn]) {
      return res.status(404).json({ message: 'Book not found' })
    }
    if (!books[isbn].reviews) {
      return res.status(404).json({ message: 'No reviews found for this book' })
    }

    books[isbn].reviews = Object.keys(books[isbn].reviews).find(
      (r) => r.username !== username
    )
    return res.status(200).json({ message: 'Review deleted successfully' })
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
})


module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
