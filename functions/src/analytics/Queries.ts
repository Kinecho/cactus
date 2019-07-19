import {buildActiveUsersQuery} from "@api/analytics/queries/activeUsers";

export enum QueryName {
    activeUsers
}

export const QueryString: { [id in QueryName]: (...args: any) => string } = {
    [QueryName.activeUsers]: buildActiveUsersQuery,
};

export function getQuery(name: QueryName): (...args: any) => string | undefined {
    return QueryString[name] || (() => undefined);
}