import mongoose from "mongoose";
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

//create user and return data.
const registerUser = asyncHandler(async (req, res) => {
  const { username, fullname, email, password } = req.body;
  const avatarPath = req?.file?.path;
  const avatar = {
    url: "",
    public_id: "",
  };

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    if (avatarPath) fs.unlinkSync(avatarPath);
    throw new apiError(400, "User is already registered!");
  }
  if (avatarPath) {
    const instance = await uploadOnCloudinary(avatarPath);
    if (!instance || instance?.name === "Error") {
      fs.unlinkSync(avatarPath); //deleting file from temp to clear storage.
      throw new apiError(500, "Error while uploading avatar!");
    }
    avatar.url = instance.url;
    avatar.public_id = instance.public_id;
    fs.unlinkSync(avatarPath);
  }

  const newUser = await User.create({
    username,
    email,
    password,
    fullname,
    avatar,
  });
  if (!newUser) {
    await removeFromCloudinary(avatar.public_id);
    throw new apiError(500, "Error while registering user in database!");
  }
  const user = await User.findById(newUser._id).select(
    "-password -refreshToken"
  );
  return res
    .status(201)
    .json(new apiResponse(201, true, user, "User registered successfully!"));
});

//login user and store token in database and browser cookies.
const loginUser = asyncHandler(async (req, res) => {
  const { email, password, confirmPassword } = req.body;
  if (password !== confirmPassword) {
    throw new apiError(400, "Both password does not match!");
  }
  const existingUser = await User.findOne({ email });
  if (!existingUser) {
    throw new apiError(400, "Wrong username or password!");
  }
  const isPasswordCorrect = await existingUser.isPasswordCorrect(
    password?.trim()
  );
  if (!isPasswordCorrect) {
    throw new apiError(400, "Wrong username or password!");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    existingUser
  );

  const updatedUser = await User.findByIdAndUpdate(
    existingUser._id,
    {
      refreshToken,
    },
    {
      new: true,
    }
  )
    .populate({
      path: "friends",
      select: "-role -refreshToken -password -email",
    })
    .select("-role -refreshToken -password -email");

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new apiResponse(200, true, updatedUser, "User logged in successfully!")
    );
});

//logout user and remove tokens.
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

//get all the available users.
const getUsers = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new apiError(401, "Unauthorizes access!");
  }
  const users = await User.find().select(
    "-password -refreshToken -role -friends -groups -email"
  );
  if (!users) {
    throw new apiError(500, "Error while fetching users from database!");
  }
  return res
    .status(200)
    .json(new apiResponse(200, true, users, "Users fetched successfully!"));
});

//get specific user details with user id.
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

//controller to add new friend into user's friend list from exisiting user list.
const addFriends = asyncHandler(async (req, res) => {
  const { friends, user } = req.body;
  if (!friends || friends?.length === 0) {
    throw new apiError(400, "Friends data is required!");
  }
  //fetch existing user and push friends into list
  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    { $addToSet: { friends: { $each: friends } } },
    { new: true, useFindAndModify: false }
  )
    .populate({
      path: "friends",
      select: "-role -refreshToken -password -email",
    })
    .select("-role -refreshToken -password -email");

  return res
    .status(201)
    .json(
      new apiResponse(201, true, updatedUser, "Friends added successfully!")
    );
});

//get all the friends who have sent message along with the users who are not friend but have sent messages.
const getChatFriendAndUsers = asyncHandler(async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    throw new apiError(400, "User id is required!");
  }

  const usersWhoHaveConversation = await User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: "messages",
        let: { userId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $eq: ["$recipient", "$$userId"] },
                  { $eq: ["$sender", "$$userId"] },
                ],
              },
            },
          },
          {
            $group: {
              _id: null,
              users: {
                $addToSet: {
                  $cond: [
                    { $eq: ["$recipient", "$$userId"] },
                    "$sender",
                    "$recipient",
                  ],
                },
              },
            },
          },
        ],
        as: "conversationUsers",
      },
    },
    {
      $project: {
        _id: 0,
        users: { $arrayElemAt: ["$conversationUsers.users", 0] },
      },
    },
    {
      $unwind: "$users",
    },
    {
      $lookup: {
        from: "users",
        localField: "users",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $lookup: {
        from: "messages",
        let: {
          userId: new mongoose.Types.ObjectId(userId),
          otherUserId: "$user._id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  {
                    $and: [
                      { $eq: ["$recipient", "$$userId"] },
                      { $eq: ["$sender", "$$otherUserId"] },
                    ],
                  },
                  {
                    $and: [
                      { $eq: ["$recipient", "$$otherUserId"] },
                      { $eq: ["$sender", "$$userId"] },
                    ],
                  },
                ],
              },
            },
          },
          {
            $sort: { createdAt: -1 },
          },
          {
            $limit: 1,
          },
        ],
        as: "lastMessage",
      },
    },
    {
      $unwind: "$lastMessage",
    },
    {
      $lookup: {
        from: "messages",
        let: {
          userId: new mongoose.Types.ObjectId(userId),
          otherUserId: "$user._id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$recipient", "$$userId"] },
                  { $eq: ["$sender", "$$otherUserId"] },
                  { $eq: ["$read", false] },
                ],
              },
            },
          },
          {
            $count: "unreadCount",
          },
        ],
        as: "unreadMessages",
      },
    },
    {
      $addFields: {
        unreadMessagesCount: {
          $ifNull: [{ $arrayElemAt: ["$unreadMessages.unreadCount", 0] }, 0],
        },
      },
    },
    {
      $project: {
        _id: "$user._id",
        avatar: "$user.avatar",
        fullname: "$user.fullname",
        username: "$user.username",
        active: "$user.active",
        lastSeen: "$user.lastSeen",
        lastMessageContent: "$lastMessage.message",
        lastMessageTime: "$lastMessage.createdAt",
        unreadMessagesCount: 1,
      },
    },
    {
      $sort: { lastMessageTime: -1 },
    },
  ]);

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        true,
        usersWhoHaveConversation,
        "Senders fetched successfully!"
      )
    );
});

const getUserStatus = asyncHandler(async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    throw new apiError(400, "user id is required!");
  }
});

//generate access and refresh token for user login.
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
  getUser,
  addFriends,
  getChatFriendAndUsers,
};
