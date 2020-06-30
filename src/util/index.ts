export const isObj = (x: any): x is object => x && typeof x === "object";
export const isInt = (x: number | string) => /^\d+$/.test(String(x));

export const assoc = (path: string[], val: any, obj: any) => {
	let curr = obj;

	if (!path.length) {
		return obj;
	} else if (path.length === 1) {
		obj[path[0]] = val;
		return obj;
	}

	for (let i = 0; i < path.length; i++) {
		const key = path[i];

		if (i === path.length - 1) {
			curr[key] = val;
			return obj;
		} else if (!curr[key] || !isObj(curr[key])) {
			if (isInt(path[i + 1])) {
				curr = curr[key] = [];
			} else {
				curr = curr[key] = {};
			}
		} else {
			curr = curr[key];
		}
	}
};
