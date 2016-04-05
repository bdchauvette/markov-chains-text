import fs from 'fs';
import path from 'path';
import test from 'tape';
import isEqual from 'is-equal';
import Chain from 'markov-chains';

import Text from '../src';

const sherlockPath = path.resolve(__dirname, './texts/sherlock.txt');

const shortText = 'The quick brown fox jumped over the lazy dog.';
const longText = fs.readFileSync(sherlockPath, 'utf-8');

test('Text constructor', (t) => {
  t.plan(3);

  const text = new Text(shortText);

  t.ok(
    text instanceof Text,
    'Should return an instance of the Text class'
  );

  t.ok(
    text.chain instanceof Chain,
    'Returned object should have a chain property'
  );

  t.ok(
    typeof text.rejoinedText === 'string',
    'Returned object should have a rejoinedText property'
  );
});

// ============================================================================

test('Splitting words', (t) => {
  t.plan(2);

  const text = new Text(shortText);
  const words = 'foo bar baz';

  const expectedSplit = words.split(' ');
  const split = text.splitWords(words);

  t.ok(
    Array.isArray(split),
    'Should return an array of words'
  );

  t.ok(
    isEqual(split, expectedSplit),
    'Returned array should be as expected'
  );
});

// ============================================================================

test('Splitting sentences', (t) => {
  t.plan(2);

  const text = new Text(shortText);

  const corpus = `
    a man, a plan, a canal, panama. Foo bar baz.
    The quick brown fox jumps over the lazy dog!!!
    Lorem ipsum dolor sit amet?
    Grumpy Wizards make toxic brew for the 'Evil' Queen and Jack's inflamed
    sense of rejection. Meow...`;

  const expectedSplit = [
    'a man, a plan, a canal, panama.',
    'Foo bar baz.',
    'The quick brown fox jumps over the lazy dog!!!',
    'Lorem ipsum dolor sit amet?',
    "Grumpy Wizards make toxic brew for the 'Evil' Queen and Jack's inflamed sense of rejection.",
    'Meow...',
  ];

  const split = text.splitSentences(corpus);

  t.ok(
    Array.isArray(split),
    'Should return an array of words'
  );

  t.ok(
    isEqual(split, expectedSplit),
    'Returned array should be as expected'
  );
});

// ============================================================================

test('Joining words', (t) => {
  t.plan(2);

  const text = new Text(shortText);
  const words = ['foo', 'bar', 'baz'];

  const expectedJoin = words.join(' ');
  const joined = text.joinWords(words);

  t.equal(
    typeof joined,
    'string',
    'Should return a string'
  );

  t.equal(
    joined,
    expectedJoin,
    'Returned string should be as expected'
  );
});

// ============================================================================

test('Joining sentences', (t) => {
  t.plan(2);

  const text = new Text(shortText);
  const sentences = [
    'a man, a plan, a canal, panama.',
    'foo bar baz',
  ];

  const expectedJoin = sentences.join(' ');

  const joined = text.joinSentences(sentences);

  t.equal(
    typeof joined,
    'string',
    'Should return a string'
  );

  t.equal(
    joined,
    expectedJoin,
    'Returned string should be as expected'
  );
});

// ============================================================================

test('Generating corpora', (t) => {
  t.plan(2);

  const text = new Text(shortText);
  const corpus = text.generateCorpus(shortText);

  t.ok(
    Array.isArray(corpus),
    'Corpus should be an array'
  );

  t.ok(
    corpus.every(Array.isArray),
    'Corpus should be an array of arrays'
  );
});

// ============================================================================

test('Creating sentences', (t) => {
  t.plan(1);

  const model = new Text(longText);
  const sentence = model.makeSentence();

  t.ok(
    sentence,
    'Should create a sentence'
  );
});
// ============================================================================

test('Insufficient input to create sentences', (t) => {
  t.plan(1);

  const text = 'Example prhase. This is another example sentence.';
  const model = new Text(text);

  t.ok(
    model.makeSentence() instanceof Error,
    'Should return error when unable to create sentences from a short corpus'
  );
});

// ============================================================================

test('Creating short sentences', (t) => {
  t.plan(2);

  const maxChars = 45;
  const tries = 512;

  const model = new Text(longText);
  const sentence = model.makeSentence({ tries, maxChars });

  t.ok(
    sentence,
    'Should create a sentence'
  );

  t.ok(
    sentence.length <= maxChars,
    `Should create a sentence shorter than ${maxChars} chars`
  );
});

// ============================================================================

test('Creating sentences with starting text', (t) => {
  t.plan(2);

  const startingText = 'Sherlock Holmes';
  const startingTextMatch = new RegExp(`^${startingText}`);

  const model = new Text(longText);
  const sentence = model.makeSentence(startingText);

  t.ok(
    sentence,
    'Should create a sentence'
  );

  t.ok(
    startingTextMatch.test(sentence),
    'Should create a sentence that starts with the starting text'
  );
});

// ============================================================================

test('Hydrating Text model from JSON', (t) => {
  t.plan(6);

  const originalModel = new Text(shortText);
  const serializedModel = JSON.stringify(originalModel);

  const newModel = Text.fromJSON(serializedModel);
  const newModelWithText = Text.fromJSON(serializedModel, shortText);

  t.equal(
    newModel.chain.stateSize,
    originalModel.chain.stateSize,
    'Hydrated chain should have the same state size as original chain'
  );

  t.ok(
    isEqual(newModel.chain.model, originalModel.chain.model),
    'Hydrated chain should deep equal original chain'
  );

  t.equal(
    newModelWithText.chain.stateSize,
    originalModel.chain.stateSize,
    'Hydrated chain should have the same state size as original chain, even when text is provided'
  );

  t.ok(
    isEqual(newModelWithText.chain.model, originalModel.chain.model),
    'Hydrated chain should deep equal original chain, even when text is provided'
  );

  t.equal(
    newModelWithText.rejoinedText,
    originalModel.rejoinedText,
    'Rejoined text should be equivalent when provided'
  );

  t.ok(
    newModel.makeSentence(),
    'Should create a sentence'
  );
});
