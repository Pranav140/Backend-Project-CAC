import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video")
    }
    const video = await Video.findbyId(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const commentsAggregate = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                "owner.username": 1,
                "owner.fullName": 1,
                "owner.avatar": 1
            }
        }
    ])

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }

    const comments = await Comment.aggregatePaginate(
        commentsAggregate,
        options
    )

    if (!comments || comments.docs.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, [], "No comment found")
        )
    }

    return res.status(200).json(
        new ApiResponse(200, comments, "Comment fetched successfully")
    )

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params
    const { content } = req.body

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (!content || content?.trim() === "") {
        throw new ApiError(400, "Content required")
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user?._id
    })

    if (!comment) {
        throw new ApiError(500, "failed to create comment")
    }

    const createdComment = await Comment.findById(comment._id)
        .populate("owner", "username fullName avatar")

    return res.status(201).json(
        new ApiResponse(201, createdComment, "comment created successfully")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const {content} = req.body

    if(!commentId||!isValidObjectId(commentId)){
        throw new ApiError(400,"comment invalid")
    }
    if(!content|| content?.trim()===""){
        throw new ApiError(400,"content required")
    }

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(404,"comment not found")
    }

    if(comment.owner.toString()!== req.user?._id.toString()){
        throw new ApiError(403,"unauthorized user")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content
            }
        },
        {new:true}
    ).populate("owner","username fullName avatar")

    return res.status(200).json(
        new ApiResponse(200,updatedComment,"Comment updated succesfully")
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params

    if(!commentId||!isValidObjectId(commentId)){
        throw new ApiError(400,"comment invalid")
    }

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(404,"comment not found")
    }

    if(comment.owner.toString()!== req.user?._id.toString()){
        throw new ApiError(403,"Unauthorized")
    }

    await Comment.findByIdAndDelete(commentId)

    return res.status(200).json(
        new ApiResponse(200,{},"Comment removed successfully")
    )

})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}