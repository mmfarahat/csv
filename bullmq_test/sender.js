const { Queue,QueueEvents } = require('bullmq');

const myQueue = new Queue('foo');

async function addJobs(){
    debugger
  let result=  await myQueue.add('myJobName', { foo: 'bar' });

  console.log(result.id);
    await myQueue.add('myJobName', { qux: 'baz' });    
}

 addJobs();

const queueEvents = new QueueEvents("foo");

queueEvents.on('waiting', ({ jobId }) => {
    console.log(`A job with ID ${jobId} is waiting`);
});

queueEvents.on('active', ({ jobId, prev }) => {
    console.log(`Job ${jobId} is now active; previous status was ${prev}`);
});

queueEvents.on('completed', ({ jobId, returnvalue }) => {
    console.log(`${jobId} has completed and returned ${returnvalue}`);
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
    console.log(`${jobId} has failed with reason ${failedReason}`);
});
//6379