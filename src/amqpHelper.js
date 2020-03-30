const amqp = require('amqplib');
const sendMessageToQueue = async (messageObj, callback) => {
    let connection = await amqp.connect('amqp://localhost');
    let confirmChannel = await connection.createConfirmChannel();
    confirmChannel.sendToQueue('csvQueue', Buffer.from(JSON.stringify(messageObj)), {},
        callback);
    // setTimeout(function () {
    //     connection.close();
    // }, 500);
}

module.exports = {
    sendMessageToQueue
}