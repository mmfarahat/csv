const express = require('express');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const fileRouter = express.Router();
const csv = require('fast-csv');
const stream = require('stream');
const amqp = require('amqplib');
const validator = require('validator');


function router() {
    fileRouter.route('/upload')
        .post((req, res) => {
            try {
                if (req.files) {
                    let fileupload = req.files.fileupload;
                    let csvData = [];
                    let ext = path.extname(fileupload.name).toLowerCase();
                    if (fileupload.size === 0 || ext != ".csv") {
                        return res.redirect('/?err=' + encodeURIComponent('invalid file'));
                    }
                    var bufferStream = new stream.PassThrough();
                    bufferStream.end(fileupload.data);
                    bufferStream.pipe(csv.parse({ headers: true }))
                        .on('error', error => console.error(error))
                        .on('data',
                            data => {
                                if (validator.isEmail(data['email'])) {
                                    csvData.push({
                                        first_name: data['first_name'],
                                        last_name: data['last_name'],
                                        email: data['email'],
                                        domain: data['email'].split('@')[1]
                                    });
                                }
                            })
                        .on('end', () => {

                            amqp.connect('amqp://localhost').then(function (connection) {
                                connection.createConfirmChannel().then(function (confirmChannel) {
                                    confirmChannel.sendToQueue('csvQueue', Buffer.from(JSON.stringify(csvData)), {},
                                        function (err, ok) {
                                            if (err !== null)
                                                console.warn('Message nacked!');
                                            else
                                                console.log('Message acked');
                                        });
                                });
                            });
                        });

                    return res.redirect('/jobs?msg=' + encodeURIComponent('file uploaded'));
                } else {
                    return res.redirect('/?err=' + encodeURIComponent('file is required'));
                }
            } catch (err) {
                return res.redirect('/?err=' + encodeURIComponent('invalid file'));

            }
        });
    return fileRouter;
}

module.exports = router;