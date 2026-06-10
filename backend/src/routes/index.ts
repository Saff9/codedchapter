import { Router, type IRouter } from "express";
import healthRouter from "./health";
import postsRouter from "./posts";
import commentsRouter from "./comments";
import profilesRouter from "./profiles";
import doubtsRouter from "./doubts";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/posts", postsRouter);
router.use("/posts/:postId/comments", commentsRouter);
router.use("/profiles", profilesRouter);
router.use("/doubts", doubtsRouter);

export default router;
