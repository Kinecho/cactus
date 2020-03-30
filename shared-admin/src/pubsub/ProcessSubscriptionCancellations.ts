import { Message } from "firebase-functions/lib/providers/pubsub";
import CancelSubscriptionJob from "@admin/jobs/CancelSubscriptionJob";
import { stringifyJSON } from "@shared/util/ObjectUtil";
import Logger from "@shared/Logger";

const logger = new Logger("ProcessSubscriptionCancellations");

export async function onPublish(message: Message) {
  logger.info("Starting pub sub job");
  const job = new CancelSubscriptionJob();
  await job.run();
  const result = job.jobResult;
  logger.log(stringifyJSON(result, 2));
  await job.sendSlackMessage();

  return;
}
