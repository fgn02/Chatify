const mysql = require("mysql2");

// Create a connection to the database
const db = mysql.createConnection({
  host: "localhost", // Replace with your database host
  user: "root", // Replace with your MySQL username
  password: "Fagun1397@", // Replace with your MySQL password
  database: "chatify", // Replace with your database name
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err.stack);
    return;
  }
  console.log("Connected to the database.");
});

module.exports = db;
