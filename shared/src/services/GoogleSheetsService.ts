import {google, sheets_v4} from "googleapis";
import Schema$Spreadsheet = sheets_v4.Schema$Spreadsheet;
import Sheets = sheets_v4.Sheets;
import {CactusConfig} from "@shared/CactusConfig";
import Schema$ValueRange = sheets_v4.Schema$ValueRange;
import Schema$UpdateValuesResponse = sheets_v4.Schema$UpdateValuesResponse;
import {toCamelCamse} from "@shared/util/StringUtil";

export interface DataResult<T> {
    rawHeaders: string[],
    fieldNames: string[],
    fieldColumns: { [key: string]: number },
    rows: RowResult<T>[],
    warnings?: any[]
    error?: any
}

export interface RowResult<T> {
    _rowIndex: number,
    data: T
}

export default class GoogleSheetsService {
    protected static sharedInstance: GoogleSheetsService;

    sheets: Sheets;
    config: CactusConfig;

    static getSharedInstance(): GoogleSheetsService {
        if (!GoogleSheetsService.sharedInstance) {
            throw new Error("No shared instance available. Ensure you initialize GoogleSheetsService before using it");
        }
        return GoogleSheetsService.sharedInstance;
    }

    static initialize(config: CactusConfig) {
        GoogleSheetsService.sharedInstance = new GoogleSheetsService(config);
    }

    constructor(config: CactusConfig) {
        const credentials = config.sheets.service_account;
        const auth = new google.auth.JWT(
            credentials.client_id, undefined, credentials.private_key,
            ['https://www.googleapis.com/auth/spreadsheets']
        );
        this.sheets = google.sheets({version: 'v4', auth});
        this.config = config;
    }


    async getSpreadsheet(sheetId: string): Promise<Schema$Spreadsheet> {
        // const jwt = getJwt();
        // const auth = await google.auth.getClient({
        //     scopes: ['https://www.googleapis.com/auth/spreadsheets']
        // });

        const sheetResponse = await this.sheets.spreadsheets.get({spreadsheetId: sheetId});
        console.log("got sheet!", sheetResponse.headers);

        return sheetResponse.data;

    }

    async readSpreadsheet(spreadsheetId: string, range: string = "A:Z"): Promise<Schema$ValueRange> {
        return (await this.sheets.spreadsheets.values.get({spreadsheetId: spreadsheetId, range: range})).data;
    }

    async updateValues(spreadsheetId: string, range: string, data: any[][]): Promise<Schema$UpdateValuesResponse> {
        const response = await this.sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheetId,
            valueInputOption: "RAW",
            range,
            requestBody: {
                values: data
            }
        }, {});

        return response.data;
    }

    async appendValues(sheetId: string, range: string, data: any[][]): Promise<Schema$UpdateValuesResponse> {
        const response = await this.sheets.spreadsheets.values.append({
            spreadsheetId: sheetId,
            valueInputOption: "RAW",
            range,
            includeValuesInResponse: true,
            requestBody: {
                values: data
            }
        }, {});

        return response.data;
    }

    static defaultRowProcessor<T>(fields: string[]): (row: any[], index: number) => RowResult<T> {

        console.log("header Fields ", fields);
        return function (row: any[], rowIndex: number): RowResult<T> {
            const data = fields.reduce((object: any, header: any, index: number,) => {
                object[header] = row[index];
                return object;
            }, {});

            return {_rowIndex: rowIndex, data};
        }
    }

    static valuesToJson<T>(options: { values: any[][] | undefined, hasHeaderRow: boolean, fieldNames?: string[] },
                           rowProcessor: ((headers: string[]) => (row: any[], index: number) => RowResult<T>) = GoogleSheetsService.defaultRowProcessor): DataResult<T> {
        const fieldNames = options.fieldNames;
        let rawHeaders: string[] | undefined = undefined;


        if (!options.values) {
            return {
                rawHeaders: [],
                fieldNames: fieldNames || [],
                rows: [],
                error: "No values provided",
                fieldColumns: {}
            };
        }

        if (options.hasHeaderRow) {
            const firstRow = options.values.shift();
            console.log("setting rawheaders to first row", firstRow);
            rawHeaders = firstRow || [];
        }


        if (!rawHeaders) {
            throw new Error("No header values provided. Unable to process values");
        }

        const fields = fieldNames || rawHeaders.map(header => toCamelCamse(header));
        const fieldColumns: { [key: string]: number } = fields.reduce((map: { [key: string]: number }, name, index) => {
            map[name] = index;
            console.log("field amp", map);
            return map;
        }, {});

        console.log("fields are", fields);
        const handler = rowProcessor(fields);

        const data = options.values;
        if (data.length > 0) {
            if (data[0].length !== fields.length) {
                throw new Error("The length of the headers does not match the number of columns for each row.");
            }

            const processedData = data.map((row, index) => {
                console.log("processing row", row);
                const object = handler(row, index);
                console.log("got row", object);
                return object;
            });

            return {
                fieldNames: fields,
                rows: processedData,
                rawHeaders,
                fieldColumns,
            }
        }

        return {rawHeaders, fieldNames: fields || [], rows: [], fieldColumns};
    }

    async writeValues(options: {
        fieldNames: string[],
        rows: RowResult<any>[],
        // range: string,
        spreadsheetId: string,
        sheetName: string,
    }): Promise<Schema$UpdateValuesResponse> {

        const values: any[][] = options.rows.map(object => {
            const row: any[] = [];
            options.fieldNames.forEach(key => {
                row.push(object.data[key]);
            });

            return row;
        });

        // values.unshift(options.fieldNames);

        console.log("Prepared values", JSON.stringify(values, null, 2));

        const headerRange = `'${options.sheetName}'!A1:Z1`;
        await this.updateValues(options.spreadsheetId, headerRange, [options.fieldNames]);

        const valuesRange = `'${options.sheetName}'!A2:Z`;
        return await this.appendValues(options.spreadsheetId, valuesRange, values);
    }

}



