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
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2F200602.png?alt=media&token=54c1ba6c-8445-4a5e-a387-21c08c719fb9"
    },
    {
        backgroundColor: "#47445E",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2F2006013.png?alt=media&token=f3e08a6f-9c0f-4558-8975-692f6f256a04"
    },
    {
        backgroundColor: "#6590ED",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2F200531.png?alt=media&token=46d0e04e-818d-4d04-849a-a670f8764e52"
    },
    {
        backgroundColor: "#294FA3",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2F200526.png?alt=media&token=75a7de2c-a1a3-4b9a-8ff7-2c0639793354"
    },
    {
        backgroundColor: "#294FA3",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2F200524.4obqQP2rUQFS0IB0QrEC.png?alt=media&token=4d1a0983-91a8-47d6-b4d7-f0ca4084ff6f"
    },
    {
        backgroundColor: "#294FA3",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2F200523.png?alt=media&token=a1ce93a0-699c-4d62-b8ed-65981e9f9484"
    },
    {
        backgroundColor: "#47445E",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2F200522.png?alt=media&token=c208bc62-c146-4a33-a70e-5006ba453a4d"
    },
    {
        backgroundColor: "#0DADB1",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2F200514.png?alt=media&token=6c91d271-93e7-438e-8bd9-20ec8d8fa37b"
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
