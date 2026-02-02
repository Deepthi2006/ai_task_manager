import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { id: string };
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || "secret123";
    const decoded = jwt.verify(token, secret) as { id: string };

    req.user = { id: decoded.id };
    next();
  } catch (error) {
    res.status(401).json({ message: "Not authorized, token failed" });
  }
}
