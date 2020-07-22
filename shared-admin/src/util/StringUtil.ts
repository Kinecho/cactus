import {getConfig, getHostname} from "@admin/config/configService";
/**
 * Split a string based on a delimiter, discarding the delimited string
 * @param {string} input
 * @param {string} delimiter
 * @param {boolean} [trimValues=true] true if the values should be trimmed before returning. Defaults to true
 * @return {[string, string]} returns a tuple of the found values in the string.
 */
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import PromptContent from "@shared/models/PromptContent";
import {PageRoute} from "@shared/PageRoutes";
import {CactusConfig} from "@admin/CactusConfig";

export function splitOnFirst(input: string, delimiter: string, trimValues: boolean = true): [string?, string?] {

    const firstIndex = input.indexOf(delimiter);
    if (firstIndex < 0) {
        // console.warn(`Unable to find a ${delimiter} in the string ${input}`);
        return [];
    }

    const key = input.substr(0, firstIndex);
    const value = input.substr(Math.min(firstIndex + 1, input.length - 1));

    return [key && trimValues ? key.trim() : key, value && trimValues ? value.trim() : value];
}

/**
 * Construct a fully qualified URL from a prompt content objcet.
 * @param {PromptContent} prompt
 * @param {CactusConfig} config
 * @return {string | undefined}
 */
export function buildPromptContentURL(prompt?: PromptContent, config: CactusConfig = getConfig()): string | undefined {
    if (!prompt) {
        return;
    }

    return `${getHostname(config)}${PageRoute.PROMPTS_ROOT}/${prompt.entryId}`;
}

export function buildPromptURL(prompt?: ReflectionPrompt): string | undefined {
    if (!prompt) {
        return;
    }

    const config = getConfig();
    const domain = config.web.domain;
    const protocol = config.web.protocol;

    const path = prompt.contentPath && !prompt.contentPath.startsWith("/") ? `/${prompt.contentPath}` : prompt.contentPath;
    return `${protocol}://${domain}${path}`;
}

export function isGeneratedEmailAddress(emailAddress?: string, config: CactusConfig = getConfig()): boolean {
    if (emailAddress && config?.app?.fake_email_domain) {
        const domain = config.app.fake_email_domain.trim().toLowerCase();
        const email = emailAddress.trim().toLowerCase();
        return email.includes(domain);
    }

    return false;
}