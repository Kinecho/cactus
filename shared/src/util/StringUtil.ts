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
    } else if (domain && !name.startsWith("http")){
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

export function getInitials(input: string): string {
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
