import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import Logger from "@shared/Logger";
import * as express from "express";
import * as admin from "firebase-admin";

const router = express.Router();
const logger = new Logger("userRoutes");

router.get("/", async (req, resp) => {
    const email = req.query.e as string | undefined;
    if (!email) {
        resp.send({ message: "Please provide an email" });
        return;
    }

    try {
        const user = await admin.auth().getUserByEmail(email);
        const member = await AdminCactusMemberService.getSharedInstance().getMemberByEmail(email);
        resp.send({ user: user.toJSON(), member: member?.toJSON() });
        return;
    } catch (error) {
        logger.error(`Failed to get user with email: ${ email }`);
        resp.send({ error, email });
    }
});

export default router;
