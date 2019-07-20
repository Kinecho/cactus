export interface ActiveUsersArguments {
    days: number,
}

export function buildActiveUsersQuery(args: ActiveUsersArguments): string {
    const hours = args.days * 24;
    
    return `select count(distinct cactusMemberId) as count
from cactus_prod.reflection_responses r
where r.createdAt > TIME_SUB(CURRENT_TIMESTAMP(), INTERVAL ${hours} HOUR)`;
}

export function processActiveUsersResults(rows: any[]): number {
    if (rows.length === 0) {
        return 0;
    }

    return rows[0].count;
}