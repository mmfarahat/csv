const { MongoClient } = require('mongodb');
const config = require('../config');
const { ObjectId } = require('mongodb');

const updateJobStatus = async (jobId, status) => {
    let client;
    client = await MongoClient.connect(config.dbUrl);
    const db = client.db(config.dbName);
    const response = await db.collection('jobs').updateOne({ jobId:jobId }, { $set: { "status": status } });

}
const insertNewJob = async (jobId, operation, fileName, status) => {
    let client;
    client = await MongoClient.connect(config.dbUrl);
    const db = client.db(config.dbName);
    const response = await db.collection('jobs').insertOne({
        jobId,
        operation,
        fileName,
        status
    });
    return response;
}
module.exports = {
    updateJobStatus,
    insertNewJob
}
