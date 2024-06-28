import { Router } from "express";
import {
  deleteAvatar,
  getUser,
  getUsers,
  loginUser,
  logoutUser,
  registerUser,
  uploadAvatar,
} from "../../controllers/user.controller.js";
import { upload } from "../../middlewares/multer.middleware.js";
import { validateJwt } from "../../middlewares/auth.middleware.js";

const userRouter = Router();

//unsecured routes
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/upload-avatar", upload.single("avatar"), uploadAvatar);
userRouter.delete("/delete-avatar/:id", deleteAvatar);

//secured routes
userRouter.get("/logout", validateJwt, logoutUser);
userRouter.get("/", validateJwt, getUsers);
userRouter.get("/:id", validateJwt, getUser);

export default userRouter;
