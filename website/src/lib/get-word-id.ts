function getWordId(search: string): number | null {
    const params = new URLSearchParams(search);
    const id = params.get("id");
    if (id) {
        return parseInt(id);
    }
    return null;
}

export default getWordId;