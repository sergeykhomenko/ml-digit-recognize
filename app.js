import express from 'express';
import mongoose, {Schema, model} from 'mongoose';
import bodyParser from 'body-parser-json';
import md5 from 'js-md5';

const fs = require('fs');
const {exec} = require('child_process');

const app = express();

const mongoConnectionString =  'mongodb+srv://attempts_user:attempts_pass@attemptsstorage-l9ph0.mongodb.net/recognizer?retryWrites=true&w=majority';
mongoose.connect(mongoConnectionString).then(() => {
    console.log( 'Connected' );
}, err => {
    console.log( err );
});

const AttemptSchema = new Schema({
    image: String,
    value: String,
    digits: [String],
    isCorrect: Boolean,
    correction: String
});

const Attempt = model('Attempt', AttemptSchema);

app.use(bodyParser.json());
app.use(express.static('public'));

app.listen(3000, () => {
    console.log( 'Runned on 3000' );
});

app.post('/api/recognize', async (req, res) => {
    let imageData = req.body.image.replace(/^data:image\/png;base64,/, "");
    let data = new Attempt({image: imageData, isCorrect: true});

    const {_id} = await data.save();

    fs.writeFileSync(`ml/data/${_id}.png`, imageData, 'base64');
    exec(`python3 -W ignore recognizer.py ${_id}`, function (error, stdout, stderr) {
        if (error !== null) {
            // todo: logging recognize error
        }

        const value = stdout.trim();

        data.value = value;
        data.save().then(() => {
            res.send({success: true, _id, value})
        }, err => {
            // todo: logging database storing error
        });
    });
});

app.post('/api/recognize/correction', async (req, res) => {
    const {id, correction} = req.body;
    const data = await Attempt.findOne({_id: id});

    data.isCorrect = false;
    data.correction = correction;

    await data.save();

    res.send({success: true});
});
