#!/usr/bin/env node
const { MongoClient } = require('mongodb');
const amqp = require('amqplib/callback_api');
const fs = require('fs');
let csv = require('fast-csv');
const { ObjectId } = require('mongodb');
const path = require('path');
const url = 'mongodb://localhost:27017';
const dbName = 'contacts';


amqp.connect('amqp://localhost', function (error0, connection) {
    if (error0) {
        throw error0;
    }
    connection.createChannel(function (error1, channel) {
        if (error1) {
            throw error1;
        }

        var queue = 'csvQueue';

        channel.assertQueue(queue, {
            durable: false
        });
        try {
            channel.consume(queue, function (msg) {
                (async function processContacts() {
                    let client;
                    client = await MongoClient.connect(url);
                    const db = client.db(dbName);
                    let messageObj = JSON.parse(msg.content.toString());
                    await updateJobStatus(messageObj.jobId, "running");

                    if (messageObj.job == "import") {
                        const response = await db.collection('contacts').insertMany(messageObj.data);
                        await updateJobStatus(messageObj.jobId, "completed", messageObj.batchId);

                        const allCompletedResponse = await db.collection('jobs').findOne({ _id: ObjectId(messageObj.jobId), "arrayOfSubBatches.status": { $ne: "completed" } });

                        if (allCompletedResponse == null) //all batches are completed
                            await updateJobStatus(messageObj.jobId, "completed");

                    } else if (messageObj.job == "exportAll") {
                        let outputfilepath = path.join(messageObj.outputPath, "exportAll_" + messageObj.jobId + ".csv");
                        let ws = fs.createWriteStream(outputfilepath, { flag: 'a' });
                        const cursor = db.collection('contacts').find().batchSize(1000);
                        ws.write("first_name,last_name,email\r\n");
                        while (await cursor.hasNext()) {
                            let doc = await cursor.next();
                            ws.write(doc.first_name.toString() + "," + doc.last_name.toString() + "," + doc.email.toString() + "\r\n");
                        }
                        ws.close();

                        await updateJobOutputFileName(messageObj.jobId, "exportAll_" + messageObj.jobId + ".csv");

                    } else if (messageObj.job == "exportGroupedByDomain") {

                        let outputfilepath = path.join(messageObj.outputPath, "exportGroupedByDomain_" + messageObj.jobId + ".csv");
                        let ws = fs.createWriteStream(outputfilepath, { flag: 'a' });
                        const cursor = db.collection('contacts').aggregate([{ "$group": { _id: "$domain", count: { $sum: 1 } } }, { $sort: { "count": -1 } }]).batchSize(1000);
                        ws.write("domain,count\r\n");
                        while (await cursor.hasNext()) {
                            let doc = await cursor.next();
                            ws.write(doc._id.toString() + "," + doc.count.toString() + "\r\n");
                        }
                        ws.close();

                        await updateJobOutputFileName(messageObj.jobId, "exportGroupedByDomain_" + messageObj.jobId + ".csv");

                    }

                    channel.ack(msg);


                }());
            }, {
                noAck: false
            });
        }
        catch (err) {
            console.log(err);
        }
    });
});

async function updateJobStatus(jobId, status, batchId) {
    try {
        let client;
        client = await MongoClient.connect(url);
        const db = client.db(dbName);
        const response = undefined;
        if (batchId != undefined) {
            response = await db.collection('jobs').updateOne({ _id: ObjectId(jobId), "arrayOfSubBatches.batchId": batchId }, { $set: { "arrayOfSubBatches.$.status": status } });
        } else {
            response = await db.collection('jobs').updateOne({ _id: ObjectId(jobId) }, { $set: { "status": status } });
        }

        // await db.collection('jobs').updateOne({ _id: ObjectId(jobId) }, { $set: { "status": status } });
        //> db.jobs.findOne({_id:ObjectId("5e81ce44356d022cab8bd0e7"),"arrayOfSubBatches.status":{$ne: "completed"}})
        return response;

    }
    catch (err) {
        console.log(err);
    }
}

async function updateJobOutputFileName(jobId, outputFileName) {
    try {
        let client;
        client = await MongoClient.connect(url);
        const db = client.db(dbName);
        const response = await db.collection('jobs').updateOne({ _id: ObjectId(jobId) }, { $set: { "outputFileName": outputFileName, "status": "completed" } });
        console.log("updateJobOutputFileName response: " + response);
        return response;
    }
    catch (err) {
        console.log(err);
    }
}
