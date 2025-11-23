import { Router } from "express";
import { UserSchema } from "../types";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "@repo/db";
const router = Router();
const saltRounds = parseInt(process.env.SALT_ROUNDS!);
const jwtSecret = process.env.JWT_SECRET!;

router.post("/signup", async (req, res) => {
    const parsedBody = UserSchema.safeParse(req.body);

    if (!parsedBody.success || !parsedBody.data) {
        res.status(400).json({
            error: parsedBody.error
        })
        return
    }

    try {  
        let hashedPassword = await bcrypt.hash(parsedBody.data.password, saltRounds);
        const user = await prisma.user.create({
            data: {
                firstName: parsedBody.data.firstName,
                lastName: parsedBody.data.lastName,
                email: parsedBody.data.email,
                password: hashedPassword
            }
        });
        console.log(user)

        res.json({
            user: user.id
        })
    } catch (e) {
        res.status(409).json({
            message: "Error while signing up "+ e
        })
    }
});

router.post("/signin", async (req, res) => {
    try {  
        const { username, password } = req.body;
        const user = await prisma.user.findFirst({
            where: {
                email: username
            }
        })

        if (!user) {
            res.status(409).json({
                message: "Unauthorized"
            })
            return
        }

        const matched = await bcrypt.compare(password, user.password);
        if (!matched) {
            res.status(400).json({
                error: "Bad Request: Incorrect Password"
            });
            return;
        }

        const token = jwt.sign({
            sub: user.id
        }, jwtSecret);

        res.json({
            token
        })
    } catch(e) {
        res.status(500).json({
            message: "Internal Server Error"
        })
    }
});


export default router;