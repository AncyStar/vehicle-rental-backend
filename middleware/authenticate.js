const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("🔹 Auth Header Received:", authHeader); // Debugging log

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("No token provided");
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    let verified;
    try {
      verified = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      console.error("Token verification failed:", error.message);
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    const user = await User.findById(verified.id).select("-password");

    if (!user) {
      console.error("User not found");
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    req.user = user;
    console.log("User Authenticated:", user.email);
    next();
  } catch (error) {
    console.error("Unexpected Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admins only" });
  }
  next();
};

module.exports = { authenticate, isAdmin };
