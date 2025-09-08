import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription

    if(!channelId || !isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channelId");
    }

    const channel = await User.findById(channelId)

    if(!channel){
        throw new ApiError(404,"Channel not found")
    }

    if(channel._id.toString()===req.user?._id.toString()){
        throw new ApiError(400,"You cannot subscribe yourself")
    }

    const subscriptionExists = await Subscription.findOne({
        subscriber:req.uset?._id,
        channel:channelId
    });

    let subscription;
    let message;

    if(subscriptionExists){
        await Subscription.findByIdAndDelete(subscriptionExists._id);
        message = "Unsubscribed successfully";
        subscription = null;
    }else{
        subscription  = await Subscription.create({
            subscriber:res.user._id,
            channel:channelId
        });
    }

    return res.status(200).json(
        new ApiResponse(200,subscription,"Subscribed successfully")
    );
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
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