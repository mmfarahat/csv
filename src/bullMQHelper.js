const { Queue, QueueEvents } = require('bullmq');
const jobsHelper = require('./jobsHelper');

const csvQueue = new Queue('csvQueue');

const sendMessageToQueue = async (messageObj) => {
    const result = await csvQueue.add(messageObj.job, messageObj);
    return result;
}
module.exports = {
    sendMessageToQueue
}


