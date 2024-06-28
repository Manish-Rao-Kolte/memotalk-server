import { cookieOptions } from "../constants.js";
import User from "../models/user.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  removeFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import fs from "fs";

const registerUser = asyncHandler(async (req, res) => {
  const { username, fullname, email, password, avatar } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new apiError(401, "User already registered!");
  }

  const user = await User.create({
    username,
    email,
    password,
    fullname,
    avatar,
  });
  if (!user) {
    throw new apiError(500, "Error while registering user!");
  }

  return res
    .status(201)
    .json(new apiResponse(201, true, user, "User registered successfully!"));
});

const uploadAvatar = asyncHandler(async (req, res) => {
  const path = req?.file?.path;
  const instance = await uploadOnCloudinary(path);
  if (!instance || instance?.name === "Error") {
    fs.unlinkSync(path); //deleting file from temp to clear storage.
    console.log(`Error: ${instance.message}`);
    return res
      .status(500)
      .json(new apiResponse(500, false, null, "Error while uploading avatar!"));
  }
  const avatar = {
    url: instance.url,
    public_id: instance.public_id,
  };
  fs.unlinkSync(path);
  return res
    .status(201)
    .json(
      new apiResponse(
        201,
        true,
        avatar,
        "File uploaded successfully on cloudinary!"
      )
    );
});

const deleteAvatar = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await removeFromCloudinary(id);
  if (result !== "ok") {
    throw new apiError(500, "Error while deleting file from cloudinary!");
  }
  return res
    .status(200)
    .json(new apiResponse(200, true, null, "File removed from cloudinary!"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password, confirmPassword } = req.body;
  if (password !== confirmPassword) {
    throw new apiError(401, "Both password does not match!");
  }
  const existingUser = await User.findOne({ email });
  if (!existingUser) {
    return res
      .status(401)
      .json(new apiResponse(401, false, null, "Wrong username or password!"));
  }
  const isPasswordCorrect = await existingUser.isPasswordCorrect(
    password?.trim()
  );
  if (!isPasswordCorrect) {
    return res
      .status(401)
      .json(new apiResponse(401, false, null, "Wrong username or password!"));
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    existingUser
  );
  res
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions);
  const updatedUser = await User.findByIdAndUpdate(
    existingUser._id,
    {
      refreshToken,
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(
      new apiResponse(200, true, updatedUser, "User logged in successfully!")
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      refreshToken: null,
    },
    {
      new: true,
    }
  );

  if (!user) {
    throw new apiError(500, "Erron while logging out!");
  }

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new apiResponse(200, true, null, "User logged out successfully!"));
});

const getUsers = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new apiError(401, "Unauthorizes access!");
  }
  const users = await User.find().select("-password -refreshToken");
  if (!users) {
    throw new apiError(500, "Error while fetching users from database!");
  }
  return res
    .status(200)
    .json(new apiResponse(200, true, users, "Users fetched successfully!"));
});

const getUser = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new apiError(401, "Unauthorized request!");
  }
  return res
    .status(200)
    .json(
      new apiResponse(200, true, req.user, "User data fetched successfully!")
    );
});

const generateAccessAndRefreshToken = async (user) => {
  try {
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(500, "Error while generating tokens!");
  }
};

export {
  registerUser,
  loginUser,
  logoutUser,
  getUsers,
  uploadAvatar,
  deleteAvatar,
  getUser,
};
