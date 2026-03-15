import { Queue } from 'bullmq';
import { getRedisConnection } from './redis';

export const emailQueue = new Queue('scheduled-emails', {
  connection: getRedisConnection(),
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});
