import { Router } from "express";
import userRouter from "./user";
import chatRouter from "./chat";
import messageRouter from "./message";
import { authMiddleware } from "../middleware";

const router = Router();

router.use("/user", userRouter);

router.use(authMiddleware);
router.use("/chat", chatRouter);
router.use("/message", messageRouter);

export default router;