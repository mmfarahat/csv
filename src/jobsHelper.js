const { MongoClient } = require('mongodb');
const config = require('../config');
const { ObjectId } = require('mongodb');

const updateJobStatus = async (jobId, status) => {
    let client;
    client = await MongoClient.connect(config.dbUrl);
    const db = client.db(config.dbName);
    const response = await db.collection('jobs').updateOne({ _id: ObjectId(jobId) }, { $set: { "status": status } });

}
const insertNewJob = async (operation, fileName, status) => {
    let client;
    client = await MongoClient.connect(config.dbUrl);
    const db = client.db(config.dbName);
    const response = await db.collection('jobs').insertOne({
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
