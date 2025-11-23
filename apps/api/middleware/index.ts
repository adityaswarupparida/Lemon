import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
const jwtSecret = process.env.JWT_SECRET!;

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header) {
        res.status(409).json({
            message: "Unauthorized"
        })
        return;
    }
    const decodedData = jwt.verify(header, jwtSecret);
    req.userId = (decodedData as JwtPayload).sub;
    next();
}