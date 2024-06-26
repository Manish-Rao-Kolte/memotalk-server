import User from "../models/user.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const validateJwt = asyncHandler(async (req, res, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return res
                .status(401)
                .json(
                    new apiResponse(401, false, null, "User is not loggedIn!")
                );
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select("-password");
        if (!user) {
            return res
                .status(404)
                .json(new apiResponse(404, false, null, "User not found!"));
        }
        req.user = user;
        next();
    } catch (error) {
        return res
            .status(500)
            .json(new apiResponse(500, false, null, "Internal server error!"));
    }
});
