const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Token missing or invalid" });
    }

    const token = authHeader.split(" ")[1];
    console.log("Extracted Token:", token); // Debugging

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Token is required" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined in .env!");
      return res
        .status(500)
        .json({ message: "Server error: JWT secret missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded); // Debugging

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error.message);
    res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
  }
};

const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ message: "Unauthorized: User not authenticated" });
  }
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Forbidden: Admin access required" });
  }
  next();
};

module.exports = { authenticate, isAdmin };
