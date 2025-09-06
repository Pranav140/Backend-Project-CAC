import mongoose,{Schema, SchemaTypes} from "mongoose"

const commentSchema = new Schema({
    video:{
        type:Schema.Types.ObjectId,
        ref:"Video"
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"Comment"
    },
    content:{
        type:String,
        required:true
    }
})
commentSchema.plugin(mongooseAggregatePaginate)
export default Comment = mongoose.model("Comment",commentSchema)