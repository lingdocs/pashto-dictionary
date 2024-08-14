export function getTextFromShareTarget(location: Location): string {
    const queryString = location.search;
    const urlParams = new URLSearchParams(queryString);
    const text = urlParams.get("text") || "";
    const match = text.match(/^"(.+)"/) || ["", text];
    return match[1];
}