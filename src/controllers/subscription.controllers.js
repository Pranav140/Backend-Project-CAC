import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription

    if (!channelId || !isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId");
    }

    const channel = await User.findById(channelId)

    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }

    if (channel._id.toString() === req.user?._id.toString()) {
        throw new ApiError(400, "You cannot subscribe yourself")
    }

    const subscriptionExists = await Subscription.findOne({
        subscriber: req.uset?._id,
        channel: channelId
    });

    let subscription;
    let message;

    if (subscriptionExists) {
        await Subscription.findByIdAndDelete(subscriptionExists._id);
        message = "Unsubscribed successfully";
        subscription = null;
    } else {
        subscription = await Subscription.create({
            subscriber: res.user._id,
            channel: channelId
        });
    }

    return res.status(200).json(
        new ApiResponse(200, subscription, "Subscribed successfully")
    );
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    const { page = 1, limit = 10 } = req.query
    if (!channelId || !isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id")
    }

    const channel = await User.findById(channelId)
    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const aggregationPipeline = [
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$subscriber"
        },
        {
            $project: {
                _id: 1,
                subscriber: 1,
                createdAt: 1
            }
        }
    ];

    const subscribersAggregate = await Subscription.aggregate(aggregationPipeline);
    const subscribers = await Subscription.aggregatePaginate(subscribersAggregate, options);

    return res.status(200).json(
        new ApiResponse(200, subscribers, "Subscribers fetched successfully")
    );
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}