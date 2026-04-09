import { asyncHandler } from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadFileToCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  //get user data from frontend
  const { userName, email, fullName, password } = req.body;
  console.log("Body's content", req.body);

  //validtaion - not empty
  if (
    [userName, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new apiError(400, "All fields are required");
  }

  //check if user already exists: email/username
  const existedUser = await User.findOne({
    $or: [{ userName: userName }, { email: email }],
  });
  if (existedUser) {
    console.log("Error at existed user");
    throw new apiError(409, "User with this userName or email exists");
  }

  //check for images
  const avatarLocalPath = req.files ? avatar[0]?.path : null;
  const coverImageLocalPath = req.files ? coverImage[0]?.path : null;

  if (!avatarLocalPath) {
    throw new apiError("400", "Required avatar image");
  }

  //upload them on cloudinary
  const CloudinaryUrlForAvatar =
    await uploadFileToCloudinary(avatarLocalPath).url;
  const CloudinaryUrlForCoverImage =
    (await uploadFileToCloudinary(coverImageLocalPath)?.url) || "";
  if (!CloudinaryUrlForAvatar) {
    throw new apiError("400", "Required avatar image");
  }

  //create user object
  const user = await User.create({
    fullName,
    avatar: CloudinaryUrlForAvatar,
    coverImage: CloudinaryUrlForCoverImage,
    email,
    password,
    userName: userName.toLower(),
  });

  //remove password and refresh token feild from the response
  //check for user creation
  const createsUser = await User.findById(user._id).select("-password -refreshtoken");
  if(!createsUser){
    throw new apiError(500, "Something went wrong while Creating user");
  }

  //return response
  return res.status(201).json(
    new apiResponse(201, createsUser, "User Created SUccesfully")
  )
});

export { registerUser };
