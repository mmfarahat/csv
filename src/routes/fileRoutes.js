const express = require('express');

const path = require('path');
const { MongoClient } = require('mongodb');
const fileRouter = express.Router();
const csv = require('fast-csv');
const stream = require('stream');
const amqpHelper = require('../amqpHelper');
const jobsHelper = require('../jobsHelper');
const validator = require('validator');
const config = require('../../config');
const { ObjectId } = require('mongodb');

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

                                let arrayOfBatches = splitArray(csvData, 10000);

                                let arrayOfJobSubBatches = [];
                                for (let i = 0; i < arrayOfBatches.length; i++) {
                                    const element = arrayOfBatches[i];
                                    arrayOfJobSubBatches.push({
                                        batchId: i + 1,
                                        status: ""
                                    });
                                }

                                let response = await jobsHelper.insertNewJob("import", fileupload.name, "sent", arrayOfJobSubBatches);


                                for (let i = 0; i < arrayOfBatches.length; i++) {
                                    let currentBatch = arrayOfBatches[i];

                                    let messageObj = {
                                        batchId: i + 1,
                                        jobId: response.insertedId.toString(),
                                        job: "import",
                                        data: currentBatch,
                                    };

                                    amqpHelper.sendMessageToQueue(messageObj, mkCallback(messageObj.jobId, messageObj.batchId));

                                    function mkCallback(jobId, batchId) {
                                        return function (err) {
                                            if (err !== null) {
                                                jobsHelper.updateJobStatus(jobId, "failed", batchId)
                                            }
                                            else {
                                                jobsHelper.updateJobStatus(jobId, "waiting in queue", batchId)
                                            }
                                        };
                                    }
                                }



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


function splitArray(arr, len) {

    var chunks = [],
        i = 0,
        n = arr.length;

    while (i < n) {
        chunks.push(arr.slice(i, i += len));
    }

    return chunks;
}
module.exports = router;