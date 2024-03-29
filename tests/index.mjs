import assert from 'node:assert/strict';
import {describe, test} from 'node:test';
import {Buffer} from 'node:buffer';
import {jsonSerializer} from '../index.mjs';

describe('jsonSerializer()', () => {
	test('serialize common JS types', () => {
		const {stringify, parse} = jsonSerializer();
		const src = {
			a: 'hallo',
			b: {d: 1234},
			c: [null, true],
		};
		const json = stringify(src);
		assert(typeof json === 'string');
		const dst = parse(json);
		assert.deepEqual(src, dst);

	});

	test('serialize defaultTypes', () => {
		const {stringify, parse} = jsonSerializer();
		const src = {
			myDate: new Date(),
			myErr: new Error('foo'),
			myMap: new Map([[1, 'a'], [2, 'b']]),
			mySet: new Set([1, 2, 3]),
		};
		const dst = parse(stringify(src));
		assert(dst.myDate instanceof Date);
		assert.equal(dst.myDate.getDate(), src.myDate.getDate());
		assert(dst.myErr instanceof Error);
		assert.equal(dst.myErr.message, src.myErr.message);
		assert(dst.myMap instanceof Map);
		assert.deepEqual([...dst.myMap.entries()], [...src.myMap.entries()]);
		assert(dst.mySet instanceof Set);
		assert.deepEqual([...dst.mySet.values()], [...src.mySet.values()]);
	});

	test('opt-out defaultTypes', () => {
		const {stringify, parse} = jsonSerializer({useDefaultTypes: false});
		const src = new Error('foo');
		const dst = parse(stringify(src));
		assert(!(dst instanceof Error));
	});

	test('serialize custom type', () => {
		class MyType {
			constructor (foo) { this.foo = foo; }
		}

		const {stringify, parse} = jsonSerializer({customTypes: MyType});
		const src = new MyType('foo');
		const dst = parse(stringify(src));
		assert(dst instanceof MyType);
		assert.deepEqual(src, dst);
	});

	test('make sure to serialize nested objects', () => {
		class MyType {
			constructor (foo) { this.foo = foo; }
		}
		const src = {
			myType: new MyType('bar'),
			foo: [new MyType('bar')]
		};
		const {stringify, parse} = jsonSerializer({customTypes: [MyType]});
		const dst = parse(stringify(src));
		assert(dst.myType instanceof MyType);
		assert(dst.foo[0] instanceof MyType);
		assert.deepEqual(src.myType, dst.myType);
		assert.deepEqual(src.foo[0], dst.foo[0]);
	});

	test('serialize custom type with explicit packing', () => {
		class MyType {
			static pack (x) { return x.foo; }
			static unpack (x) { return new MyType(x); }
			constructor (foo) { this.foo = foo; }
		}
		const {stringify, parse} = jsonSerializer({customTypes: [MyType]});

		const src = new MyType('bar');
		const dst = parse(stringify(src));
		assert(dst instanceof MyType);
		assert.deepEqual(src, dst);
	});

	test('override class names', () => {
		class MyType {
			constructor (foo) { this.foo = foo; }
		}
		const {stringify, parse} = jsonSerializer({customTypes: [{
			cls: MyType,
			name: 'FooBar'
		}]});

		const src = new MyType('foo');
		const ser = stringify(src);
		assert.equal(JSON.parse(ser).type, 'FooBar');
		const dst = parse(ser);
		assert(dst instanceof MyType);
		assert.deepEqual(src, dst);
	});

	test('serialize with external packers', () => {
		const {stringify, parse} = jsonSerializer({customTypes: [{
			cls: Buffer,
			pack: (x) => x.toString('hex'),
			unpack: (x) => Buffer.from(x, 'hex')
		}]});

		const src = [Buffer.from('hello')];
		const ser = stringify(src);
		const parsedSer = JSON.parse(ser);
		assert.equal(parsedSer[0].type, 'Buffer');
		assert.equal(parsedSer[0].data, '68656c6c6f');
		const dst = parse(ser);
		assert(dst[0] instanceof Buffer);
		assert.equal(dst[0].toString(), 'hello');
	});

	test('allow specifying indentation', () => {
		const {stringify} = jsonSerializer({indent: '\t'});
		const ser = stringify([1]);
		assert.equal(ser, '[\n\t1\n]');
		const serOverride = stringify([1], null);
		assert.equal(serOverride, '[1]');
	});
});
