const express = require('express');
const fileRouter = express.Router();
function router() {
    fileRouter.route('/upload')
        .post((req, res) => {
            try {
                if (!req.files) {
                    res.send({
                        status: false,
                        message: 'No file uploaded'
                    });
                } else {
                    res.send({
                        status: true,
                        message: 'File is uploaded'
                    });
                }
            } catch (err) {
                res.status(500).send(err);
            }
        });
    return fileRouter;
}

module.exports = router;