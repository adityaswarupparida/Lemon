import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
const jwtSecret = process.env.JWT_SECRET!;

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization; // "Bearer <token>"
    if (!header) {
        res.status(409).json({
            message: "Unauthorized"
        })
        return;
    }
    const parts = header.split(" ");  

    if (parts.length !== 2 || parts[0] !== "Bearer") {
        return res.status(401).json({ 
            message: "Invalid Authorization header" 
        });
    }
    const token = parts[1];
    const decodedData = jwt.verify(token, jwtSecret);
    req.userId = (decodedData as JwtPayload).sub;
    next();
}