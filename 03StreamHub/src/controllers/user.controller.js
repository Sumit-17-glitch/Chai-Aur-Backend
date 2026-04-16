import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
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

export { registerUser };
