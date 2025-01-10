const mysql = require("mysql2");

// Create a connection to the database
const db = mysql.createConnection({
  host: "sql12.freesqldatabase.com", // Your remote database host
  user: "sql12756968", // Your database username
  password: "5zxeyRddJx", // Your database password
  database: "sql12756968", // Your database name
  port: 3306, // Default MySQL port
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
