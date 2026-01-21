// see https://github.com/mu-semtech/mu-javascript-template for more info

import { app, errorHandler } from "mu";
import bodyParser from "body-parser";

import { run } from "./lib/pipeline";
import { Delta } from "./lib/delta";
import { STATUS_SCHEDULED } from "./constant";
import { waitForDatabase, getUnfinishedTasks } from "./lib/task";
import { Lock } from 'async-await-mutex-lock';

/**
 * Lock to make sure that some functions don't run at the same time. E.g. when
 * a delta is still processing, you don't want to allow the manual searching
 * and restarting as it will also pick up the delta that is already busy
 * processing.
 */
const LOCK = new Lock();

/**
 * Find unfinished tasks (busy or scheduled) and start them (again) from
 * scratch.
 *
 * @async
 * @function
 * @returns { undefined } Nothing
 */
async function findAndStartUnfinishedTasks() {
  try {
    const unfinishedTasks = await getUnfinishedTasks();
    console.log(unfinishedTasks)
    for (const term of unfinishedTasks) await run(term.value);
  } catch (e) {
    console.error('Something went wrong while scheduling unfinished taks', e);
  }
}

/**
 * Run on startup.
 */
setTimeout(async () => {
  console.log('check if there is a task');
  await waitForDatabase();
  await findAndStartUnfinishedTasks();
}, 1000);

app.get("/", function (_req, res) {
    res.send("Hello mu-javascript-template");
});

app.post('/find-and-start-unfinished-tasks', async function (req, res) {
  res
    .json({ status: 'Finding and restarting unfinished tasks' })
    .status(200)
    .end();
  await LOCK.acquire();
  try {
    await findAndStartUnfinishedTasks();
  } finally {
    LOCK.release();
  }
});

app.post('/force-retry-task', async function (req, res) {
  const taskUri = req.body?.uri;
  if (!taskUri)
    res.status(400).send({
      status:
        'No task URI given in the request body. Please send a JSON body with a `status` key and a task URI as value.',
    });
  res.status(200).send({ status: `Force restarting task \`${taskUri}\`` });
  await LOCK.acquire();
  try {
    await processTask(namedNode(taskUri));
  } finally {
    LOCK.release();
  }
});

app.post("/delta", bodyParser.json({ limit: "50mb" }), async function (req, res, next) {
    try {
        await LOCK.acquire();

        const entries = new Delta(req.body).getInsertsFor(
            "http://www.w3.org/ns/adms#status",
            STATUS_SCHEDULED,
        );
        if (!entries.length) {
            console.log(
                "Delta did not contain potential tasks that are ready for scanning a docker image. awaiting the next batch!",
            );
            return res.status(204).send();
        }
        for (let entry of entries) {
            run(entry);
        }
        return res.status(200).send().end();
    } catch (e) {
        console.error(
        'Something unexpected went wrong while handling delta task!',
        e,
        );
    } finally {
        LOCK.release();
    }
});

app.use(errorHandler);
