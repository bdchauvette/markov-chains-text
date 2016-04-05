'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _sbd = require('sbd');

var _sbd2 = _interopRequireDefault(_sbd);

var _markovChains = require('markov-chains');

var _markovChains2 = _interopRequireDefault(_markovChains);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * The defaut max ratio for how much generated sentences are allowed to overlap
 * with existing sentences
 * @constant
 * @default
 * @type {number}
 */
var DEFAULT_MAX_OVERLAP_RATIO = 0.7;

/**
 * The defaut max total number of ngrams a generated sentence can overlap with
 * existing ones
 * @constant
 * @default
 * @type {number}
 */
var DEFAULT_MAX_OVERLAP_TOTAL = 15;

/**
 * The defaut number of times to try generating a novel sentence before failure
 * @constant
 * @default
 * @type {number}
 */
var DEFAULT_TRIES = 10;

/**
 * The default state (or n-gram) size
 * @constant
 * @default
 * @type {number}
 */
var DEFAULT_STATE_SIZE = 2;

// ============================================================================

var Text = function () {
  /**
   * If no `text` is provided, overlap checking will not work.
   *
   * @param {string} [text] the text to use as a basis for the model
   * @param {Object} [config] a configuration object
   * @param {Map}    [config.chain] a pre-configured Markov chain to use
   * @param {number} [config.stateSize=DEFAULT_STATE_SIZE] the state size to use for the model
   */

  function Text(text) {
    var _ref = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var chain = _ref.chain;
    var _ref$stateSize = _ref.stateSize;
    var stateSize = _ref$stateSize === undefined ? DEFAULT_STATE_SIZE : _ref$stateSize;

    _classCallCheck(this, Text);

    var runs = this.generateCorpus(text);

    // Rejoined text lets us assess the novelty of generated sentences
    this.rejoinedText = this.joinSentences(runs.map(this.joinWords));

    this.chain = chain || new _markovChains2.default(runs, { stateSize: stateSize });
  }

  /**
   * Create a Text class by hydrating a chain that's been serialized to JSON
   *
   * @param {string} jsonData the serialized chain
   * @param {string} [text] the original text
   *
   * @return {Text} a hydrated Text instance
   */


  _createClass(Text, [{
    key: 'toJSON',


    /**
     * Rather than stringify the whole model, we only stringify the chain. Rather
     * than return an actual JSON string, we return a multidimensional array
     * which can then be consumed by `JSON.stringify`.
     *
     * @return {Array[]}
     */
    value: function toJSON() {
      return this.chain.toJSON();
    }

    /**
     * Creates a list of 'sentences', each made up of a list of 'words'. The
     * sentences are first filtered through `testSentenceInput`.
     *
     * @param {string} text the text to build the corpus from
     * @return {string[][]} the processed text
     */

  }, {
    key: 'generateCorpus',
    value: function generateCorpus(text) {
      var sentences = this.splitSentences(text);
      var runs = sentences.filter(this.testSentenceInput).map(this.splitWords);

      return runs;
    }

    /**
     * Splits a sentence into a list of words
     *
     * @param {string} sentence the original sentence
     * @return {string[]} the sentence split into words
     */

  }, {
    key: 'splitWords',
    value: function splitWords(sentence) {
      var wordSplitPattern = /\s+/;
      return sentence.split(wordSplitPattern);
    }

    /**
     * Splits text into an array of sentences
     *
     * @param {string} text the original text
     * @return {string[]} the text split into sentences
     */

  }, {
    key: 'splitSentences',
    value: function splitSentences(text) {
      return _sbd2.default.sentences(text, { sanitize: false });
    }

    /**
     * Re-joins a list of words into a sentence.
     *
     * @param {string[]} words the split sentence to rejoin
     * @return {string} the combined words
     */

  }, {
    key: 'joinWords',
    value: function joinWords(words) {
      return words.join(' ');
    }

    /**
     * Re-joins a list of sentences into a full text.
     *
     * @param {string[]} sentences
     * @return {string} the combined sentences
     */

  }, {
    key: 'joinSentences',
    value: function joinSentences(sentences) {
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

  }, {
    key: 'testSentenceInput',
    value: function testSentenceInput(sentence) {
      var rejectPattern = /(^')|('$)|\s'|'\s|[\"(\(\)\[\])]/;
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

  }, {
    key: 'testSentenceOutput',
    value: function testSentenceOutput(words) {
      var _this = this;

      var maxOverlapRatio = arguments.length <= 1 || arguments[1] === undefined ? DEFAULT_MAX_OVERLAP_RATIO : arguments[1];
      var maxOverlapTotal = arguments.length <= 2 || arguments[2] === undefined ? DEFAULT_MAX_OVERLAP_TOTAL : arguments[2];

      var overlapRatio = Math.round(maxOverlapRatio * words.length);
      var overlapMax = Math.min(overlapRatio, maxOverlapTotal);
      var overlapOver = overlapMax + 1;

      var gramCount = Math.max(words.length - overlapMax, 1);
      var grams = new Array(gramCount);

      for (var i = 0; i < gramCount; i++) {
        grams[i] = words.slice(i, i + overlapOver);
      }

      return grams.every(function (gram) {
        var joinedGram = _this.joinWords(gram);
        return !_this.rejoinedText.includes(joinedGram);
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

  }, {
    key: 'makeSentence',
    value: function makeSentence(startFrom) {
      var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var initState = void 0;

      // handle overloading
      if (Array.isArray(startFrom)) {
        initState = startFrom;
      } else if (typeof startFrom === 'string') {
        initState = this.splitWords(startFrom);
      } else if (isPlainObject(startFrom)) {
        Object.assign(opts, startFrom);
      }

      var _opts$tries = opts.tries;
      var tries = _opts$tries === undefined ? DEFAULT_TRIES : _opts$tries;
      var maxOverlapRatio = opts.maxOverlapRatio;
      var maxOverlapTotal = opts.maxOverlapTotal;
      var maxChars = opts.maxChars;


      for (var i = 0; i < tries; i++) {
        var words = this.chain.walk(initState);

        if (this.testSentenceOutput(words, maxOverlapRatio, maxOverlapTotal)) {
          var sentence = initState ? this.joinWords([].concat(_toConsumableArray(initState), _toConsumableArray(words))) : this.joinWords(words);

          if (maxChars && sentence.length > maxChars) {
            continue;
          }

          return sentence;
        }
      }

      return new Error('Unable to create sufficiently original sentence after ' + tries + ' tries');
    }
  }], [{
    key: 'fromJSON',
    value: function fromJSON(jsonData, text) {
      var chain = _markovChains2.default.fromJSON(jsonData);
      return new Text(text, { chain: chain });
    }
  }]);

  return Text;
}();

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


exports.default = Text;
function isPlainObject(value) {
  // Because `typeof null === 'object'` returns `true`, we cast `value` to a
  // boolean using `!!` to ensure that we don't get a false positive if `value`
  // is `null`.
  return !!value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && !Array.isArray(value);
}
