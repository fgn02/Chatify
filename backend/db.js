const mysql = require("mysql2");

// Create a connection to the database
const db = mysql.createConnection({
  host: process.env.DB_HOST, // Host provided by Railway
  user: process.env.DB_USER, // Username provided by Railway
  password: process.env.DB_PASSWORD, // Password provided by Railway
  database: process.env.DB_NAME, // Database name provided by Railway
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
