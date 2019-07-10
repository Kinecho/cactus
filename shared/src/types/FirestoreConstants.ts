import {GetOptions, IQueryOptions} from "@shared/types/FirestoreTypes";


export const DefaultGetOptions: GetOptions = {
    includeDeleted: false,
    onlyDeleted: false,
};

export const DefaultQueryOptions: IQueryOptions<any> = {
    includeDeleted: false,
    onlyDeleted: false,
};



export enum QuerySortDirection {
    desc = "desc",
    asc = "asc",
}