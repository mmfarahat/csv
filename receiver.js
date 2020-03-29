#!/usr/bin/env node
const { MongoClient } = require('mongodb');
const amqp = require('amqplib/callback_api');
const fs = require('fs');
let csv = require('fast-csv');

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
        channel.consume(queue, function (msg) {
            (async function insertContacts() {
                const url = 'mongodb://localhost:27017';
                const dbName = 'contacts';
                let client;
                client = await MongoClient.connect(url);
                const db = client.db(dbName);
                let contactsArr = JSON.parse(msg.content.toString());
                const response = await db.collection('contacts').insertMany(contactsArr);
                console.dir(response);
            }());
        }, {
            noAck: true
        });
    });
});
