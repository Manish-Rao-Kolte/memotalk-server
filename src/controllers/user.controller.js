import { cookieOptions } from "../constants.js";
import User from "../models/user.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res) => {
    const { username, fullname, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        throw new apiError(401, "User already registered!");
    }

    const user = await User.create({
        username,
        email,
        password,
        fullname,
    });
    if (!user) {
        throw new apiError(500, "Error while registering user!");
    }

    return res
        .status(201)
        .json(
            new apiResponse(201, true, user, "User registered successfully!")
        );
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
        return res
            .status(401)
            .json(
                new apiResponse(401, false, null, "Wrong username or password!")
            );
    }
    const isPasswordCorrect = await existingUser.isPasswordCorrect(
        password?.trim()
    );
    if (!isPasswordCorrect) {
        return res
            .status(401)
            .json(
                new apiResponse(401, false, null, "Wrong username or password!")
            );
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        existingUser
    );

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(new apiResponse(200, true, null, "User logged in successfully!"));
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
        .json(
            new apiResponse(200, true, null, "User logged out successfully!")
        );
});

const generateAccessAndRefreshToken = async (user) => {
    try {
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new apiError(500, "Error while generating tokens!");
    }
};

export { registerUser, loginUser, logoutUser };
