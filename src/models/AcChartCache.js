import {model, Schema} from "mongoose";

const AccuracyStatsCacheSchema = new Schema({
    startTime: Date,
    accuracyValue: Number,
    absAccuracyValue: Number
});

export default model('accuracy_stats_cache', AccuracyStatsCacheSchema);