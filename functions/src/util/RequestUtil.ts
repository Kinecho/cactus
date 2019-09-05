import * as admin from "firebase-admin";
import * as express from "express";

export async function getAuthUser(request: express.Request): Promise<admin.auth.UserRecord | undefined> {
    const bearer = request.headers.authorization;
    if (!bearer) {
        return;
    }

    const [, token] = bearer.split("Bearer ");
    if (!token) {
        return undefined;
    }
    try {
        const verifiedToken = await admin.auth().verifyIdToken(token);
        const userId = verifiedToken.uid;


        if (userId) {
            return await admin.auth().getUser(userId);
        }

    } catch (error) {
        console.error("Unable to verify ID token or get a user", error);
        return undefined;
    }


    return;
}