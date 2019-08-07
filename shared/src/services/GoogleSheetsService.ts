import {google, sheets_v4} from "googleapis";
import Schema$Spreadsheet = sheets_v4.Schema$Spreadsheet;
import Sheets = sheets_v4.Sheets;
import {CactusConfig} from "@shared/CactusConfig";
import Schema$ValueRange = sheets_v4.Schema$ValueRange;
import Schema$UpdateValuesResponse = sheets_v4.Schema$UpdateValuesResponse;


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


    async getSheet(sheetId: string): Promise<Schema$Spreadsheet> {
        // const jwt = getJwt();
        // const auth = await google.auth.getClient({
        //     scopes: ['https://www.googleapis.com/auth/spreadsheets']
        // });

        const sheetResponse = await this.sheets.spreadsheets.get({spreadsheetId: sheetId});
        console.log("got sheet!", sheetResponse.headers);

        return sheetResponse.data;

    }

    async readSheet(sheetId: string, range: string = "A:Z"): Promise<Schema$ValueRange> {
        return (await this.sheets.spreadsheets.values.get({spreadsheetId: sheetId, range: range})).data;
    }

    async updateValues(sheetId: string, range: string, data: any[][]): Promise<Schema$UpdateValuesResponse> {
        const response = await this.sheets.spreadsheets.values.update({
            spreadsheetId: sheetId,
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

}



