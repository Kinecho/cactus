import * as functions from "firebase-functions";
import * as Sentry from "@sentry/node";
import { Severity } from "@sentry/types"
import Logger, { LoggerAgent, LogLevel } from "@shared/Logger"
import { CactusConfig } from "@admin/CactusConfig";
import { RewriteFrames } from "@sentry/integrations";
import { isError, isString, stringifyJSON } from "@shared/util/ObjectUtil";
import { isBlank } from "@shared/util/StringUtil";

export const CFLogger: LoggerAgent = {
    debug: functions.logger.debug,
    log: functions.logger.log,
    info: functions.logger.info,
    warn: functions.logger.warn,
    error: functions.logger.error,
}

export function getSentrySeverity(level: LogLevel): Severity {
    switch (level) {
        case LogLevel.debug:
            return Severity.Debug;
        case LogLevel.info:
            return Severity.Info;
        case LogLevel.log:
            return Severity.Log;
        case LogLevel.warn:
            return Severity.Warning;
        case LogLevel.error:
            return Severity.Error;
        default:
            return Severity.Error;
    }
}

/**
 * Sets the LoggerAgent to be the CloudFunctions logging package.
 * Adds Sentry reporting to the logger for Cloud Function use.
 * @param {CactusConfig} config
 */
export function configureLogger(config: CactusConfig) {
    const functionName = process.env.FUNCTION_NAME || process.env.K_SERVICE || undefined;
    const sentryOptions: Sentry.NodeOptions = {
        dsn: config.sentry.functions_dsn,
        environment: config.app.environment,
        release: config.sentry.release,
        serverName: functionName || "not_set",
        integrations: [new RewriteFrames({
            root: global.__rootdir__
        })]
    };

    Sentry.init(sentryOptions);

    Logger.setAgent(CFLogger)
    Logger.onLog = (level: LogLevel, ...args: any[]) => {
        if (level > LogLevel.warn) {
            console.log("Handling a log", ...args)
            handleArgs(level, ...args)
            Sentry.flush(2000).catch(error => {
                console.log("There was an error flushing sentry logs", error);
            })
        }
    }
}

function handleArgs(level: LogLevel, ...args: any[]) {
    const messages: string[] = [];
    const exceptions: Error[] = [];
    const severity = getSentrySeverity(level);
    if (Array.isArray(args)) {
        args.forEach(arg => {
            if (isError(arg)) {
                exceptions.push(arg);
            } else if (isString(arg)) {
                messages.push(arg);
            } else {
                messages.push(stringifyJSON(arg, 2))
            }
        })
    } else if (isError(args)) {
        exceptions.push(args);
    } else if (isString(args)) {
        messages.push(args);
    } else {
        messages.push(stringifyJSON(args, 2))
    }

    const [firstError, ...otherErrors] = exceptions;
    const messageString = messages.join(" ");

    if (firstError) {
        const extra: Record<string, any> = {}
        if (messages.length > 0) {
            extra.messages = messages;
        }
        if (otherErrors.length > 0) {
            extra.moreErrors = otherErrors;
        }

        Sentry.captureException(firstError, {
            level: severity,
            extra,
        })
    } else if (!isBlank(messageString)) {
        Sentry.captureException(Error(messageString), { level: severity })
    } else {
        Sentry.captureException(Error("unknown error"), { level: severity })
    }
}
