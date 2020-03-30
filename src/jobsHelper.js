const { MongoClient } = require('mongodb');
const config = require('../config');
const { ObjectId } = require('mongodb');

const updateJobStatus = async (jobId, status, batchId) => {
    let client;
    client = await MongoClient.connect(config.dbUrl);
    const db = client.db(config.dbName);
    
    if (batchId != undefined) {
        await db.collection('jobs').updateOne({ _id: ObjectId(jobId), "arrayOfSubBatches.batchId": batchId }, { $set: { "arrayOfSubBatches.$.status": status } });
    } else {
        await db.collection('jobs').updateOne({ _id: ObjectId(jobId) }, { $set: { "status": status } });
    }//> db.jobs.updateOne({_id:ObjectId("5e81b3edcc77630cd1b275fb"),"arrayOfSubBatches.batchId":18}, { $set: { "arrayOfSubBatches.$.status": "aaaa" } })
}
const insertNewJob = async (operation, fileName, status, arrayOfSubBatches) => {
    let client;
    client = await MongoClient.connect(config.dbUrl);
    const db = client.db(config.dbName);
    const response = await db.collection('jobs').insertOne({
        operation,
        fileName,
        status,
        arrayOfSubBatches
    });
    return response;
}
module.exports = {
    updateJobStatus,
    insertNewJob
}
