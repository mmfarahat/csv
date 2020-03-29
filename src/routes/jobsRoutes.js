const express = require('express');
const jobsRouter = express.Router();
function router() {
    jobsRouter.route('/')
        .get((req, res) => {
            let msg = req.query.msg;
            res.render('jobsView', { msg });
        });
    return jobsRouter;
}

module.exports = router;