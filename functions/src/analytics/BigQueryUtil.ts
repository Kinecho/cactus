import {BigQuery} from "@google-cloud/bigquery";
import {buildActiveUsersQuery, processActiveUsersResults} from "@api/analytics/queries/activeUsers";
import {getConfig} from "@admin/config/configService";
import Logger from "@shared/Logger";

const logger = new Logger("BigQueryUtil");
const config = getConfig();

const bigqueryServiceAccount = config.bigquery_service_account;
const projectId = bigqueryServiceAccount.project_id;
const bigquery = new BigQuery({projectId, credentials: bigqueryServiceAccount});


export async function getActiveUserCountForTrailingDays(days: number): Promise<number> {
    try {
        logger.log(`getting active user count for last ${days} days`);
        const options: any = {
            query: buildActiveUsersQuery({days}),
            location: 'US'
        };

        const [job] = await bigquery.createQueryJob(options);
        logger.log(`Job ${job.id} started`);
        const [rows] = await job.getQueryResults();

        return processActiveUsersResults(rows);
    } catch (e) {
        logger.error("Failed to execute query", e);
        return 0;
    }

}
