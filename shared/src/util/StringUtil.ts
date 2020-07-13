import * as queryString from "query-string";
import camelcase from "camelcase";
import ReflectionResponse from "@shared/models/ReflectionResponse";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import PromptContent from "@shared/models/PromptContent";
import { isNull, isNumber, isString } from "@shared/util/ObjectUtil";

const MICRO_TO_CENT = 10000;

export function microDollarsStringToCents(input: string | undefined): number | undefined {
    if (isString(input)) {
        const ms = Number(input);
        if (isNumber(ms)) {
            return ms / MICRO_TO_CENT
        }
    }
    return undefined;
}

export function removeSpecialCharacters(input: string, replacement: string): string {
    return input.trim().toLowerCase()
    .replace(/[^a-z0-9-_\s\\\/]/g, "") //remove special characters
    .replace(/[-_\\\/]/g, " ") //replace underscores or hyphens with space
    .replace(/(\s+)/g, replacement); //replace all spaces with hyphen
}


export function getFilenameFromInput(input: string, extension: string | undefined = undefined): string {
    const name = removeSpecialCharacters(input, "_");
    if (extension) {
        return `${ name }.${ extension }`;
    } else {
        return name;
    }
}

export function preventOrphanedWords<T>(input?: T | string, escapeCode: string = "\xa0"): string | undefined | T {
    if (!input || typeof input !== "string") {
        return input;
    }
    const lastIndex = input.lastIndexOf(" ");
    const escapeIndex = input.lastIndexOf(escapeCode);
    if (escapeIndex > -1 && escapeIndex > lastIndex) {
        return input;
    }
    if (lastIndex > 0) {
        return input.substr(0, lastIndex) + escapeCode + input.substr(lastIndex + 1);
    }
    return input
}

export function stripQueryParams(url: string): { url: string, query?: any } {
    const query = queryString.parseUrl(url);

    return { url: query.url, query: query.query };

}

export function isFeatureAuthUrl(url?: string | null): boolean {
    if (url && /\/feature-auth/.test(url)) {
        return true;
    }

    return false;
}

export function appendQueryParams(url: string, params: any): string {
    if (!params || Object.keys(params).length === 0) {
        return url;
    }

    const parsed = queryString.parseUrl(url);
    const combined = { ...params, ...parsed.query };
    return `${ parsed.url }?${ queryString.stringify(combined) }`;

}

export function appendDomain(input: string | null | undefined, domain: string | undefined = undefined): string {
    let toProcess = input;

    if (!toProcess) {
        return "";
    }

    if (toProcess.includes("://")) {
        return toProcess;
    }

    if (toProcess && toProcess.indexOf("/") === 0) {
        toProcess = toProcess.slice(1);
    }

    let name = toProcess;
    if (!name.startsWith("/")) {
        name = `/${ name }`;
    }

    if (domain && domain.includes("://")) {
        return `${ domain }${ name }`
    }

    if (domain && !name.startsWith("http") && !domain.includes("localhost")) {
        return `https://${ domain }${ name }`;
    } else if (domain && !name.startsWith("http")) {
        return `http://${ domain }${ name }`;
    }

    return name;
}

export function getUrlFromInput(input: string | null | undefined, domain: string | undefined = undefined): string {
    let toProcess = input;

    if (!toProcess) {
        return "";
    }

    if (toProcess && toProcess.indexOf("/") === 0) {
        toProcess = toProcess.slice(1);
    }

    let name = removeSpecialCharacters(toProcess, "-");
    if (!name.startsWith("/")) {
        name = `/${ name }`;
    }

    if (domain && !name.startsWith("http") && !domain.includes("localhost")) {
        return `https://${ domain }${ name }`;
    } else if (domain && !name.startsWith("http")) {
        return `http://${ domain }${ name }`;
    }

    return name;
}

export function isValidEmail(input: string) {
    return /^\w+([\.+-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(input);
}

export function isGmail(input: string) {
    return /^[a-z0-9](\.?[a-z0-9]){5,}@g(oogle)?mail\.com$/.test(input);
}

export function isExternalUrl(input?: string) {
    if (!input || isBlank(input)) {
        return false;
    }

    return new RegExp("^(?:(?:https?|ftp):\\/\\/|\\b(?:[a-z\\d]+\\.))(?:(?:[^\\s()<>]+|\\((?:[^\\s()<>]+|(?:\\([^\\s()<>]+\\)))?\\))+(?:\\((?:[^\\s()<>]+|(?:\\(?:[^\\s()<>]+\\)))?\\)|[^\\s`!()\\[\\]{};:'\".,<>?«»“”‘’]))?").test(input);
}

export function destructureDisplayName(displayName?: string | null): { firstName?: string, middleName?: string, lastName?: string } {
    if (!displayName) {
        return {};
    }

    const parts = displayName.trim().replace(/\s\s+/g, " ").split(" ");
    if (parts.length < 3) {
        const [firstName, lastName] = parts;
        return { firstName, lastName };
    }

    if (parts.length === 3) {
        const [firstName, middleName, lastName] = parts;
        return { firstName, middleName, lastName };
    } else if (parts.length > 3) {
        const [firstName] = parts;
        const lastName = parts[parts.length - 1];
        return { firstName, lastName };
    }


    return {}

}

export function getInitials(input?: string): string {
    if (!input) {
        return "";
    }
    const { firstName, lastName } = destructureDisplayName(input);
    let initials = "";
    if (firstName) {
        initials += firstName.charAt(0);
    }
    if (lastName) {
        initials += lastName.charAt(0);
    }

    return initials;
}


export function toCamelCamse(input: string): string {
    return camelcase(input);
}


export function getResponseText(responses?: ReflectionResponse[] | null | undefined): string | undefined {
    if (!responses) {
        return;
    }

    if (responses.length === 0) {
        return;
    }
    return responses.map(r => (r.content.text || "").trim()).join("\n\n").trim();
}

export function getWordCount(text?: string): number {
    if (!text || !text.trim()) {
        return 0
    }
    const split = text.trim().split(/\s+/g);
    return split.length;
}

export function getCharacterCount(text?: string): number {
    if (!text) {
        return 0;
    }
    return text.trim().length;
}

export function getIntegerFromStringBetween(input: string, max: number): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        hash = Math.abs(input.charCodeAt(i) + ((hash << 5) - hash));
    }
    return hash % max;
}

/**
 * Get the question from a variety of optional sources and return the trimmed string or undefined
 * @param {{prompt?: ReflectionPrompt; promptContent?: PromptContent; response?: ReflectionResponse}} args
 * @return {string | undefined}
 */
export function getPromptQuestion(args: { prompt?: ReflectionPrompt, promptContent?: PromptContent, response?: ReflectionResponse }): string | undefined {
    const { prompt, promptContent, response } = args;
    const question = promptContent?.getQuestion() || prompt?.question || response?.promptQuestion || undefined;
    if (question && !isBlank(question)) {
        return question.trim();
    }
    return;
}

export function isBlank(input?: string|null|undefined): input is "" | null | undefined {
    if (!input || input.trim() === "") {
        return true;
    }

    return false;
}

export function notBlank(input?: string | null | undefined): input is string {
    return !isBlank(input);
}

export function getProviderDisplayName(provider?: string): string {
    switch (provider) {
        case "password":
            return "Email";
        case "twitter.com":
            return "Twitter";
        case "facebook.com":
            return "Facebook";
        case "google.com":
            return "Google";
        case "apple.com":
            return "Apple";
        default:
            return provider || "";
    }
}

export function titleCase(str: string | undefined): string {
    if (str && str.length > 0) {
        return str.toLowerCase().split(' ').map(function (word) {
            return word.replace(word[0], word[0].toUpperCase());
        }).join(' ');
    } else {
        return '';
    }
}

export const StringTransforms = {
    stringOrUndefined: (input: string): string | undefined => {
        return isBlank(input) ? undefined : input;
    },

    numberOrUndefined: (input: string): number | undefined => {
        return isNumber(input) ? undefined : Number(input);
    },

    booleanOrUndefined: (input: string): boolean | undefined => {
        if (isBlank(input)) {
            return undefined;
        }
        return input.toLowerCase().startsWith("t");
    },

    dateOrUndefined: (input: string): Date | undefined => {
        if (isBlank(input)) {
            return undefined;
        }
        try {
            const date = new Date(input);

            return date;

        } catch (error) {
            return undefined;
        }

    }
}

export function formatPriceCentsUsd(priceCents: number): string {
    return `$${ (priceCents / 100).toFixed(2) }`.replace(".00", "")
}

export function getRandomNumberBetween(min: number, max: number, fractionDigits = 0, inclusive = true): number {
    const precision = Math.pow(10, Math.max(fractionDigits, 0));
    const scaledMax = max * precision;
    const scaledMin = min * precision;
    const offset = inclusive ? 1 : 0;
    const num = Math.floor(Math.random() * (scaledMax - scaledMin + offset)) + scaledMin;

    return num / precision;
}

/**
 * Expects input to be a number where 0.1 = 10%
 * @param {number | string | null | undefined} input
 * @return {string | null}
 */
export function formatPercentage(input: number | string | null | undefined, decimalPlaces: number = 0): string | null {
    if (isNull(input)) {
        return null;
    }

    const num = Number(input);
    if (!isNumber(num)) {
        return null;
    }

    return `${ (num * 100).toFixed(decimalPlaces) }%`;
}

const HTMLEntityMap = [
    ['amp', '&'],
    ['apos', '\''],
    ['#x27', '\''],
    ['#x2F', '/'],
    ['#39', '\''],
    ['#47', '/'],
    ['lt', '<'],
    ['gt', '>'],
    ['nbsp', ' '],
    ['quot', '"']
];

export function decodeHTMLEntities(text?: string): string | undefined {
    if (!text) {
        return undefined;
    }
    let output = text;

    for (let i = 0, max = HTMLEntityMap.length; i < max; ++i) {
        output = output.replace(new RegExp('&' + HTMLEntityMap[i][0] + ';', 'g'), HTMLEntityMap[i][1]);
    }

    return output;
}
