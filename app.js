import express from 'express';
import mongoose, {Schema, model} from 'mongoose';
import bodyParser from 'body-parser-json';
import md5 from 'js-md5';
import AccuracyChartCache from "./src/AccuracyChartCache";

import Attempt from "./src/models/Attempt";
import Digit from "./src/models/Digit";
import AcChartCache from "./src/models/AcChartCache";

const fs = require('fs');
const {exec} = require('child_process');

const app = express();

const mongoConnectionString =  'mongodb+srv://attempts_user:attempts_pass@attemptsstorage-l9ph0.mongodb.net/recognizer?retryWrites=true&w=majority';
mongoose.connect(mongoConnectionString).then(() => {
    console.log( 'Connected' );
}, err => {
    console.log( err );
});

const getPercentageValue = val => parseFloat((val * 100).toFixed(2));

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
    const digits = await Digit.find({attempt: id}).sort({'xValue': 1});
    // const digits = await Digit.find({attempt: id});

    let valueParts = data.value.toString().split(''),
        correctionParts = correction.split('');

    let accuracyStep = 1 / valueParts.length;

    for (let i = 0; i < valueParts.length; i++) {
        if(valueParts[i] === correctionParts[i]) {
            continue;
        }

        data.accuracy -= accuracyStep;

        digits[i].isInvalidRecognizing = true;
        digits[i].value = +correctionParts[i];
        await digits[i].save()
    }

    data.accuracy = +data.accuracy.toFixed(4);
    data.isCorrect = false;
    data.correction = correction;

    await data.save();

    res.send({success: true});
});

app.get('/api/dashboard', async (req, res) => {
    const totals = await Attempt.count();
    const correctValues = await Attempt.where({'isCorrect': true}).count();

    const accuracyValue = await Digit.aggregate([{
        $group: {
            _id: 'total',
            absAccuracy: {
                $avg: { $cond: ["$isInvalidRecognizing", 0, 1] }
            }
        }
    }]);
    const awaitingDigits = await Digit.count();

    let accuracy = getPercentageValue(correctValues / totals);
    let absAccuracy = getPercentageValue(accuracyValue[0].absAccuracy);

    let chartCache = new AccuracyChartCache();
    let accuracyList = await chartCache.getAccuracyList();
    accuracyList = accuracyList.map(getPercentageValue);

    // acc: {$avg: {$cond: ["$isCorrect", 1, 0]}}
    // acc: {$avg: {$cond: ["$isCorrect", 1, 0]}}

    res.send({totals, accuracy, absAccuracy, awaitingDigits, accuracyList});
});

app.get('/api/dashboard/attempts', async (req, res) => {
    const dbData = await Attempt.find();
    res.send({data: dbData.map(item => [item.image, item.value, item.correction])});
});

app.get('/api/dashboard/digits', async (req, res) => {
    const dbData = await Digit.find();
    res.send({data: dbData.map(item => [item.image, item.value, item.isInvalidRecognizing])});
});
