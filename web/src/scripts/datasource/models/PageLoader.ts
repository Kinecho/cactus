import {BaseModel} from "@shared/FirestoreBaseModels";
import {ListenerUnsubscriber, PageListenerResult} from "@web/services/FirestoreService";


export interface IPageLoader<T extends BaseModel> {
    result?: PageListenerResult<T>;
    finishedLoading: boolean;
    listener?: ListenerUnsubscriber
}

export class PageLoader<T extends BaseModel> implements IPageLoader<T> {
    result?: PageListenerResult<T>;
    listener?: ListenerUnsubscriber;

    get finishedLoading() {
        return !!this.result?.results
    }

    deinit() {
        this.listener?.()
    }
}