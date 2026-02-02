import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { connectDB } from "../db";

const router = Router();

const generateToken = (id: string) => {
  const secret = process.env.JWT_SECRET || "secret123";
  return jwt.sign({ id }, secret, { expiresIn: "30d" });
};

// Signup route
router.post("/signup", async (req: Request, res: Response) => {
  try {
    await connectDB();

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = generateToken(user._id.toString());

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res
      .status(500)
      .json({
        message: error instanceof Error ? error.message : "Signup failed",
      });
  }
});

// Login route
router.post("/login", async (req: Request, res: Response) => {
  try {
    await connectDB();

    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id.toString());

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json({
        message: error instanceof Error ? error.message : "Login failed",
      });
  }
});

export default router;
