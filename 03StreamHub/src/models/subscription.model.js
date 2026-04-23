import mongoose, {Schema} from "mongoose";

const subscriptionSchema = mongoose.Schema({
    subscriber : {
        type : Schema.Types.ObjectId, // the one who is subscribing
        ref : "User"
    },
    channel : {
        type : Schema.Types.ObjectId, // to which user is subscribing
        ref : "User"
    }
}, {Timestamps : true})

export const Subscription = mongoose.model("Subscription", subscriptionSchema);