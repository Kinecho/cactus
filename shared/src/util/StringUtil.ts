import * as queryString from "query-string";
import * as camelcase from "camelcase";
import ReflectionResponse from "@shared/models/ReflectionResponse";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import PromptContent from "@shared/models/PromptContent";

export function removeSpecialCharacters(input: string, replacement: string): string {
    return input.trim().toLowerCase()
        .replace(/[^a-z0-9-_\s\\\/]/g, "") //remove special characters
        .replace(/[-_\\\/]/g, " ") //replace underscores or hyphens with space
        .replace(/(\s+)/g, replacement); //replace all spaces with hyphen
}


export function getFilenameFromInput(input: string, extension: string | undefined = undefined): string {
    const name = removeSpecialCharacters(input, "_");
    if (extension) {
        return `${name}.${extension}`;
    } else {
        return name;
    }
}

export function stripQueryParams(url: string): { url: string, query?: any } {
    const query = queryString.parseUrl(url);

    return {url: query.url, query: query.query};

}

export function appendQueryParams(url: string, params: any): string {
    if (!params || Object.keys(params).length === 0) {
        return url;
    }

    const parsed = queryString.parseUrl(url);
    const combined = {...params, ...parsed.query};
    return `${parsed.url}?${queryString.stringify(combined)}`;

}

export function appendDomain(input: string | null | undefined, domain: string | undefined = undefined): string {
    let toProcess = input;

    if (!toProcess) {
        return "";
    }

    if (toProcess && toProcess.indexOf("/") === 0) {
        toProcess = toProcess.slice(1);
    }

    let name = toProcess;
    if (!name.startsWith("/")) {
        name = `/${name}`;
    }

    if (domain && !name.startsWith("http") && !domain.includes("localhost")) {
        return `https://${domain}${name}`;
    } else if (domain && !name.startsWith("http")) {
        return `http://${domain}${name}`;
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
        name = `/${name}`;
    }

    if (domain && !name.startsWith("http") && !domain.includes("localhost")) {
        return `https://${domain}${name}`;
    } else if (domain && !name.startsWith("http")) {
        return `http://${domain}${name}`;
    }

    return name;
}

export function isValidEmail(input: string) {
    return /^\w+([\.+-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(input);
}

export function destructureDisplayName(displayName?: string | null): { firstName?: string, middleName?: string, lastName?: string } {
    if (!displayName) {
        return {};
    }

    const parts = displayName.trim().replace(/\s\s+/g, " ").split(" ");
    if (parts.length < 3) {
        const [firstName, lastName] = parts;
        return {firstName, lastName};
    }

    if (parts.length === 3) {
        const [firstName, middleName, lastName] = parts;
        return {firstName, middleName, lastName};
    } else if (parts.length > 3) {
        const [firstName] = parts;
        const lastName = parts[parts.length - 1];
        return {firstName, lastName};
    }


    return {}

}

export function getInitials(input?: string): string {
    if (!input) {
        return "";
    }
    const {firstName, lastName} = destructureDisplayName(input);
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


export function getResponseText(responses?: ReflectionResponse[]): string | undefined {
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
    const {prompt, promptContent, response} = args;
    const question = promptContent?.getQuestion() || prompt?.question || response?.promptQuestion || undefined;
    if (question && !isBlank(question)) {
        return question.trim();
    }
    return;
}

export function isBlank(input: string | null | undefined): boolean {
    if (!input || !input.trim()) {
        return true;
    }

    return false;

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
