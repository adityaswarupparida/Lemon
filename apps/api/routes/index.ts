import { Router } from "express";
import userRouter from "./user";
import chatRouter from "./chat";
import messageRouter from "./message";
import shareRouter from "./share";
import { authMiddleware } from "../middleware";

const router = Router();

router.use("/user", userRouter);
router.use("/share", shareRouter); // Public - no auth

router.use(authMiddleware);
router.use("/chat", chatRouter);
router.use("/message", messageRouter);

export default router;