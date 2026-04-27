import { User } from "../models/user.model.js";
import ApiError from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler(async(req, res, next)=>{
    try {
        console.log("Inside verifyJWT");
        
        const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
    
        if(!accessToken){
            throw new ApiError(401, "Unathorized access");
        }
    
        const verifiedAccessToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET,);
    
        const user = await User.findById(verifiedAccessToken._id).select("-password -refreshtoken");
    
        if(!user){
            throw new ApiError(401, "Invalid access token");
        }
    
        req.user = user;
        console.log("user is verified");
        
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
})