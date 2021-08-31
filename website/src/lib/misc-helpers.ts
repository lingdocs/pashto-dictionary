export function objIsEqual(obj1: any, obj2: any): boolean {
    if (!obj1 || !obj2) return false;
    return JSON.stringify(obj1) === JSON.stringify(obj2);
}