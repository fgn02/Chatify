const mysql = require("mysql2");

// Create a connection to the database
const db = mysql.createConnection({
  host: process.env.DB_HOST, // Environment variable for database host
  user: process.env.DB_USER, // Environment variable for database user
  password: process.env.DB_PASSWORD, // Environment variable for database password
  database: process.env.DB_NAME, // Environment variable for database name
  port: process.env.DB_PORT || 3306, // Default MySQL port
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
