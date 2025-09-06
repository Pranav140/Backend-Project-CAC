import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async(req,res)=>{
        const {content} = req.body

        if(!content ||content?.trim()===""){
            throw new ApiError(400,"Content is required")
        }
        const tweet = await Tweet.create({
            content,
            owner:req.user?._id
        })

        if(!tweet){
            throw new ApiError(500,"failed to create tweet")
        }

        return res.
        status(201)
        .json(
            new ApiResponse(201,tweet,"Tweet created successfully")
        )
    })

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params

    if(!userId||!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid user id")
    }

    const tweets = await Tweet.find({owner :userId})

    if(!tweets||tweets.length()===0){
        return res.status(200).json(
            new ApiResponse(200,[],"No tweets found")
        )
    }
    return res.status(200).json(
        new ApiResponse(200,tweets,"Tweets fetched succesfully")
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const {content} = req.body 

    if(!content || content?.trim()===""){
        throw new ApiError(400,"content is required")
    }

    if(!tweetId || isValidObjectId(tweetId)){
        throw new ApiError(400,"invalid tweet id")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(404,"tweet not found")
    }

    if(tweet.owner.toString()!== req.user?._id.toString()){
        throw new ApiError(403,"Unauthorized")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content
            }
        },
        {new:true}
    )

    return res.status(200).json(
        new ApiResponse(200,updatedTweet,"tweet updated successfully")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}