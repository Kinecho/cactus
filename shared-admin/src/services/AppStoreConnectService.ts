import { CactusConfig } from "@shared/CactusConfig";
import * as jwt from "jsonwebtoken";
import Logger from "@shared/Logger";
import axios, { AxiosInstance } from "axios";
import { isAxiosError } from "@shared/api/ApiTypes";
// import * as admZip from "adm-zip";
import { writeToFile } from "@admin/util/FileUtil";
import * as yauzl from "yauzl"

const path = require("path");

export default class AppStoreConnectService {
    protected static shared?: AppStoreConnectService;

    static initialize(config: CactusConfig) {
        AppStoreConnectService.shared = new AppStoreConnectService(config);
    }

    static getSharedInstance(): AppStoreConnectService {
        if (!AppStoreConnectService.shared) {
            throw new Error(
            "You must initialize AppStoreConnectService before calling getSharedInstance"
            );
        }
        return AppStoreConnectService.shared;
    }

    logger = new Logger("AppStoreConnectService");
    config: CactusConfig;
    audAudience = "appstoreconnect-v1";
    apiBaseUrl = "https://api.appstoreconnect.apple.com/v1";
    outputDirectory: string;

    constructor(config: CactusConfig) {
        this.config = config;
        if (this.config.isEmulator) {
            this.outputDirectory = path.join(process.cwd(), "output")
        } else {
            this.outputDirectory = "/tmp"
        }
        // this.outputDirectory = "/tmp"
    }

    getHeaders(): { [key: string]: string } {
        const token = this.getJWT();
        return { Authorization: `Bearer ${ token }` };
    }

    getJWT(): string {
        // jwt.sync
        // jwt.crea
        const exp = Date.now() / 1000 + 60 * 10; //10 minute exp, max allowed is 20mins
        const signed = jwt.sign(
        {
            iss: this.config.ios.appstore_connect.issuer_id,
            exp: exp,
            aud: this.audAudience
        },
        this.config.ios.appstore_connect.private_key,
        { algorithm: "ES256", keyid: this.config.ios.appstore_connect.api_key_id }
        );
        this.logger.info("Signed JWT: ", signed);
        return signed;
    }

    request(): AxiosInstance {
        const request = axios.create({ headers: { ...this.getHeaders() } });
        request.defaults.baseURL = this.apiBaseUrl;
        this.logger.info("Creating new request object...");
        return request;
    }

    async getSalesReports() {
        const request = this.request();
        try {
            const response = await request.get("/salesReports", {
                params: {
                    "filter[frequency]": "DAILY",
                    "filter[reportDate]": "2020-04-13",
                    "filter[reportSubType]": "SUMMARY",
                    "filter[reportType]": "SUBSCRIPTION",
                    "filter[vendorNumber]": this.config.ios.appstore_connect.vendor_number,
                    "filter[version]": "1_2"
                }, responseType: "arraybuffer"
            });

            this.logger.info("Got sales reports zip file");
            const zipPath = path.join(this.outputDirectory, "appstore-reports", "download.zip");
            this.logger.info("saving zip file to ", zipPath);

            // const data = response.data;
            // fs.writeFileSync(zipPath, data);
            // const saveResult = await writeToFile(zipPath, data);
            // if (!saveResult) {
            //     return;
            // }

            await new Promise(resolve => {
                setTimeout(() => {
                    resolve();
                }, 1500);
            });
            // writeToFile
            this.logger.info("saved file successfully.");
            // const outputPath = path.join(this.outputDirectory, "appstore-reports/extract");
            // const zip = new admZip(zipPath);
            // this.logger.info(`Starting the file unzip. saving to ${ outputPath }`);
            // zip.extractAllTo(outputPath, true);


            await new Promise(async (resolve, reject) => {
                try {

                    yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        if (!zipfile) {
                            reject("no zip file found");
                            return;
                        }
                        console.log("number of entries:", zipfile.entryCount);
                        // const openReadStream = promisify(zipfile.openReadStream.bind(zipfile));
                        zipfile.readEntry();
                        zipfile.on("entry", async (entry) => {
                            if (/\/$/.test(entry.fileName)) {
                                // Directory file names end with '/'.
                                // Note that entires for directories themselves are optional.
                                // An entry's fileName implicitly requires its parent directories to exist.
                                zipfile.readEntry();
                            } else {
                                // file entry
                                zipfile.openReadStream(entry, function (streamErr, readStream) {
                                    if (streamErr) throw err;
                                    if (!readStream) {
                                        reject("No read stream for entry");
                                        return;
                                    }
                                    readStream.on("end", function () {
                                        zipfile.readEntry();
                                    });
                                    readStream.pipe(process.stdout);
                                });
                            }
                            // zipfile.openReadStream(entry, (streamError, stream) => {
                            //     if (streamError) {
                            //         reject(streamError);
                            //         return;
                            //     }
                            //     if (!stream) {
                            //         reject("No stream found");
                            //         return;
                            //     }
                            //     zipfile.readEntry();
                            //
                            //     let csvString = "";
                            //     console.log("found entry:", entry.fileName);
                            //     // const stream = await openReadStream(entry);
                            //     stream.on("data", (part: any) => {
                            //         csvString += part.toString();
                            //         console.log("got stream data", part.toString());
                            //     });
                            //     stream.on("end", () => {
                            //         console.log("<EOF>");
                            //         zipfile.readEntry();
                            //         resolve(csvString);
                            //     });
                            //     stream.pipe(process.stdout);
                            // });
                        });

                        zipfile.on("end", () => {
                            console.log("end of entries");
                            resolve();
                        });
                    });
                } catch (yauzlError) {
                    this.logger.error(yauzlError);
                    reject(yauzlError)
                }

            });


            this.logger.info(`Extracted to ${ this.outputDirectory }`)
        } catch (error) {
            if (isAxiosError(error)) {
                this.logger.error(`Failed to get sales reports ${ error.response?.status ?? "unknown status" }`, error.response?.data)
            } else {
                this.logger.error("Failed to get sales reports", error)
            }

        }

    }

}
