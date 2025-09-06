import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    if (!name || name?.trim() === "") {
        throw new ApiError(400, "Invalid Name")
    }
    if (!description || description?.trim() === "") {
        throw new ApiError(400, "Description required")
    }
    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id,
        videos: []
    }
    )

    if (!playlist) {
        throw new ApiError(500, "failed to create playlist")
    }

    return res.status(201).json(
        new ApiResponse(201, playlist, "Playlist created sucessfully")
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    
    if(!userId||!isValidObjectId(userId)){
        throw new ApiError(400,"Inavlid user id")
    }

    const playlists = await Playlist.find({owner :userId})
    if(!playlists||playlists.length===0){
        return res.status(200).json(
            new ApiResponse(200,playlists,"Playlist not found")
        )
    }
    return res.status(200).json(
        new ApiResponse(200,playlists,"Playlist fetched successfully")
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    if(!playlistId || !isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlist")
    }

    const playlist = await Playlist.findById(playlistId).populate("videos")

    if(!playlist){
        throw new ApiError(404,"Playlist not found")
    }

    return res.status(200).json(
        new ApiResponse(200,playlist,"Playlist fetched successfully")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if(!playlistId || !isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlist")
    }

    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404,"playlist not found")
    }

    if(playlist.owner.toString()!==req.user?._id.toString()){
        throw new ApiError(403,"Unauthorized")
    }

    if(playlist.videos.includes(videoId)){
        throw new ApiError(404,"Video already exists")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push:{ videos:videoId}
        },
        {new:true}
    ).populate("videos")

    return res.status(200).json(
        new ApiResponse(200,updatedPlaylist,"video added successfully")
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    
    if(!playlistId || !isValidObjectId(playlistId)){
        throw new ApiError(400,"invalid playlist")
    }

    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400,"invalid video")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404,"Playlist not found")
    }

    if(playlist.owner.toString()!==req.user?._id.toString()){
        throw new ApiError(403,"Unauthorized user")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull:{videos:videoId}
        },
        {new : true}
    ).populate("videos")

    return res.status(200).json(
        new ApiResponse(200,updatedPlaylist,"Video removed succesfully")
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    
    if(!playlistId||!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlist")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404,"playlist not found")
    }
    if(playlist.owner.toString()!== req.user?._id.toString()){
        throw new ApiError(403,"Unauthorized")
    }

    await Playlist.findByIdAndDelete(playlistId)

    return res.status(200).json(
        new ApiResponse(200,playlist,"playlist deleted successfully")
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    
    if(!playlistId || !isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlist")
    }

    if(!name || name?.trim()===""){
        throw new ApiError(400,"Name required")
    }

    if(!description || description?.trim()===""){
        throw new ApiError(400,"description required")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404,"Playlist not found")
    }

    if(playlist.owner.toString()!== req.user?._id.toString()){
        throw new ApiError(403,"Unauthorized user")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set:{
                name,
                description
            }
        },
        {new :true}
    ).populate("videos")

    return res.status(200).json(
        new ApiResponse(200,updatedPlaylist,"Playlist updated successfully")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}