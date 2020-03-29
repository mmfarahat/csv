const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const _ = require('lodash');
const path = require('path');
const { MongoClient } = require('mongodb');
const config = require('./config');
const app = express();
const port = process.env.PORT || 4444;



app.use('/css', express.static(path.join(__dirname, '/node_modules/bootstrap/dist/css')));
app.use('/js', express.static(path.join(__dirname, '/node_modules/bootstrap/dist/js')));
app.use('/js', express.static(path.join(__dirname, '/node_modules/jquery/dist')));
app.set('views', './src/views');
app.set('view engine', 'ejs');

// enable files upload
app.use(fileUpload({
    createParentPath: true
}));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

const jobsRouter = require('./src/routes/jobsRoutes')();
const fileRouter = require('./src/routes/fileRoutes')();
const contactsListRoutes = require('./src/routes/contactsListRoutes')();

app.use('/jobs', jobsRouter);
app.use('/file', fileRouter);
app.use('/contactsList', contactsListRoutes);

app.get('/', (req, res) => {

    (async function loadIndex() {

        let client;
        client = await MongoClient.connect(config.dbUrl);
        const db = client.db(config.dbName);

        let numberOfContacts = await db.collection('contacts').countDocuments({});

        let err = req.query.err;
        res.render(
            'index', { error: err, numberOfContacts }
        );
    }());


});
app.get('/download', function (req, res) {
    if (req.query.fileName != undefined && req.query.fileName != "") {
        const file = path.join(__dirname, '/downloads', req.query.fileName);
        res.download(file, (err) => {
            if (err)
                res.send("not found");
        });
        return;
    }
    res.send("not found");
});

app.listen(port, () => {
    console.log(`listening on port ${port}`);
});
