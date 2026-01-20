import { uuid } from "mu";
import { querySudo as query } from "@lblod/mu-auth-sudo";

import {
    STATUS_BUSY,
    STATUS_SUCCESS,
    STATUS_FAILED,
    PREFIXES,
    HIGH_LOAD_DATABASE_ENDPOINT,
    BATCH_SIZE,
} from "../constant";
import { loadTask, updateTaskStatus, appendTaskResultFile, appendTaskResultGraph, appendTaskError } from "./task";
import { appendTempFile, makeEmptyFile, writeFile } from "./file-helper";
import { toTermObjectArray } from "./super-utils";

export async function run(deltaEntry) {
    const task = await loadTask(deltaEntry);
    if (!task) return;
    try {
        await updateTaskStatus(task, STATUS_BUSY);
        const graphContainer = { id: uuid() };
        graphContainer.uri = `http://redpencil.data.gift/id/dataContainers/${graphContainer.id}`;
       
        console.log("Processing Entity Linking task:", task.task);
       
        await updateTaskStatus(task, STATUS_SUCCESS);
    } catch (e) {
        console.error(e);
        if (task) {
            await appendTaskError(task, e.message);
            await updateTaskStatus(task, STATUS_FAILED);
        }
    }
}
