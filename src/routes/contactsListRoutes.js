const express = require('express');
const contactsListRoutes = express.Router();
const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');
const config = require('../../config');
const csv = require('fast-csv');
const fs = require('fs');
const path = require('path');
const jobsHelper = require('../jobsHelper');
const amqpHelper = require('../amqpHelper');

function router() {
    let outputPath = path.join(__dirname, '../..', '/downloads')


    contactsListRoutes.route('/')
        .get((req, res) => {
            (async function loadContacts() {
                try {
                    let lastId = req.query.last;
                    let direction = req.query.direction;
                    let client;
                    client = await MongoClient.connect(config.dbUrl);
                    const db = client.db(config.dbName);
                    let query = {};//{ '_id': { '$gt': last_id } }

                    if (lastId != undefined) {
                        query = {
                            _id: { [direction == "previous" ? '$lt' : '$gt']: ObjectId(lastId) }
                        };
                    }

                    let lastElement = await db.collection('contacts').findOne({}, { "sort": [['_id', -1]] });
                    let firstElement = await db.collection('contacts').findOne({}, { "sort": [['_id', 1]] })

                    let maxId = lastElement._id.toString();
                    let minId = firstElement._id.toString();

                    let sort = { "sort": [['_id', 1]] };
                    if (direction == "previous") {
                        sort = { "sort": [['_id', -1]] };
                    }
                    let contacts = await db.collection('contacts').find(query, sort).limit(10).toArray();

                    //TODO:find a better way
                    if (direction == "previous") {
                        contacts = contacts.reverse();
                    }
                    res.render('contactsListRoutesView', {
                        contacts,
                        lastId: contacts[contacts.length - 1]._id,
                        firstId: contacts[0]._id,
                        isLastPage: (contacts[contacts.length - 1]._id == maxId),
                        isFirstPage: (contacts[0]._id == minId),
                    });
                }
                catch (err) {
                    res.send(err);
                }
            }());

        });

    contactsListRoutes.route('/exportAll').get((req, res) => {
        (async function exportAll() {
            let response = await jobsHelper.insertNewJob("exportAll", "", "sent");

            let messageObj = {
                jobId: response.insertedId.toString(),
                job: "exportAll",
                outputPath
            };

            amqpHelper.sendMessageToQueue(messageObj, mkCallback(messageObj.jobId));

            function mkCallback(jobId) {
                return function (err) {
                    if (err !== null) {
                        jobsHelper.updateJobStatus(jobId, "failed")
                    }
                    else {
                        jobsHelper.updateJobStatus(jobId, "waiting in queue")
                    }
                };
            }

            return res.redirect('/jobs');
        }());
    });


    contactsListRoutes.route('/exportGroupedByDomain').get((req, res) => {
        (async function exportAll() {
            let response = await jobsHelper.insertNewJob("exportGroupedByDomain", "", "sent");

            let messageObj = {
                jobId: response.insertedId.toString(),
                job: "exportGroupedByDomain",
                outputPath
            };

            amqpHelper.sendMessageToQueue(messageObj, mkCallback(messageObj.jobId));

            function mkCallback(jobId) {
                return function (err) {
                    if (err !== null) {
                        jobsHelper.updateJobStatus(jobId, "failed")
                    }
                    else {
                        jobsHelper.updateJobStatus(jobId, "waiting in queue")
                    }
                };
            }

            return res.redirect('/jobs');
        }());
    });


    return contactsListRoutes;
}

module.exports = router;