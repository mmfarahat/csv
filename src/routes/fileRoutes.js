const express = require('express');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const fileRouter = express.Router();
let csv = require('fast-csv');

function router() {
    fileRouter.route('/upload')
        .post((req, res) => {
            try {
                if (req.files) {

                    if (req.files.fileupload.size === 0) {
                        return next(new Error("Hey, first would you select a file?"));
                    }
                    //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
                    let fileupload = req.files.fileupload;

                    //Use the mv() method to place the file in upload directory (i.e. "uploads")
                    let aa = fileupload.mv(path.join(__dirname, '..', '..', '/uploads/', fileupload.name));

                    res.send({
                        status: true,
                        message: 'file uploaded'
                    });
                } else {
                    res.send({
                        status: false,
                        message: 'No file uploaded'
                    });
                }
            } catch (err) {
                res.status(500).send(err);
            }
        });

    fileRouter.route('/insert')
        .get((req, res) => {
            (async function insertContacts() {
                const url = 'mongodb://localhost:27017';
                const dbName = 'contacts';
                let client;
                client = await MongoClient.connect(url);


                const db = client.db(dbName);
                let csvData = [];
                fs.createReadStream(path.join(__dirname, '..', '..', '/uploads/', 'contacts.csv'))
                    .pipe(csv.parse({ headers: true }))
                    .on('error', error => console.error(error))
                    .on('data',
                        data => {
                            csvData.push({
                                first_name: data['first_name'],
                                last_name: data['last_name'],
                                email: data['email'],
                                domain: data['email'].split('@')[1]
                            });
                        })
                    .on('end', async () => {
                        const response = await db.collection('contacts').insertMany(csvData);
                        res.json(response);
                    });
            }());
        });
    return fileRouter;
}

module.exports = router;