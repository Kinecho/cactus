import * as admin from "firebase-admin";
import * as express from "express";
import Logger from "@shared/Logger";
import { AxiosError } from "axios";
import { QueryParam } from "@shared/util/queryParams";
import { AppType } from "@shared/types/DeviceTypes";

const logger = new Logger("RequestUtil")

export const SentryExpressHanderConfig = {
    server: false,
    user: false,
}

export async function getAuthUser(request: express.Request): Promise<admin.auth.UserRecord | undefined> {
    try {
        const startTime = new Date().getTime();
        const userId = await getAuthUserId(request);
        if (userId) {
            const user = await admin.auth().getUser(userId);
            const endTime = new Date().getTime();
            logger.log(`Get auth user took ${ endTime - startTime }ms`);
            return user;
        }
        return;
    } catch (error) {
        logger.error("Failed to get user", error);
        return;
    }
}

export async function getAuthUserId(request: express.Request): Promise<string | undefined> {
    const startTime = new Date().getTime();
    const bearer = request.headers.authorization;
    if (!bearer && !request.query[QueryParam.AUTH_TOKEN]) {
        return;
    }
    let token = request.query[QueryParam.AUTH_TOKEN] as string | undefined;

    if (!token && bearer) {
        [, token] = bearer.split("Bearer ");
    }
    if (!token) {
        return undefined;
    }
    try {
        const verifiedToken = await admin.auth().verifyIdToken(token);
        const endTime = new Date().getTime();
        logger.log(`Verify auth bearer took ${ endTime - startTime }ms`);
        return verifiedToken.uid;
    } catch (error) {
        logger.error("Unable to verify ID token or get a user", error);
        return undefined;
    }
}

export function getAppType(request: express.Request): AppType | undefined {
    const agent = request.header("user-agent");
    logger.info("Found user agent", agent);

    if (agent === "CactusAndroid") {
        return AppType.ANDROID
    }

    return;
}


export function isAxiosError(error: any): error is AxiosError {
    return error.isAxiosError
}