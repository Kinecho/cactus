export interface ActiveUsersArguments {
    days: number,
}

export function buildActiveUsersQuery(args: ActiveUsersArguments): string {
    return `select count(distinct cactusMemberId) as count
from cactus_prod.reflection_responses r
where DATE(r.createdAt, 'America/Denver') > DATE_SUB(DATE(CURRENT_TIMESTAMP(), 'America/Denver'), INTERVAL ${args.days} DAY)`;
}

export function processActiveUsersResults(rows: any[]): number {
    if (rows.length === 0) {
        return 0;
    }

    return rows[0].count;
}