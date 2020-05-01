const express = require('express');

const path = require('path');
const { MongoClient } = require('mongodb');
const fileRouter = express.Router();
const csv = require('fast-csv');
const stream = require('stream');
const jobsHelper = require('../jobsHelper');
const validator = require('validator');
const config = require('../../config');
const { ObjectId } = require('mongodb');
const bullMQHelper = require('../bullMQHelper');

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
                                if (validator.isEmail(data['email'])
                                    && !validator.isEmpty(data['first_name'])
                                    && !validator.isEmpty(data['last_name'])) {
                                    csvData.push({
                                        first_name: data['first_name'],
                                        last_name: data['last_name'],
                                        email: data['email'],
                                        domain: data['email'].split('@')[1]
                                    });
                                }
                            })
                        .on('end', () => {

                            (async function insertJob() {


                                let messageObj = {
                                    job: "import",
                                    data: csvData,
                                };

                                const jobResult = await bullMQHelper.sendMessageToQueue(messageObj);
                                await jobsHelper.insertNewJob(jobResult.id, "import", fileupload.name, "Waiting");

                                return res.redirect('/jobs?msg=' + encodeURIComponent('file uploaded'));
                            }());
                        });
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