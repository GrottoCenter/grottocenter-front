import { v7 as uuidv7 } from 'uuid';

// One id per page load and authentication phase, including anonymous visits.
// Never persist it: reloads, restored pages and other tabs start a new group.
let sessionTraceId = uuidv7();

export const getSessionTraceId = () => sessionTraceId;

export const renewSessionTraceId = () => {
  sessionTraceId = uuidv7();
};
