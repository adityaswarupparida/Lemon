import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
const jwtSecret = process.env.JWT_SECRET!;

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization; // "Bearer <token>"
    if (!header) {
        res.status(401).json({
            message: "Unauthorized"
        });
        return;
    }
    const parts = header.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
        res.status(401).json({
            message: "Invalid Authorization header"
        });
        return;
    }

    const token = parts[1];
    try {
        const decodedData = jwt.verify(token, jwtSecret);
        req.userId = (decodedData as JwtPayload).sub;
        next();
    } catch (error) {
        res.status(401).json({
            message: "Invalid or expired token"
        });
    }
}