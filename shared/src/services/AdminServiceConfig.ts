import * as admin from 'firebase-admin'
import {CactusConfig} from "@shared/CactusConfig";
import MailchimpService from "@shared/services/MailchimpService";
import AdminFirestoreService from "@shared/services/AdminFirestoreService";
import AdminCactusMemberService from "@shared/services/AdminCactusMemberService";
import AdminUserService from "@shared/services/AdminUserService";
import AdminSentPromptService from "@shared/services/AdminSentPromptService";
import AdminReflectionPromptService from "@shared/services/AdminReflectionPromptService";
import AdminSlackService from "@shared/services/AdminSlackService";
import {setTimestamp} from "@shared/util/FirestoreUtil";

export function initializeServices(config: CactusConfig, app: admin.app.App, timestampClass: any) {
    console.log("initializing all services");
    setTimestamp(timestampClass || admin.firestore.Timestamp);

    AdminFirestoreService.initialize(app);
    AdminSlackService.initialize(config);
    MailchimpService.initialize(config);
    AdminCactusMemberService.initialize();
    AdminUserService.initialize(config);
    AdminReflectionPromptService.initialize();
    AdminSentPromptService.initialize();


}