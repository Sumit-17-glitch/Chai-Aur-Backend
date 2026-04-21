import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadFileToCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";

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
    throw new ApiError("400", "Required avatar image");
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
  user.save({validateBeforeSave:false});

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

export { registerUser, loginUser, logoutUser };
