import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadFileToCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

const generateRefreshAndAccessTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();

    user.refreshtoken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { refreshToken, accessToken };
  } catch (error) {
    console.error("Error details:", error); // See the actual error
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token",
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //get user data from frontend
  const { userName, email, fullName, password } = req.body;
  console.log("Body's content", req.body);

  //validtaion - not empty
  if (
    [userName, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  //check if user already exists: email/username
  const existedUser = await User.findOne({
    $or: [{ userName: userName }, { email: email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with this userName or email exists");
  }

  //check for images
  // avatar
  let avatarLocalPath;
  let coverImageLocalPath;

  // Avatar
  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    avatarLocalPath = req.files.avatar[0].path;
  }

  // Cover Image
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError("400", "Required avatar image");
  }

  //upload them on cloudinary
  const CloudinaryUrlForAvatar = await uploadFileToCloudinary(avatarLocalPath);
  const CloudinaryUrlForCoverImage =
    (await uploadFileToCloudinary(coverImageLocalPath)) || "";
  if (!CloudinaryUrlForAvatar) {
    throw new ApiError("500", "upload to cloudinary failed");
  }

  //create user object
  const user = await User.create({
    fullName,
    avatar: CloudinaryUrlForAvatar,
    coverImage: CloudinaryUrlForCoverImage,
    email,
    password,
    userName: userName.toLowerCase(),
  });

  //remove password and refresh token feild from the response
  //check for user creation
  const createsUser = await User.findById(user._id).select(
    //it should be created user
    "-password -refreshtoken",
  );
  if (!createsUser) {
    throw new ApiError(500, "Something went wrong while Creating user");
  }

  //return response
  return res
    .status(201)
    .json(new apiResponse(201, createsUser, "User Created SUccesfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //req body -> data
  console.log("Body's data", req.body);

  const { email, userName, password } = req.body;

  // username or password
  if (!email && !userName) {
    throw new ApiError(400, "email or password required");
  }
  //find user
  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  //password check
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }
  //access and refresh token
  const { refreshToken, accessToken } = await generateRefreshAndAccessTokens(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshtoken",
  );

  //send cookie
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully",
      ),
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.refreshtoken = undefined;
  user.save({ validateBeforeSave: false });

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "User Logged out succesfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorised request");
  }

  const decodedRefreshToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET,
  );

  const user = await User.findById(decodedRefreshToken?._id);
  if (!user) {
    throw new ApiError(401, "Invalid Refresh token");
  }

  if (incomingRefreshToken !== user?.refreshtoken) {
    throw new ApiError(401, "Invalid Refresh token or expired");
  }

  const options = {
    httpOnly: true,
    secure: true,
  };

  const { refreshToken, accessToken } = await generateRefreshAndAccessTokens(
    user._id,
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        201,
        { accessToken, refreshToken },
        "accessToken refreshed successfully",
      ),
    );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isOldPasswordCorrect) {
    throw new ApiError(404, "Icorrect password");
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  user = req.user;
  return res
    .status(200)
    .json(new apiResponse(200, { user }, "getCurrentUser successful"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.bady;

  if (!fullName || !email) {
    throw new ApiError(400, "Required all fields");
  }

  const user =
    (await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          fullName,
          email,
        },
      },
      { new: true },
    )) / select("-password");

  return res
    .status(200)
    .json(new apiResponse(200, { user }, "Information update succefully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const localPathforAvatar = req.file?.path;
  if (!localPathforAvatar) {
    throw new ApiError(400, "required avatar");
  }

  const cloudinaryUrlForAvatar =
    await uploadFileToCloudinary(localPathforAvatar);
  if (!cloudinaryUrlForAvatar.url) {
    throw new ApiError(500, "upload to cloudinary failed");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: cloudinaryUrlForAvatar.url,
      },
    },
    { new: true },
  ).select("-password");

  return res
    .status(200)
    .json(new apiResponse(200, { user }, "avatar changed successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const localPathforCoverImage = req.file?.path;
  if (!localPathforCoverImage) {
    throw new ApiError(400, "required cover image");
  }

  const cloudinaryUrlForCoverImage = await uploadFileToCloudinary(
    localPathforCoverImage,
  );
  if (!cloudinaryUrlForCoverImage.url) {
    throw new ApiError(500, "upload to cloudinary failed");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: cloudinaryUrlForCoverImage.url,
      },
    },
    { new: true },
  ).select("-password");

  return res
    .status(200)
    .json(new apiResponse(200, { user }, "cover image changed successfully"));
});

const getChannelUserProfile = asyncHandler(async (req, res) => {
  const { userName } = req.params;
  if (!userName?.trim()) {
    throw new ApiError(400, "User name is required");
  }

  const channel = await User.aggregate([
    {
      $match: {
        userName: userName.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "$_id",
        foreignField: "$channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "$_id",
        foreignField: "$subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscribers",
        },
        subscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        userName: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        subscriberCount: 1,
        subscribedToCount: 1,
        isSubscribed: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "Channel does not exist");
  }

  return res
    .status(200)
    .json(new apiResponse(200, channel[0], "User channel fetched succesfully"));
});

const getUserWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as:"owner",
              pipeline:[
                {
                  $project:{
                    userName:1,
                    avatar:1,
                  }
                }
              ]
            },
          },
          {
            $addFields:{
              owner:{
                $first:"$owner"
              }
            }
          }
        ],
      },
    },
  ]);

  return res
  .status(200)
  .json(
    new apiResponse(200, user[0].watchHistory, "User watch history fetched successfully")
  )
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getChannelUserProfile,
  getUserWatchHistory,
};
