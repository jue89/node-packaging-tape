export const bufferConverter = {
	cls: Uint8Array,
	name: 'Buffer',
	pack: (x) => Array.from(x),
	unpack: (x) => new Uint8Array(x),
};
