import FirestoreService, {ListenerUnsubscriber, Query} from "@web/services/FirestoreService";
import ReflectionPrompt, {Field} from "@shared/models/ReflectionPrompt";
import {Collection} from "@shared/FirestoreBaseModels";
import {getISODate, hoursToMilliseconds, minusDays, minutesToMilliseconds} from "@shared/util/DateUtil";
import {QuerySortDirection} from "@shared/types/FirestoreConstants";

export default class ReflectionPromptService {
    public static sharedInstance = new ReflectionPromptService();
    firestoreService = FirestoreService.sharedInstance;

    getCollectionRef() {
        return this.firestoreService.getCollectionRef(Collection.reflectionPrompt)
    }

    async executeQuery(query: Query) {
        return this.firestoreService.executeQuery(query, ReflectionPrompt);
    }

    async getFirst(query: Query) {
        return this.firestoreService.getFirst(query, ReflectionPrompt);
    }

    async save(model: ReflectionPrompt): Promise<ReflectionPrompt> {
        return this.firestoreService.save(model);
    }

    async getById(id: string): Promise<ReflectionPrompt | undefined> {
        return await this.firestoreService.getById(id, ReflectionPrompt);
    }

    async getTodaysPrompt(): Promise<ReflectionPrompt | undefined> {
        const query = this.getCollectionRef()
            .where(Field.sendDate, "<=", this.firestoreService.getCurrentTimestamp())
            // .where(Field.sendDate, ">", this.firestoreService.getTimestampFromDate(minusDays(1)))
            .orderBy(Field.sendDate, QuerySortDirection.desc)
            .limit(1);

        return await this.firestoreService.getFirst(query, ReflectionPrompt);
    }

    observeTodaysPrompt(options: {
        onData: (prompt: ReflectionPrompt | undefined) => void,
        onDateChanged: (opts: {
            unsubscriber: ListenerUnsubscriber
        }) => void
    }): ListenerUnsubscriber {
        const execute = (): ListenerUnsubscriber => {
            const query = this.getCollectionRef()
                .where(Field.sendDate, "<=", this.firestoreService.getCurrentTimestamp())
                .orderBy(Field.sendDate, QuerySortDirection.desc)
                .limit(1);

            return this.firestoreService.observeFirst(query, ReflectionPrompt, {
                onData: options.onData,
            });
        };

        let queryUnsubscriber = execute();

        const timer = setInterval(() => {
            const nextDateString = getISODate();
            console.log("checking for next date");
            if (queryUnsubscriber) {
                queryUnsubscriber();
            }
            queryUnsubscriber = execute();
            options.onDateChanged({unsubscriber: queryUnsubscriber})

        }, minutesToMilliseconds(10));

        return () => {
            queryUnsubscriber();
            clearInterval(timer);
        };
    }


}



