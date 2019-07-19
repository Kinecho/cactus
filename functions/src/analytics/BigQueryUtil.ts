import {BigQuery} from "@google-cloud/bigquery";
import {buildActiveUsersQuery, processActiveUsersResults} from "@api/analytics/queries/activeUsers";
import {getConfig} from "@api/config/configService";

export async function getActiveUserCountForTrailingDays(days: number): Promise<number> {
    try {

        const config = getConfig();
        const bigqueryServiceAccount = config.bigquery_service_account;
        const projectId = bigqueryServiceAccount.project_id;
        const bigquery = new BigQuery({projectId, credentials: bigqueryServiceAccount});


        console.log(`getting active user count for last ${days} days`);

        const options: any = {
            query: buildActiveUsersQuery({days}),
            location: 'US'
        };

        const [job] = await bigquery.createQueryJob(options);
        console.log(`Job ${job.id} started`);
        const [rows] = await job.getQueryResults();

        return processActiveUsersResults(rows);
    } catch (e) {
        console.error("Failed to execute query", e);
        return 0;
    }

}