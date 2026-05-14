import { Video } from "../models/video.model.js";
import ApiError from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadFileToCloudinary,
} from "../utils/cloudinary.js";

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
  const duration = videoCloudianry.duration;

  //create video document in database
  const video = await Video.create({
    videoFile: {
      url: videoCloudianry.secure_url,
      publicId: videoCloudianry.public_id,
    },
    thumbnail: {
      url: thumbnailCloudinary.secure_url,
      publicId: thumbnailCloudinary.public_id,
    },
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
  // get video id from request params
  const { videoId } = req.params;
  const userId = req.user?._id;

  // find the video
  const video = await Video.findById(videoId);

  // if does not exists return false
  if (!video) {
    throw new ApiError(401, "video does not exists");
  }
  
  // get video and thumbnail public id from video document
  const videoPublicId = video.videoFile.publicId;
  const videoResourceType = video.videoFile.resourceType || "video";
  const thumbnailPublicId = video.thumbnail.publicId;
  const thumbnailResourceType = video.thumbnail.resourceType || "image";

  // delete video and thumbnail from cloudinary
  const videoDeletedRespose = await deleteFromCloudinary(videoPublicId, videoResourceType);
  const thumbnailDeletedRespose = await deleteFromCloudinary(thumbnailPublicId, thumbnailResourceType);


  // if video or thumbnail deletion from cloudinary failed return error response
  if(!videoDeletedRespose || !thumbnailDeletedRespose) {
    throw new ApiError(500, "video deletion from cloud failed");
  }

  // delete video document from database only if the requester is the owner of the video
  if (userId.toString() === video.owner.toString()) await video.deleteOne();
  else {
    throw new ApiError(401, "unauthosized access");
  }

  // return success response
  return res
    .status(200)
    .json(new apiResponse(200, {}, "video deleted succesfully"));
});

export { publishVideo, getVideoById, deleteVideo };
