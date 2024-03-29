function assert (cond, msg) {
	if (!cond) throw new Error(msg || 'Assertion failed');
}

export const defaultTypes = [{
	cls: Date,
	pack: (x) => x.toISOString(),
	unpack: (x) => new Date(x),
}, {
	cls: Error,
	pack: (x) => x.message,
	unpack: (x) => new Error(x),
}, {
	cls: Map,
	pack: (x) => [...x.entries()],
	unpack: (x) => new Map(x),
}, {
	cls: Set,
	pack: (x) => [...x.values()],
	unpack: (x) => new Set(x),
}];

function isObj (x) {
	return typeof x === 'object' && x !== null;
}

function isDict (x) {
	return isObj(x) && !Array.isArray(x);
}

export function jsonSerializer ({customTypes = [], useDefaultTypes = true, indent} = {}) {
	if (!Array.isArray(customTypes)) customTypes = [customTypes];
	const converter = customTypes.concat(useDefaultTypes ? defaultTypes : []).map((c) => {
		// c itself is the class to pack
		if (typeof c === 'function') c = {cls: c};

		assert(typeof c === 'object', 'customTypes must contain Classes or Objects');
		const cls = c.cls;
		assert(typeof cls === 'function', 'Key cls must be a Class');
		const name = c.name || c.cls.name;
		assert(typeof name === 'string' && name.length > 0, 'Key name must be a string with non-zero length');
		const pack = c.pack || c.cls.pack || ((x) => ({...x}));
		assert(typeof pack === 'function', 'Key pack must be a function');
		const unpack = c.unpack || c.cls.unpack || ((x) => Object.assign(new c.cls(), x));
		assert(typeof unpack === 'function', 'Key unpack must be a function');
		return {cls, name, pack, unpack};
	});

	function tryPack (value) {
		const conv = converter.find((c) => value instanceof c.cls);
		if (!conv) return [value, false];
		return [{
			type: conv.name,
			data: conv.pack(value)
		}, true];
	}

	function stringify (obj, overrideIndent) {
		return JSON.stringify(obj, (key, value) => {
			if (isObj(value)) {
				/* We have to look inside the objects and arrays before JSON.stringify
				 * calls the Classes toJSON() method instead of the given one ... */
				if (Array.isArray(value)) {
					return value.map((value) => {
						const [packed] = tryPack(value);
						return packed;
					});
				}

				const [packed, matched] = tryPack(value);
				if (matched) {
					return packed;
				}

				return Object.fromEntries(Object.entries(value).map(([key, value]) => {
					const [packed] = tryPack(value);
					return [key, packed];
				}));
			} else {
				return value;
			}
		}, (overrideIndent !== undefined) ? overrideIndent : indent);
	}

	function parse (json) {
		return JSON.parse(json, (key, value) => {
			if (!isDict(value)) return value;
			const {type} = value;
			if (!type) return value;
			const conv = converter.find((c) => type === c.name);
			if (!conv) return value;
			return conv.unpack(value.data);
		});
	}

	return {stringify, parse};
}
