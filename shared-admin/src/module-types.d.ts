declare module 'json-csv' {
    const jsoncsv = {
        buffered(data: any, options: { fields: { name: string, label: string, quoted?: boolean }[] }): Promise<string> {
            //no op
        }
    };
    export default jsoncsv;
}