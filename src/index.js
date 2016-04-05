import tokenizer from 'sbd';
import Chain from 'markov-chains';

/**
 * The defaut max ratio for how much generated sentences are allowed to overlap
 * with existing sentences
 * @constant
 * @default
 * @type {number}
 */
const DEFAULT_MAX_OVERLAP_RATIO = 0.7;

/**
 * The defaut max total number of ngrams a generated sentence can overlap with
 * existing ones
 * @constant
 * @default
 * @type {number}
 */
const DEFAULT_MAX_OVERLAP_TOTAL = 15;

/**
 * The defaut number of times to try generating a novel sentence before failure
 * @constant
 * @default
 * @type {number}
 */
const DEFAULT_TRIES = 10;

/**
 * The default state (or n-gram) size
 * @constant
 * @default
 * @type {number}
 */
const DEFAULT_STATE_SIZE = 2;

// ============================================================================

export default class Text {
  /**
   * If no `text` is provided, overlap checking will not work.
   *
   * @param {string} [text] the text to use as a basis for the model
   * @param {Object} [config] a configuration object
   * @param {Map}    [config.chain] a pre-configured Markov chain to use
   * @param {number} [config.stateSize=DEFAULT_STATE_SIZE] the state size to use for the model
   */
  constructor(text, { chain, stateSize = DEFAULT_STATE_SIZE } = {}) {
    const runs = this.generateCorpus(text);

    // Rejoined text lets us assess the novelty of generated sentences
    this.rejoinedText = this.joinSentences(runs.map(this.joinWords));

    this.chain = chain || new Chain(runs, { stateSize });
  }

  /**
   * Create a Text class by hydrating a chain that's been serialized to JSON
   *
   * @param {string} jsonData the serialized chain
   * @param {string} [text] the original text
   *
   * @return {Text} a hydrated Text instance
   */
  static fromJSON(jsonData, text) {
    const chain = Chain.fromJSON(jsonData);
    return new Text(text, { chain });
  }

  /**
   * Rather than stringify the whole model, we only stringify the chain. Rather
   * than return an actual JSON string, we return a multidimensional array
   * which can then be consumed by `JSON.stringify`.
   *
   * @return {Array[]}
   */
  toJSON() {
    return this.chain.toJSON();
  }

  /**
   * Creates a list of 'sentences', each made up of a list of 'words'. The
   * sentences are first filtered through `testSentenceInput`.
   *
   * @param {string} text the text to build the corpus from
   * @return {string[][]} the processed text
   */
  generateCorpus(text) {
    const sentences = this.splitSentences(text);
    const runs = sentences
      .filter(this.testSentenceInput)
      .map(this.splitWords);

    return runs;
  }

  /**
   * Splits a sentence into a list of words
   *
   * @param {string} sentence the original sentence
   * @return {string[]} the sentence split into words
   */
  splitWords(sentence) {
    const wordSplitPattern = /\s+/;
    return sentence.split(wordSplitPattern);
  }

  /**
   * Splits text into an array of sentences
   *
   * @param {string} text the original text
   * @return {string[]} the text split into sentences
   */
  splitSentences(text) {
    return tokenizer.sentences(text, { sanitize: false });
  }

  /**
   * Re-joins a list of words into a sentence.
   *
   * @param {string[]} words the split sentence to rejoin
   * @return {string} the combined words
   */
  joinWords(words) {
    return words.join(' ');
  }

  /**
   * Re-joins a list of sentences into a full text.
   *
   * @param {string[]} sentences
   * @return {string} the combined sentences
   */
  joinSentences(sentences) {
    return sentences.join(' ');
  }

  /**
   * A basic sentence filter for deciding whether a string should be processed
   * into the corpus.
   *
   * This one rejects sentences that contain the type of punctuation that would
   * look strange on its own in a randomly-generated sentence.
   *
   * @param {string} sentence the sentence to check
   * @return {boolean} whether the sentence passes the filter
   */
  testSentenceInput(sentence) {
    const rejectPattern = /(^')|('$)|\s'|'\s|[\"(\(\)\[\])]/;
    return !rejectPattern.test(sentence);
  }

  /**
   * Tests generated sentences to make sure they don't overlap too much with
   * existing sentences.
   *
   * @param {string[]} words the sentence split into words
   * @param {number} maxOverlapRatio The max ratio for how much generated sentences are allowed to overlap with existing sentences
   * @param {number} maxOverlapTotal The max total number of ngrams a generated sentence can overlap with existing ones
   * @return {boolean} whether the sentence passes the filter
   */
  testSentenceOutput(
    words,
    maxOverlapRatio = DEFAULT_MAX_OVERLAP_RATIO,
    maxOverlapTotal = DEFAULT_MAX_OVERLAP_TOTAL
  ) {
    const overlapRatio = Math.round(maxOverlapRatio * words.length);
    const overlapMax = Math.min(overlapRatio, maxOverlapTotal);
    const overlapOver = overlapMax + 1;

    const gramCount = Math.max((words.length - overlapMax), 1);
    const grams = new Array(gramCount);

    for (let i = 0; i < gramCount; i++) {
      grams[i] = words.slice(i, i + overlapOver);
    }

    return grams.every((gram) => {
      const joinedGram = this.joinWords(gram);
      return !this.rejoinedText.includes(joinedGram);
    });
  }

  /**
   *  Attempts `tries` number of times to generate a valid sentence (i.e. ones
   *  that can pass `testSentenceOutput`).
   *
   *  @param {(string|string[])} [startFrom] The text to begin generating the corpus from
   *  @param {Object} [startFrom] The text to begin generating the corpus from
   *  @param {number} [startFrom.tries=DEFAULT_TRIES] How many times to attempt generating a sentence
   *  @param {number} [startFrom.maxOverlapRatio] The max ratio for how much generated sentences are allowed to overlap with existing sentences
   *  @param {number} [startFrom.maxOverlapTotal] The max total number of ngrams a generated sentence can overlap with existing ones
   *  @param {number} [startFrom.maxChars] The max length (inclusive) limit for that a sentence can be. If specified, generated sentences must be <= `maxLength`
   *  @return {(string|Error)} the generated sentence, or an error if it is unable to generate an adquate sentence
   */
  makeSentence(startFrom, opts = {}) {
    let initState;

    // handle overloading
    if (Array.isArray(startFrom)) {
      initState = startFrom;
    } else if (typeof startFrom === 'string') {
      initState = this.splitWords(startFrom);
    } else if (isPlainObject(startFrom)) {
      Object.assign(opts, startFrom);
    }

    const {
      tries = DEFAULT_TRIES,
      maxOverlapRatio,
      maxOverlapTotal,
      maxChars,
    } = opts;

    for (let i = 0; i < tries; i++) {
      const words = this.chain.walk(initState);

      if (this.testSentenceOutput(words, maxOverlapRatio, maxOverlapTotal)) {
        const sentence = (initState)
          ? this.joinWords([...initState, ...words])
          : this.joinWords(words);

        if (maxChars && sentence.length > maxChars) {
          continue;
        }

        return sentence;
      }
    }

    return new Error(`Unable to create sufficiently original sentence after ${tries} tries`);
  }
}

// ============================================================================

/**
 * @private
 * Determines whether the provided value is an object.
 *
 * This is used to determine whether something is a configuration object.  It's
 * not perfect -- `isPlainObject(/foo/)` returns `true`, for example -- but it
 * should cover our bases well enough for what we need.
 *
 * @param {} value the value to check
 * @return {boolean} whether the value is a plain-ish object
 */
function isPlainObject(value) {
  // Because `typeof null === 'object'` returns `true`, we cast `value` to a
  // boolean using `!!` to ensure that we don't get a false positive if `value`
  // is `null`.
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
