import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser-json';
import md5 from 'js-md5';

const fs = require('fs');
const {exec} = require('child_process');

const app = express();
// const mongoConnectionString = 'mongodb+srv://attempts_user:attempts_pass@attemptsstorage-l9ph0.mongodb.net/test?retryWrites=true&w=majority';
// mongoose.connect(mongoConnectionString).then(() => {
//     console.log( 'Connected' );
// }, err => {
//     console.log( err );
// });

app.use(bodyParser.json());
app.use(express.static('public'));

app.listen(3000, () => {
    console.log( 'Runned on 3000' );
});

app.post('/api/recognize', (req, res) => {
    const {image} = req.body;

    let imageData = image.replace(/^data:image\/png;base64,/, "");
    let hash = md5(imageData);
    fs.writeFile(`${hash}.png`, imageData, 'base64', err => {
        console.log( err );
    });

    exec('php -v', function (error, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
        if (error !== null) {
            console.log('exec error: ' + error);
        }
    });

    res.send({success: true, value: 400, hash: hash});
});

app.post('/api/recognize/correction', (req, res) => {
    const {hash, correction} = req.body;

    console.log( hash, 'should be equal to', correction );

    res.send({success: true});
});

app.post('/api/recognize/approve', (req, res) => {
    const {hash} = req.body;

    console.log( hash, 'approved' );

    res.send({success: true});
});
