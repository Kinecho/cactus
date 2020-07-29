import * as functions from "firebase-functions";
import Logger, { LoggerAgent } from "@shared/Logger"


export const CFLogger: LoggerAgent = {
    debug: functions.logger.debug,
    log: functions.logger.log,
    info: functions.logger.info,
    warn: functions.logger.warn,
    error: functions.logger.error,
}


export function configureLogger() {
    Logger.setAgent(CFLogger)
}
