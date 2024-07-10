import { Router } from "express";
import { validateJwt } from "../../middlewares/auth.middleware.js";
import {
  createMessage,
  getMessages,
  markMessageAsRead,
  markMessagesAsRead,
} from "../../controllers/message.controller.js";
import { upload } from "../../middlewares/multer.middleware.js";

const messageRouter = Router();

//secured route
messageRouter.get("/", validateJwt, getMessages);
messageRouter.post(
  "/create",
  validateJwt,
  upload.single("file"),
  createMessage
);
messageRouter.patch("/update/mark-read", validateJwt, markMessagesAsRead);
messageRouter.patch("/update-one", validateJwt, markMessageAsRead);

export default messageRouter;
