import mongoose, {model, Schema} from "mongoose";

const AttemptSchema = new Schema({
    accuracy: {type: Number, default: 1},
    correction: String,
    digits: [mongoose.ObjectId],
    image: String,
    isCorrect: Boolean,
    timestamp: {type: Date, default: Date.now},
    value: String
});

export default model('Attempt', AttemptSchema);