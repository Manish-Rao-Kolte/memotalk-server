import { Router } from "express";
import {
  addFriends,
  getChatFriendAndUsers,
  getUser,
  getUsers,
  loginUser,
  logoutUser,
  registerUser,
} from "../../controllers/user.controller.js";
import { upload } from "../../middlewares/multer.middleware.js";
import { validateJwt } from "../../middlewares/auth.middleware.js";

const userRouter = Router();

//unsecured routes
userRouter.post("/register", upload.single("avatar"), registerUser);
userRouter.post("/login", loginUser);

//secured routes
userRouter.get("/", validateJwt, getUsers);
userRouter.get("/signout", validateJwt, logoutUser);
userRouter.get("/chat-friends-user", validateJwt, getChatFriendAndUsers);
userRouter.get("/:id", validateJwt, getUser);
userRouter.post("/add-friends", validateJwt, addFriends);

export default userRouter;
