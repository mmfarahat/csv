const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const _ = require('lodash');
const path = require('path');


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
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));

const jobsRouter = require('./src/routes/jobsRoutes')();
const fileRouter = require('./src/routes/fileRoutes')();

app.use('/jobs', jobsRouter);
app.use('/file', fileRouter);

app.get('/', (req, res) => {
    res.render(
        'index'
    );
});

app.listen(port, () => {
    console.log(`listening on port ${port}`);
});
