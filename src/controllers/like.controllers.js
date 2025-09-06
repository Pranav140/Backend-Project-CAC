import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!videoId||!isValidObjectId(videoId)){
        throw new ApiError(400,"video invalid")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404,"Video not found")
    }

    const likeExists = await Like.findOne({
        video:videoId,
        likedBy:req.user?._id
    })

    if(likeExists){
        await Like.findByIdAndDelete(likeExists._id)

        return res.status(200).json(
            new ApiResponse(200,{},"Video unliked successfully")
        )
    }

    await Like.create({
        video:videoId,
        likedBy:req.user?._id
    })

    return res.status(200).json(
        new ApiResponse(200,{},"Video liked successfully")
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}