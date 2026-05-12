import { Video } from "../models/video.model.js";
import ApiError from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadFileToCloudinary } from "../utils/cloudinary.js";

const publishVideo = asyncHandler(async (req, res) => {
  //get and title, description from request
  const userId = req.user?._id;
  const { title, description } = req.body;

  //get video and thumbnail from request
  const localVideoPath = req.files?.video[0]?.path;
  if (!localVideoPath) {
    throw new ApiError(401, "video required");
  }

  const localThumbnailPath = req.files?.thumbnail[0]?.path;
  if (!localThumbnailPath) {
    throw new ApiError(401, "thumbnail required");
  }

  //upload video and thumbnail to cloudinary
  const videoCloudianry = await uploadFileToCloudinary(localVideoPath);
  if (!videoCloudianry) {
    throw new ApiError(500, "video upload failed");
  }

  const thumbnailCloudinary = await uploadFileToCloudinary(localThumbnailPath);
  if (!thumbnailCloudinary) {
    throw new ApiError(500, "thumbnail upload failed");
  }

  //get vedio info
  console.log(videoCloudianry);
  const duration = videoCloudianry.duration;

  //create video document in database
  const video = await Video.create({
    videoFile: videoCloudianry.secure_url,
    thumbnail: thumbnailCloudinary.secure_url,
    title: title,
    description: description,
    duration: duration,
    owner: req.user?._id,
  });

  return res
    .status(200)
    .json(new apiResponse(200, video, "vedio published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  console.log(typeof videoId);

  // find the video
  const video = await Video.findById(videoId);

  // if does not exists return false
  if (!video) {
    throw new ApiError(401, "video does not exists");
  }

  // if exists return video
  return res
    .status(200)
    .json(new apiResponse(200, video, "video fetched successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId = req.user?._id;
    
    const video = await Video.findById(videoId);

    if(!video){
       throw new ApiError(401, "video does not exists");
    }

    console.log("userId:", userId);
    console.log("owner:", video.owner);
    

    if(userId.toString() === video.owner.toString() ) await video.deleteOne();
    else{
        throw new ApiError(401, "unauthosized access");
    }

    return res.status(200)
    .json(
        new apiResponse(200, {}, "video deleted succesfully")
    )
})

export { publishVideo, getVideoById, deleteVideo };
