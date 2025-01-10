const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    jwt.verify(token, "your_secret_key", (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ 
            error: "Token expired", 
            isExpired: true 
          });
        }
        return res.status(401).json({ error: "Invalid token" });
      }

      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
};

module.exports = authenticate;
