const express = require('express');
const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');
const config = require('../../config');
const jobsRouter = express.Router();
function router() {
    jobsRouter.route('/')
        .get((req, res) => {

            (async function loadJobs() {
                let msg = req.query.msg;
                let client;
                client = await MongoClient.connect(config.dbUrl);
                const db = client.db(config.dbName);
                let jobs = await db.collection('jobs').find({}, { "sort": [['_id', -1]] }).toArray();
                jobs = jobs.map(job => ({
                    jobId: job.jobId,
                    type: job.operation,
                    status: job.status,
                    createdDate: new Date(ObjectId(job._id).getTimestamp()).toLocaleString(),
                    downloadPath: getdownloadPath(job)
                }));
                res.render('jobsView', { msg, jobs });
            }());

        });
    return jobsRouter;
}

function getdownloadPath(job) {
    if (job.operation != "import" && job.outputFileName != undefined) {
        return "/download?fileName=" + job.outputFileName;
    }
    return "";
}

module.exports = router;