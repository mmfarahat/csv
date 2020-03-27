const express = require('express');
const jobsRouter = express.Router();
function router() {
    jobsRouter.route('/')
        .get((req, res) => {
            res.render('jobsView');
        });
    return jobsRouter;
}

module.exports = router;