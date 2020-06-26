import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import EmailLog, { TemplateName } from "@shared/models/EmailLog";
import { CactusConfig } from "@admin/CactusConfig";
import { flattenUnique } from "@shared/util/FirestoreUtil";
import Logger from "@shared/Logger";
import { Collection } from "@shared/FirestoreBaseModels";

/**
 * Options you can pass to search for an email log.
 */
export interface SearchEmailLogOptions {
    /**
     * The email address of the member to search for
     */
    email: string,
    templateName?: TemplateName,
    /**
     * Limit the search range to a given number of days ago
     */
    // sinceDaysAgo?: number,
    sendgridTemplateId?: string,
    memberId?: string,
}

export default class AdminEmailLogService {
    protected static sharedInstance: AdminEmailLogService;
    firestoreService: AdminFirestoreService;
    config: CactusConfig;
    logger = new Logger("AdminEmailLogService");

    constructor(config: CactusConfig) {
        this.firestoreService = AdminFirestoreService.getSharedInstance();
        this.config = config;
    }

    static getSharedInstance(): AdminEmailLogService {
        if (!AdminEmailLogService.sharedInstance) {
            throw new Error("No shared instance available. Ensure you initialize AdminEmailLogService before using it");
        }
        return AdminEmailLogService.sharedInstance;
    }

    static initialize(config: CactusConfig) {
        AdminEmailLogService.sharedInstance = new AdminEmailLogService(config);
    }

    getCollectionRef() {
        return this.firestoreService.getCollectionRef(Collection.emailLogs);
    }

    async save(model: EmailLog): Promise<EmailLog> {
        return this.firestoreService.save(model);
    }

    async getById(id: string): Promise<EmailLog | undefined> {
        return await this.firestoreService.getById(id, EmailLog);
    }

    async executeQuery(query: FirebaseFirestore.Query) {
        return this.firestoreService.executeQuery(query, EmailLog)
    }

    protected appendSearchQueryClauses(_query: FirebaseFirestore.Query, options: SearchEmailLogOptions): FirebaseFirestore.Query {
        const {templateName, sendgridTemplateId} = options;
        let query = _query;
        if (templateName) {
            query = query.where(EmailLog.Fields.templateName, "==", templateName);
        }

        if (sendgridTemplateId) {
            query = query.where(EmailLog.Fields.sendgridTemplateId, "==", sendgridTemplateId);
        }
        return query;
    }

    async searchByEmail(options: SearchEmailLogOptions): Promise<EmailLog[]> {
        const {email} = options;
        if (!email) {
            return [];
        }

        let query = this.getCollectionRef().where(EmailLog.Fields.email, "==", email);
        query = this.appendSearchQueryClauses(query, options);

        const results = await this.executeQuery(query);
        return results.results
    }

    async searchByMemberId(options: SearchEmailLogOptions): Promise<EmailLog[]> {
        const {memberId} = options;
        if (!memberId) {
            return [];
        }

        let query = this.getCollectionRef().where(EmailLog.Fields.memberId, "==", memberId);
        query = this.appendSearchQueryClauses(query, options);

        const results = await this.executeQuery(query);
        return results.results;
    }

    async search(options: SearchEmailLogOptions): Promise<EmailLog[]> {
        const {email, memberId, templateName} = options;
        this.logger.info(`Searching for emails send to ${email} | memberId: ${memberId} | Template: ${templateName}`);
        const searchResultGroups = await Promise.all([
            this.searchByEmail(options),
            this.searchByMemberId(options),
        ]);

        const searchResults = flattenUnique(searchResultGroups);
        this.logger.info(`Found ${searchResults.length} search results`);
        return searchResults;
    }
}