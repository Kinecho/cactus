/**
 * Split a string based on a delimiter, discarding the delimited string
 * @param {string} input
 * @param {string} delimiter
 * @param {boolean} [trimValues=true] true if the values should be trimmed before returning. Defaults to true
 * @return {[string, string]} returns a tuple of the found values in the string.
 */
export function splitOnFirst(input:string, delimiter:string, trimValues: boolean = true):[string?, string?]{

    const firstIndex = input.indexOf(delimiter);
    if (firstIndex < 0) {
        console.warn(`Unable to find a ${delimiter} in the string ${input}`);
        return [];
    }

    const key = input.substr(0, firstIndex);
    const value = input.substr(Math.min(firstIndex + 1, input.length - 1));

    return [key && trimValues ? key.trim() : key, value && trimValues ? value.trim() : value];
}