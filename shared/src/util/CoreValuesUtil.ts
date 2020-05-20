import { CoreValue } from "@shared/models/CoreValueTypes";
import { getIntegerFromStringBetween } from "@shared/util/StringUtil";
import { isNull, isNumber } from "@shared/util/ObjectUtil";
import Logger from "@shared/Logger"

const logger = new Logger("CoreValuesUtil");


export interface CoreValuesBlob {
    imageUrl: string,
    backgroundColor: string
}

export const blobs: CoreValuesBlob[] = [
    {
        backgroundColor: "#47445E",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2Fsized%2F375_9999_99%2F200411.png?alt=media&token=6f2c2d46-d282-4c1a-87de-9259136c79a0"
    },
    {
        backgroundColor: "#47445E",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2F200402.png?alt=media&token=28cea680-63f3-4ece-b983-46ee0b5cc174"
    },
    {
        backgroundColor: "#6590ED",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2F2005171.TTRQzP1gxXdEdBY7gZOU.png?alt=media&token=8e257b31-bc36-42a6-ba85-bc2e7d784fbd"
    },
    {
        backgroundColor: "#294FA3",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2F2003252.png?alt=media&token=a4a38fbd-73ac-478d-a4cf-5d6b1d890140"
    },
    {
        backgroundColor: "#294FA3",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2F2004084.png?alt=media&token=285da530-2e50-49e7-8bc7-9997e8593d8a"
    },
    {
        backgroundColor: "#294FA3",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2F2005111.png?alt=media&token=a7aa0084-7f5f-4be0-88bc-f08a8c3e55af"
    },
    {
        backgroundColor: "#47445E",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2F200416.png?alt=media&token=32a014e0-10f3-4d07-bf01-9aa813b0a5e6"
    },
    {
        backgroundColor: "#0DADB1",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2F2004291.png?alt=media&token=3f7c029d-8aec-4ad2-98b3-aa6d9d6fd9a4"
    }
]

export function getCoreValuesBlob(values?: (string | CoreValue)[], forceIndex?: number | null | undefined | string): CoreValuesBlob | undefined {
    if (!values || values.length === 0) {
        return undefined;
    }
    const valueString = values.join("") ?? "";
    let index = getIntegerFromStringBetween(valueString, blobs.length)
    if (!isNull(forceIndex) && isNumber(Number(forceIndex))) {
        index = Number(forceIndex);
    }
    logger.info("getting blob with index", index);
    return blobs[index];
}
