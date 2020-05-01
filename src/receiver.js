const { MongoClient } = require('mongodb');
const { Worker, Queue } = require('bullmq');
const fs = require('fs');
let csv = require('fast-csv');
const { ObjectId } = require('mongodb');
const path = require('path');
const url = 'mongodb://localhost:27017';
const dbName = 'contacts';
const util = require('util');
const jobsHelper = require('./jobsHelper');
const queueName = "csvQueue";

const csvQueue = new Queue(queueName);


const worker = new Worker(queueName, async messageObj => {
    // console.log(`messageObj.data.job: ${messageObj.data.job}`);
    // console.log(util.inspect(messageObj, false, null, true /* enable colors */))
    let client;
    client = await MongoClient.connect(url);
    const db = client.db(dbName);
    if (messageObj.data.job == "import") {
        //console.log(util.inspect(messageObj, false, null, true /* enable colors */));
        const response = await db.collection('contacts').insertMany(messageObj.data.data);
    } 
    else if (messageObj.data.job == "exportAll") {
      
        let outputfilepath = path.join(messageObj.data.outputPath, "exportAll_" + messageObj.id + ".csv");
        let ws = fs.createWriteStream(outputfilepath, { flag: 'a' });
        const cursor = db.collection('contacts').find().batchSize(1000);
        ws.write("first_name,last_name,email\r\n");
        while (await cursor.hasNext()) {
            let doc = await cursor.next();
            ws.write(doc.first_name.toString() + "," + doc.last_name.toString() + "," + doc.email.toString() + "\r\n");
        }
        ws.close();
        updateJobOutputFileName(messageObj.id, "exportAll_" + messageObj.id + ".csv");

    } 
    else if (messageObj.data.job == "exportGroupedByDomain") {

        let outputfilepath = path.join(messageObj.data.outputPath, "exportGroupedByDomain_" + messageObj.id + ".csv");
        let ws = fs.createWriteStream(outputfilepath, { flag: 'a' });
        const cursor = db.collection('contacts').aggregate([{ "$group": { _id: "$domain", count: { $sum: 1 } } }, { $sort: { "count": -1 } }]).batchSize(1000);
        ws.write("domain,count\r\n");
        while (await cursor.hasNext()) {
            let doc = await cursor.next();
            ws.write(doc._id.toString() + "," + doc.count.toString() + "\r\n");
        }
        ws.close();
        updateJobOutputFileName(messageObj.id, "exportGroupedByDomain_" + messageObj.id + ".csv");

    }
});

worker.on('completed', ({ id }) => {
    jobsHelper.updateJobStatus(id, "completed");
});
worker.on('active', ({ id }) => {
    jobsHelper.updateJobStatus(id, "active");
});

worker.on('failed', (job) => {
    
    jobsHelper.updateJobStatus(job.id, `failed`);
});


async function updateJobOutputFileName(jobId, outputFileName) {
    let client;
    client = await MongoClient.connect(url);
    const db = client.db(dbName);
    const response = await db.collection('jobs').updateOne({ jobId: jobId }, { $set: { "outputFileName": outputFileName } });
}
