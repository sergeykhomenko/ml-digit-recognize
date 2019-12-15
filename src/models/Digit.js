import {model, Schema} from "mongoose";

const DigitSchema = new Schema({
    attempt: String,
    image: String,
    isInvalidRecognizing: Boolean,
    value: Number,
    xValue: Number
});

export default model('digits', DigitSchema);