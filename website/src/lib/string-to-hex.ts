/**
 * converts a string to a hexidecimal string
 * 
 * @param str 
 * @returns 
 */
export default function stringToHex(str: string): string {
	const arr1 = [];
	for (let n = 0, l = str.length; n < l; n ++) {
		const hex = Number(str.charCodeAt(n)).toString(16);
		arr1.push(hex);
	}
	return arr1.join('');
}