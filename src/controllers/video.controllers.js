import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    const pipeline = [];

    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid user id")
        }
        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        });
    }

    if (query) {
        pipeline.push({
            $match: {
                $or: [
                    { title: { $regex: query, $options: "i" } },
                    { description: { $regex: query, $options: "i" } }
                ]
            }
        });
    }

    pipeline.push({
        $match:{
            isPublished:true
        }
    });
    
    pipeline.push({
        $lookup:{
            from:"users",
            localField:"owner",
            foreignField:"_id",
            as:"owner",
            pipeline:[
                {
                    $project:{
                        username:1,
                        fullName:1,
                        avatar:1,
                    }
                }
            ]
        }
    });

    pipeline.push({
        $unwind:"$owner"
    });

    if(sortBy&& sortType){
        pipeline.push({
            $sort:{
                [sortBy]:sortType === "asc"?1:-1
            }
        });
    }else{
        pipeline.push({
            $sort:{
                createdAt:-1
            }
        });
    }

    const videoAggregate= Video.aggregate(pipeline);
    const options = {
        page:parseInt(page,10),
        limit:parseInt(limit,10)
    };

    const videos = await Video.aggregatePaginate(videoAggregate,options);

    return res.status(200).json(
        new ApiResponse(200,videos,"videos fetched successfully")
    )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video

    if (!title || !description) {
        throw new ApiError(400, "title and description required")
    }

    const videoLocalPath = req.files?.videoFile?.[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    if (!videoLocalPath) {
        throw new ApiError(400, "video file is required")
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail is required")
    }

    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!videoFile) {
        throw new ApiError(500, "error while uploading video")
    }
    if (!thumbnail) {
        throw new ApiError(500, "error while uploading thumbnail")
    }

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: videoFile.duration,
        owber: req.user?._id
    })

    const createdVideo = await Video.findById(video._id).populate("owner", "username fullName avatar")

    if (!createdVideo) {
        throw new ApiError(500, "Error while creating video")
    }

    return res.status(201).json(
        new ApiResponse(201, createdVideo, "Video created successfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video")
    }

    const video = await Video.findById(videoId).populate("owner", "username fullName avatar")

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    video.views += 1
    await video.save()

    return res.status(200).json(
        new ApiResponse(200, [], "Video fetched successfully")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video")
    }

    const { title, description } = req.body
    const thumbnailLocalPath = req.file?.path

    if (!title && !description && !thumbnailLocalPath) {
        throw new ApiError(400, "At least one field is required to update")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video")
    }

    const updateFields = {}

    if (title) updateFields.title = title
    if (description) updateFields.description = description

    if (thumbnailLocalPath) {
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
        if (!thumbnail) {
            throw new ApiError(500, "Error while uploading thumbnail")
        }
        updateFields.thumbnail = thumbnail.url
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: updateFields
        },
        { new: true }
    ).populate("owner", "username fullName avatar")

    return res.status(200).json(
        new ApiResponse(200, updatedVideo, "Video updated successfully")
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    if (video.owner.toString() != req.user?._id.toString()) {
        throw new ApiError(403, "unauthorized user")
    }

    await Video.findByIdAndDelete(videoId)

    return res.status(200).json(
        new ApiResponse(200, {}, "Video deleted successfully")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.tostring() != req.user?._id.toString()) {
        throw new ApiError(403, "Unauthorized ")
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !video.isPublished
            }
        }, { new: true }
    ).populate("owner", "username fullName avatar")

    return res.status(200).json(
        new ApiResponse(200, updatedVideo, "Video updated successfully")
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}