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
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2F200425.png?alt=media&token=ed9a3600-eb1a-493b-ab41-49ac3ae19233"
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
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2F2004012.png?alt=media&token=4ee40a05-18a5-455e-95e0-f6f35d8a71f3"
    },
    {
        backgroundColor: "#294FA3",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2F2005111.png?alt=media&token=a7aa0084-7f5f-4be0-88bc-f08a8c3e55af"
    },
    {
        backgroundColor: "#47445E",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2F200331.png?alt=media&token=a91bc22b-ff78-4ef7-ba73-888484c6710f"
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
