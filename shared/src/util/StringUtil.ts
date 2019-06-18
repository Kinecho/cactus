
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

export function getUrlFromInput(input: string|null): string {
    let toProcess = input;

    if (!toProcess) {
        return "";
    }

    if (toProcess && toProcess.indexOf("/") === 0) {
        toProcess = toProcess.slice(1);
    }

    const name = removeSpecialCharacters(toProcess, "-");
    if (!name.startsWith("/")) {
        return `/${name}`;
    }
    return name;
}