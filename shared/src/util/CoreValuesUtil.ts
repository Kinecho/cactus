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
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2F2004212.png?alt=media&token=b678702d-46b2-44b3-8bd9-1c62e08a27c3"
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
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2F2003253.png?alt=media&token=3b7d1d4a-487b-40d4-a8b0-a454c408555c"
    },
    {
        backgroundColor: "#47445E",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2F200331.png?alt=media&token=a91bc22b-ff78-4ef7-ba73-888484c6710f"
    },
    {
        backgroundColor: "#0DADB1",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2F200327.png?alt=media&token=ead11877-2088-492d-8b72-da5147c5b9b9"
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