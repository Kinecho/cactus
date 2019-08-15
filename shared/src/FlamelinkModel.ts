export enum SchemaName {
    promptContent = "promptContent",
}


export interface FlamelinkIdentifiable {
    schema: SchemaName,
    id?: string,
}

export default abstract class FlamelinkModel implements FlamelinkIdentifiable {
    abstract readonly schema: SchemaName;
    abstract id?: string;
}