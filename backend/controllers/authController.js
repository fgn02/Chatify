const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db"); // MySQL connection

const signUp = (req, res) => {
  const { first_name, last_name, email, password } = req.body;

  // Hash the password
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) return res.status(500).json({ error: "Password hashing failed" });

    // Insert the user into the database
    const sql =
      "INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)";
    db.query(
      sql,
      [first_name, last_name, email, hashedPassword],
      (error, result) => {
        if (error) {
          if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ error: "Email already exists" });
          }
          return res.status(500).json({ error: "Database error" });
        }

        // Generate JWT token for the new user
        const token = jwt.sign(
          { id: result.insertId, email: email },
          "your_secret_key",
          { expiresIn: "1h" }
        );

        // Send user details along with the token
        res.status(201).json({
          message: "User registered successfully",
          token,
          user: {
            id: result.insertId,
            first_name: first_name,
            last_name: last_name,
          },
        });
      }
    );
  });
};

const signIn = (req, res) => {
  const { email, password } = req.body;

  // Include picture_url in the SELECT
  const sql = `
    SELECT id, first_name, last_name, email, display_name, password, picture_url
    FROM users 
    WHERE email = ?
  `;

  db.query(sql, [email], (error, results) => {
    if (error) return res.status(500).json({ error: "Database error" });
    if (results.length === 0)
      return res.status(400).json({ error: "User not found" });

    const user = results[0];

    // Compare passwords
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err)
        return res.status(500).json({ error: "Password comparison failed" });
      if (!isMatch)
        return res.status(401).json({ error: "Incorrect password" });

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        "your_secret_key",
        { expiresIn: "1h" }
      );

      // Remove password from user object before sending response
      delete user.password;

      // Send user details along with the token
      res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          display_name: user.display_name,
          email: user.email,
          picture_url: user.picture_url,
        },
      });
    });
  });
};

module.exports = { signUp, signIn };
