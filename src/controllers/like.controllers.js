import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "video invalid")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const likeExists = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id
    })

    if (likeExists) {
        await Like.findByIdAndDelete(likeExists._id)

        return res.status(200).json(
            new ApiResponse(200, {}, "Video unliked successfully")
        )
    }

    await Like.create({
        video: videoId,
        likedBy: req.user?._id
    })

    return res.status(200).json(
        new ApiResponse(200, {}, "Video liked successfully")
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment

    if (!commentId || !isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    const likeExists = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id
    })

    if (likeExists) {
        await Like.findByIdAndDelete(likeExists._id)

        return res.status(200).json(
            new ApiResponse(200, {}, "comment unliked successfully")
        )
    }

    await Like.create({
        comment: commentId,
        likedBy: req.user?._id
    })

    return res.status(200).json(
        new ApiResponse(200, {}, "Comment liked succesfully")
    )
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet

    if (!tweetId || !isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet")
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    const likeExists = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id
    })

    if (likeExists) {
        await Like.findByIdAndDelete(likeExists._id)

        return res.status(200).json(
            new ApiResponse(200, {}, "Tweet unliked successfully")
        )
    }

    await Like.create({
        tweet: tweetId,
        likedBy: req.user?._id
    })

    return res.status(200).json(
        new ApiResponse(200, {}, "Tweet liked successfully")
    )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const { page = 1, limit = 10 } = req.query

    const likedVideosAggregation = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
                video: { $exists: true }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video"
            }
        },
        {
            $unwind: "$video"
        },
        {
            $lookup: {
                from: "users",
                localField: "video.owner",
                foreignField: "_id",
                as: "video.owner"
            }
        },
        {
            $unwind: "$video.owner"
        },
        {
            $project: {
                _id: 0,
                video: {
                    _id: 1,
                    title: 1,
                    description: 1,
                    thumbnail: 1,
                    duration: 1,
                    views: 1,
                    owner: {
                        username: 1,
                        fullName: 1,
                        avatar: 1
                    }
                }
            }
        }
    ])

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }

    const likedVideos = await Like.aggregatePaginate(
        likedVideosAggregation,
        options
    )

    if (!likedVideos || likedVideos.docs.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, [], "No liked videos found")
        )
    }

    return res.status(200).json(
        new ApiResponse(200, likedVideos, "liked videos fetched successfully")
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}