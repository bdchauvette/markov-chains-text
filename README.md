## markov-chains-text
**Fake text, powered by Markov chains**

[![npm version](https://badge.fury.io/js/markov-chains-text.svg)](https://badge.fury.io/js/markov-chains-text)

---

`markov-chains-text` is a simple, Markov chain-based text generator written in
JavaScript, and designed for both Node and the browser. It can be used to
generate random sentences modeled after a large corpus of text.

## Table of Contents

- [Features](#features)
- [Example](#example)
- [Installation & Usage](#installation--usage)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [See Also](#see-also)
- [License](#license)

---

## Example

```js
import { readFileSync } from 'fs';
import path from 'path';
import Text from 'markov-chains-text';

const MobyDick = readFileSync(path.join(__dirname, 'moby-dick.txt'));

// build the generator
const fakeMobyDick = new Text(MobyDick);

// generate a sentence
const sentence = fakeMobyDick.makeSentence();

console.log(sentence);

// Example output:
//
//   And as the Porpoise is the harpooneer might be his immediate purpose,
//   touching his own kith and kin to noble Benjamin--this day darting the
//   barbed iron from one to the captain dared not attempt, he snatched the
//   rope attached to it--for they were humbug.
//
```

[Back to Top ↑](#readme)

---

## Installation & Usage

### Requirements

`markov-chains-text` relies on [Maps][] and [Generators][], which are available
natively in Node v4.0 and above, and in modern versions of many browsers.

For a list of JavaScript environments that support these features, see the
[ECMAScript Compatability Table][].

[Maps]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
[Generators]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator
[ECMAScript Compatability Table]: http://kangax.github.io/compat-table/es6/

### Downloading

```sh
npm install --save markov-chains-text
```

### Usage (ES6+)

```js
import Text from 'markov-chains-text';
const fakeText = new Text(/* corpus: string */);
```

### Usage (CommonJS)

```js
var Text = require('markov-chains-text').default;
var fakeText = new Text(/* corpus: string */);
```

[Back to Top ↑](#readme)

---

## API Reference

```
Coming Soon
```

[Back to Top ↑](#readme)

---

## Contributing

Pull requests are always welcome!

### Building

The following `npm` scripts are available for use during development:

Command                    | Use to...
---------------------------|-----------
`npm run clean`            | Remove the `dist/` files
`npm run lint`             | Lint the files in `src/`
`npm run build`            | Transpile the code with `babel`

### Tests

`markov-chains-text` uses [`tape`](https://github.com/substack/tape) for
testing.

To run the tests, just run `npm test` at the command line.

[Back to Top ↑](#readme)

---

## See Also

- [`markovify`](https://github.com/jsvine/markovify) - The excellent python
  library that inspired `markov-chains`
- [`markovchain-generate`](https://github.com/zabracks/markovchain-generator)
- [`markovchain`](https://www.npmjs.com/package/markovchain)
- [`general-markov`](https://github.com/swang/markovchain)
- [`markov`](https://github.com/substack/node-markov)

[Back to Top ↑](#readme)

---

## License
`markov-chains-text` is licensed under the MIT License.

For details, please see the [`LICENSE`](https://raw.githubusercontent.com/bdchauvette/markov-chains/master/LICENSE) file.

[Back to Top ↑](#readme)
