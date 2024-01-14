# 📦 Packaging Tape

This module tries to help you with packaging JavaScript objects into JSON representation without losing the class an object may be bound to.

## Example

```js
import {jsonSerializer} from 'packaging-tape';

class User {
    constructor(name) {
        this.name = name;
    }
    sayHi () {
        console.log(`Hi ${this.name}!`)
    }
}

const myJSON = jsonSerializer({
    customTypes: [User]
});

const user = new User('alice');

const coreSerializer = JSON.parse(JSON.stringify(user));
console.log(coreSerializer);          // Outputs: { name: 'alice' }
coreSerializer.sayHi();               // Throws: Uncaught TypeError: coreSerializer.sayHi is not a function

const packagingTapeSerializer = myJSON.parse(myJSON.stringify(user));
console.log(packagingTapeSerializer); // Outputs: User { name: 'alice' }
packagingTapeSerializer.sayHi();      // Outputs: Hi alice!
```

## API

The API should be a drop-in replacement of the core implementation `JSON.stringify()` / `JSON.parse()`.

```js
import {jsonSerializer} from 'packaging-tape';

const {parse, stringify} = jsonSerializer(opts);
```

`opts` is an Object with the following keys: 
- `customTypes`: A `CustomType` oder an array of `CustomType`. Defaults to `[]`.
- `useDefaultTypes`: Boolean. If set to `true` the core types `Date`, `Error`, `Map` and `Set` will be serialized. Defaults to `true`.
- `indent`: String or `null`. Controls indentation for `stringify()`. Defaults to `null`, i.e. no indentation.


`CustomType` is a Class (which will be used as `cls` as described down below) or an Object with the following keys:
- `cls`: The Class to be serialized.
- `name`: A string. Name for the internal representation. Defaults to `cls.name`.
- `pack`: A method for packing `cls`: `(unpacked) => packed` with `unpacked` being the instance to be packed and `packed` to for the representation. Make sure `packed` uses only core types like `string`, `number`, `boolean`, `array`, `object`. Defaults to: `cls.pack()` and if not available `(x) => ({...x})`.
- `unpack`: A method for unpacking `cls`: `(packed) => unpacked` with `unpacked` being the instance to be packed and `packed` to for the representation. Make sure `unpack(pack(myInstance))` yields the same info a `myInstance`. Defaults to `cls.unpack()` and if not available `(x) => Object.assign(new c.cls(), x)`.

