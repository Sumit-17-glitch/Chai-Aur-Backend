import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

const toggleSubscribe = asyncHandler(async (req, res) => {
  const subscriberUserId = req.user?._id;
  const channelUserName = req.params?.userName;

  console.log("subscriberUserId", subscriberUserId);
  console.log("channelUserName", channelUserName);

  //get channel
  const channel = await User.findOne({
    userName: channelUserName,
  });
  if (!channel) {
    throw new ApiError(400, "channel does not exist");
  }

  //check if user is already subscribed or not
  const subscription = await Subscription.findOne({
    channel: channel._id,
    subscriber: subscriberUserId,
  });
  const isSubscribed = !!subscription;

  // if subscribed unsubscribe
  if (isSubscribed) {
    await subscription.deleteOne();

    return res
      .status(200)
      .json(new apiResponse(200, {}, "unsubscribed successfully"));
  }

  // if not subscribed then subscribe
  const newSubscription = await Subscription.create({
    channel: channel._id,
    subscriber: subscriberUserId,
  });

  if (!newSubscription) {
    throw new ApiError(500, "something went wrong while subscribing");
  }

  return res
    .status(200)
    .json(new apiResponse(200, subscription, "subscribed succesfully"));
});

const getUserChannelSubscriberList = asyncHandler(async (req, res) => {
  const channelName = req.params?.userName;

  if (!channelName) {
    throw new ApiError(401, "requires username");
  }

  const subscriberList = await User.aggregate([
    {
      $match: {
        userName: channelName.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscriberList",
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        subscriberList[0].subscriberList,
        "subscriber list fetched successfully",
      ),
    );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const subscribedTo = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
  ]);

  if (!subscribedTo) {
    throw new ApiError(401, "not subscribed to any channel");
  }

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        subscribedTo[0].subscribedTo,
        "subscribedTo succesfully fetched",
      ),
    );
});

export { toggleSubscribe, getUserChannelSubscriberList, getSubscribedChannels };
