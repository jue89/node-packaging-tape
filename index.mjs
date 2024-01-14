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

export function jsonSerializer ({customTypes = [], useDefaultTypes = true} = {}) {
	if (!Array.isArray(customTypes)) customTypes = [customTypes];
	const converter = customTypes.concat(useDefaultTypes ? defaultTypes : []).map((c) => {
		// c itself is the class to pack
		if (typeof c === 'function') {
			c = {cls: c};
		}
		assert(typeof c === 'object');
		return {
			cls: c.cls,
			name: c.name || c.cls.name,
			pack: c.pack || c.cls.pack || ((x) => ({...x})),
			unpack: c.unpack || c.cls.unpack || ((x) => Object.assign(new c.cls(), x)),
		};
	});

	function tryPack (value) {
		const conv = converter.find((c) => value instanceof c.cls);
		if (!conv) return [value, false];
		return [{
			type: conv.name,
			value: conv.pack(value)
		}, true];
	}

	function stringify (obj, indent) {
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
		}, indent);
	}

	function parse (json) {
		return JSON.parse(json, (key, value) => {
			if (!isDict(value)) return value;
			const {type} = value;
			if (!type) return value;
			const conv = converter.find((c) => type === c.name);
			if (!conv) return value;
			return conv.unpack(value.value);
		});
	}

	return {stringify, parse};
}
