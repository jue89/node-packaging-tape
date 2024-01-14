import assert from 'node:assert/strict';
import {describe, test} from 'node:test';
import {Buffer} from 'node:buffer';
import {jsonSerializer} from '../index.mjs';
import {bufferConverter as nodeBufferConverter} from '../buffer-node.mjs';
import {bufferConverter as browserBufferConverter} from '../buffer.mjs';

describe('bufferConverter', () => {
	const node = jsonSerializer({customTypes: nodeBufferConverter});
	const browser = jsonSerializer({customTypes: browserBufferConverter});

	test('node -> browser', () => {
		const buf = Buffer.from([42]);
		const ser = node.stringify(buf);
		const uint8array = browser.parse(ser);
		assert(uint8array instanceof Uint8Array);
		assert.equal(uint8array[0], 42);
	});

	test('browser -> node', () => {
		const uint8array = new Uint8Array([42]);
		const ser = browser.stringify(uint8array);
		const buf = node.parse(ser);
		assert(buf instanceof Buffer);
		assert.equal(buf[0], 42);
	});
});
