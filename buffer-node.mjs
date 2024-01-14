import {Buffer} from 'node:buffer';

export const bufferConverter = {
	cls: Buffer,
	name: 'Buffer',
	pack: (x) => Array.from(x),
	unpack: (x) => Buffer.from(x),
};
