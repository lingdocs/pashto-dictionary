export default function generatePassword(): string {
    function makeChunk(): string {
        return Math.random().toString(36).slice(2)
    }
    const password = new Array(4).fill(0).reduce((acc: string): string => (
        acc + makeChunk()
    ), "");
    return password;
}