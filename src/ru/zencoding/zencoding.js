//     Underscore.js 1.3.0
//     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore is freely distributable under the MIT license.
//     Portions of Underscore are inspired or borrowed from Prototype,
//     Oliver Steele's Functional, and John Resig's Micro-Templating.
//     For all details and documentation:
//     http://documentcloud.github.com/underscore

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var slice            = ArrayProto.slice,
      unshift          = ArrayProto.unshift,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) { return new wrapper(obj); };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root['_'] = _;
  }

  // Current version.
  _.VERSION = '1.3.0';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    if (obj.length === +obj.length) results.length = obj.length;
    return results;
  };

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError('Reduce of empty array with no initial value');
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var reversed = _.toArray(obj).reverse();
    if (context && !initial) iterator = _.bind(iterator, context);
    return initial ? _.reduce(reversed, iterator, memo, context) : _.reduce(reversed, iterator);
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    each(obj, function(value, index, list) {
      if (!iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if a given value is included in the array or object using `===`.
  // Aliased as `contains`.
  _.include = _.contains = function(obj, target) {
    var found = false;
    if (obj == null) return found;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    found = any(obj, function(value) {
      return value === target;
    });
    return found;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    return _.map(obj, function(value) {
      return (_.isFunction(method) ? method || value : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Return the maximum element or (element-based computation).
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj)) return Math.max.apply(Math, obj);
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj)) return Math.min.apply(Math, obj);
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var shuffled = [], rand;
    each(obj, function(value, index, list) {
      if (index == 0) {
        shuffled[0] = value;
      } else {
        rand = Math.floor(Math.random() * (index + 1));
        shuffled[index] = shuffled[rand];
        shuffled[rand] = value;
      }
    });
    return shuffled;
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    }), 'value');
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, val) {
    var result = {};
    var iterator = _.isFunction(val) ? val : function(obj) { return obj[val]; };
    each(obj, function(value, index) {
      var key = iterator(value, index);
      (result[key] || (result[key] = [])).push(value);
    });
    return result;
  };

  // Use a comparator function to figure out at what index an object should
  // be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator) {
    iterator || (iterator = _.identity);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >> 1;
      iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(iterable) {
    if (!iterable)                return [];
    if (iterable.toArray)         return iterable.toArray();
    if (_.isArray(iterable))      return slice.call(iterable);
    if (_.isArguments(iterable))  return slice.call(iterable);
    return _.values(iterable);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    return _.toArray(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head`. The **guard** check allows it to work
  // with `_.map`.
  _.first = _.head = function(array, n, guard) {
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especcialy useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail`.
  // Especially useful on the arguments object. Passing an **index** will return
  // the rest of the values in the array from that index onward. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = function(array, index, guard) {
    return slice.call(array, (index == null) || guard ? 1 : index);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, function(value){ return !!value; });
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return _.reduce(array, function(memo, value) {
      if (_.isArray(value)) return memo.concat(shallow ? value : _.flatten(value));
      memo[memo.length] = value;
      return memo;
    }, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator) {
    var initial = iterator ? _.map(array, iterator) : array;
    var result = [];
    _.reduce(initial, function(memo, el, i) {
      if (0 == i || (isSorted === true ? _.last(memo) != el : !_.include(memo, el))) {
        memo[memo.length] = el;
        result[result.length] = array[i];
      }
      return memo;
    }, []);
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays. (Aliased as "intersect" for back-compat.)
  _.intersection = _.intersect = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = _.flatten(slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.include(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) results[i] = _.pluck(args, "" + i);
    return results;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i, l;
    if (isSorted) {
      i = _.sortedIndex(array, item);
      return array[i] === item ? i : -1;
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
    for (i = 0, l = array.length; i < l; i++) if (i in array && array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item) {
    if (array == null) return -1;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) return array.lastIndexOf(item);
    var i = array.length;
    while (i--) if (i in array && array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Binding with arguments is also known as `curry`.
  // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
  // We check for `func.bind` first, to fail fast when `func` is undefined.
  _.bind = function bind(func, context) {
    var bound, args;
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length == 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return hasOwnProperty.call(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(func, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, throttling, more;
    var whenDone = _.debounce(function(){ more = throttling = false; }, wait);
    return function() {
      context = this; args = arguments;
      var later = function() {
        timeout = null;
        if (more) func.apply(context, args);
        whenDone();
      };
      if (!timeout) timeout = setTimeout(later, wait);
      if (throttling) {
        more = true;
      } else {
        func.apply(context, args);
      }
      whenDone();
      throttling = true;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds.
  _.debounce = function(func, wait) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        func.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      return memo = func.apply(this, arguments);
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func].concat(slice.call(arguments, 0));
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) { return func.apply(this, arguments); }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (hasOwnProperty.call(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    return _.map(obj, _.identity);
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        if (source[prop] !== void 0) obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        if (obj[prop] == null) obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function.
  function eq(a, b, stack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a._chain) a = a._wrapped;
    if (b._chain) b = b._wrapped;
    // Invoke a custom `isEqual` method if one is provided.
    if (a.isEqual && _.isFunction(a.isEqual)) return a.isEqual(b);
    if (b.isEqual && _.isFunction(b.isEqual)) return b.isEqual(a);
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = stack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (stack[length] == a) return true;
    }
    // Add the first object to the stack of traversed objects.
    stack.push(a);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          // Ensure commutative equality for sparse arrays.
          if (!(result = size in a == size in b && eq(a[size], b[size], stack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent.
      if ('constructor' in a != 'constructor' in b || a.constructor != b.constructor) return false;
      // Deep compare objects.
      for (var key in a) {
        if (hasOwnProperty.call(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = hasOwnProperty.call(b, key) && eq(a[key], b[key], stack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (hasOwnProperty.call(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    stack.pop();
    return result;
  }

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (hasOwnProperty.call(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType == 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Is a given variable an arguments object?
  _.isArguments = function(obj) {
    return toString.call(obj) == '[object Arguments]';
  };
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && hasOwnProperty.call(obj, 'callee'));
    };
  }

  // Is a given value a function?
  _.isFunction = function(obj) {
    return toString.call(obj) == '[object Function]';
  };

  // Is a given value a string?
  _.isString = function(obj) {
    return toString.call(obj) == '[object String]';
  };

  // Is a given value a number?
  _.isNumber = function(obj) {
    return toString.call(obj) == '[object Number]';
  };

  // Is the given value `NaN`?
  _.isNaN = function(obj) {
    // `NaN` is the only value for which `===` is not reflexive.
    return obj !== obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value a date?
  _.isDate = function(obj) {
    return toString.call(obj) == '[object Date]';
  };

  // Is the given value a regular expression?
  _.isRegExp = function(obj) {
    return toString.call(obj) == '[object RegExp]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function (n, iterator, context) {
    for (var i = 0; i < n; i++) iterator.call(context, i);
  };

  // Escape a string for HTML interpolation.
  _.escape = function(string) {
    return (''+string).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g,'&#x2F;');
  };

  // Add your own custom functions to the Underscore object, ensuring that
  // they're correctly added to the OOP wrapper as well.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      addToWrapper(name, _[name] = obj[name]);
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = idCounter++;
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /.^/;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(str, data) {
    var c  = _.templateSettings;
    var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' +
      'with(obj||{}){__p.push(\'' +
      str.replace(/\\/g, '\\\\')
         .replace(/'/g, "\\'")
         .replace(c.escape || noMatch, function(match, code) {
           return "',_.escape(" + code.replace(/\\'/g, "'") + "),'";
         })
         .replace(c.interpolate || noMatch, function(match, code) {
           return "'," + code.replace(/\\'/g, "'") + ",'";
         })
         .replace(c.evaluate || noMatch, function(match, code) {
           return "');" + code.replace(/\\'/g, "'")
                              .replace(/[\r\n\t]/g, ' ')
                              .replace(/\\\\/g, '\\') + ";__p.push('";
         })
         .replace(/\r/g, '\\r')
         .replace(/\n/g, '\\n')
         .replace(/\t/g, '\\t')
         + "');}return __p.join('');";
    var func = new Function('obj', '_', tmpl);
    if (data) return func(data, _);
    return function(data) {
      return func.call(this, data, _);
    };
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // The OOP Wrapper
  // ---------------

  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.
  var wrapper = function(obj) { this._wrapped = obj; };

  // Expose `wrapper.prototype` as `_.prototype`
  _.prototype = wrapper.prototype;

  // Helper function to continue chaining intermediate results.
  var result = function(obj, chain) {
    return chain ? _(obj).chain() : obj;
  };

  // A method to easily add functions to the OOP wrapper.
  var addToWrapper = function(name, func) {
    wrapper.prototype[name] = function() {
      var args = slice.call(arguments);
      unshift.call(args, this._wrapped);
      return result(func.apply(_, args), this._chain);
    };
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      var wrapped = this._wrapped;
      method.apply(wrapped, arguments);
      var length = wrapped.length;
      if ((name == 'shift' || name == 'splice') && length === 0) delete wrapped[0];
      return result(wrapped, this._chain);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      return result(method.apply(this._wrapped, arguments), this._chain);
    };
  });

  // Start chaining a wrapped Underscore object.
  wrapper.prototype.chain = function() {
    this._chain = true;
    return this;
  };

  // Extracts the result from a wrapped and chained object.
  wrapper.prototype.value = function() {
    return this._wrapped;
  };

}).call(this);
/**
 * Zen Coding settings
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 */
var zen_settings = {
	/** 
	 * Variables that can be placed inside snippets or abbreviations as ${variable}
	 * ${child} variable is reserved, don't use it 
	 */
	'variables': {
		'lang': 'en',
		'locale': 'en-US',
		'charset': 'UTF-8',
		
		/** Inner element indentation */
		'indentation': '\t',
		
		// newline variables, useful for wrapping
		'newline': '\n',
		'nl': '\n'
	},
	
	'css': {
		'filters': 'html,css',
		'snippets': {
			"@i": "@import url(|);",
			"@m": "@media print {\n\t|\n}",
			"@f": "@font-face {\n\tfont-family:|;\n\tsrc:url(|);\n}",
			"!": "!important",
			"pos": "position:|;",
			"pos:s": "position:static;",
			"pos:a": "position:absolute;",
			"pos:r": "position:relative;",
			"pos:f": "position:fixed;",
			"t": "top:|;",
			"t:a": "top:auto;",
			"r": "right:|;",
			"r:a": "right:auto;",
			"b": "bottom:|;",
			"b:a": "bottom:auto;",
			"brad": "-webkit-border-radius: ${1:radius};\n-moz-border-radius: $1;\n-ms-border-radius: $1;\nborder-radius: $1;",
			"bsha": "-webkit-box-shadow: ${1:hoff} ${2:voff} ${3:blur} ${4:rgba(0,0,0,0.5)};\n-moz-box-shadow: $1 $2 $3 $4;\n-ms-box-shadow: $1 $2 $3 $4;\nbox-shadow: $1 $2 $3 $4;",
			"l": "left:|;",
			"l:a": "left:auto;",
			"z": "z-index:|;",
			"z:a": "z-index:auto;",
			"fl": "float:|;",
			"fl:n": "float:none;",
			"fl:l": "float:left;",
			"fl:r": "float:right;",
			"cl": "clear:|;",
			"cl:n": "clear:none;",
			"cl:l": "clear:left;",
			"cl:r": "clear:right;",
			"cl:b": "clear:both;",
			"d": "display:|;",
			"d:n": "display:none;",
			"d:b": "display:block;",
			"d:i": "display:inline;",
			"d:ib": "display:inline-block;",
			"d:li": "display:list-item;",
			"d:ri": "display:run-in;",
			"d:cp": "display:compact;",
			"d:tb": "display:table;",
			"d:itb": "display:inline-table;",
			"d:tbcp": "display:table-caption;",
			"d:tbcl": "display:table-column;",
			"d:tbclg": "display:table-column-group;",
			"d:tbhg": "display:table-header-group;",
			"d:tbfg": "display:table-footer-group;",
			"d:tbr": "display:table-row;",
			"d:tbrg": "display:table-row-group;",
			"d:tbc": "display:table-cell;",
			"d:rb": "display:ruby;",
			"d:rbb": "display:ruby-base;",
			"d:rbbg": "display:ruby-base-group;",
			"d:rbt": "display:ruby-text;",
			"d:rbtg": "display:ruby-text-group;",
			"v": "visibility:|;",
			"v:v": "visibility:visible;",
			"v:h": "visibility:hidden;",
			"v:c": "visibility:collapse;",
			"ov": "overflow:|;",
			"ov:v": "overflow:visible;",
			"ov:h": "overflow:hidden;",
			"ov:s": "overflow:scroll;",
			"ov:a": "overflow:auto;",
			"ovx": "overflow-x:|;",
			"ovx:v": "overflow-x:visible;",
			"ovx:h": "overflow-x:hidden;",
			"ovx:s": "overflow-x:scroll;",
			"ovx:a": "overflow-x:auto;",
			"ovy": "overflow-y:|;",
			"ovy:v": "overflow-y:visible;",
			"ovy:h": "overflow-y:hidden;",
			"ovy:s": "overflow-y:scroll;",
			"ovy:a": "overflow-y:auto;",
			"ovs": "overflow-style:|;",
			"ovs:a": "overflow-style:auto;",
			"ovs:s": "overflow-style:scrollbar;",
			"ovs:p": "overflow-style:panner;",
			"ovs:m": "overflow-style:move;",
			"ovs:mq": "overflow-style:marquee;",
			"zoo": "zoom:1;",
			"cp": "clip:|;",
			"cp:a": "clip:auto;",
			"cp:r": "clip:rect(|);",
			"bxz": "box-sizing:|;",
			"bxz:cb": "box-sizing:content-box;",
			"bxz:bb": "box-sizing:border-box;",
			"bxsh": "box-shadow:|;",
			"bxsh:n": "box-shadow:none;",
			"bxsh:w": "-webkit-box-shadow:0 0 0 #000;",
			"bxsh:m": "-moz-box-shadow:0 0 0 0 #000;",
			"m": "margin:|;",
			"m:a": "margin:auto;",
			"m:0": "margin:0;",
			"m:2": "margin:0 0;",
			"m:3": "margin:0 0 0;",
			"m:4": "margin:0 0 0 0;",
			"mt": "margin-top:|;",
			"mt:a": "margin-top:auto;",
			"mr": "margin-right:|;",
			"mr:a": "margin-right:auto;",
			"mb": "margin-bottom:|;",
			"mb:a": "margin-bottom:auto;",
			"ml": "margin-left:|;",
			"ml:a": "margin-left:auto;",
			"p": "padding:|;",
			"p:0": "padding:0;",
			"p:2": "padding:0 0;",
			"p:3": "padding:0 0 0;",
			"p:4": "padding:0 0 0 0;",
			"pt": "padding-top:|;",
			"pr": "padding-right:|;",
			"pb": "padding-bottom:|;",
			"pl": "padding-left:|;",
			"w": "width:|;",
			"w:a": "width:auto;",
			"h": "height:|;",
			"h:a": "height:auto;",
			"maw": "max-width:|;",
			"maw:n": "max-width:none;",
			"mah": "max-height:|;",
			"mah:n": "max-height:none;",
			"miw": "min-width:|;",
			"mih": "min-height:|;",
			"o": "outline:|;",
			"o:n": "outline:none;",
			"oo": "outline-offset:|;",
			"ow": "outline-width:|;",
			"os": "outline-style:|;",
			"oc": "outline-color:#000;",
			"oc:i": "outline-color:invert;",
			"bd": "border:|;",
			"bd+": "border:1px solid #000;",
			"bd:n": "border:none;",
			"bdbk": "border-break:|;",
			"bdbk:c": "border-break:close;",
			"bdcl": "border-collapse:|;",
			"bdcl:c": "border-collapse:collapse;",
			"bdcl:s": "border-collapse:separate;",
			"bdc": "border-color:#000;",
			"bdi": "border-image:url(|);",
			"bdi:n": "border-image:none;",
			"bdi:w": "-webkit-border-image:url(|) 0 0 0 0 stretch stretch;",
			"bdi:m": "-moz-border-image:url(|) 0 0 0 0 stretch stretch;",
			"bdti": "border-top-image:url(|);",
			"bdti:n": "border-top-image:none;",
			"bdri": "border-right-image:url(|);",
			"bdri:n": "border-right-image:none;",
			"bdbi": "border-bottom-image:url(|);",
			"bdbi:n": "border-bottom-image:none;",
			"bdli": "border-left-image:url(|);",
			"bdli:n": "border-left-image:none;",
			"bdci": "border-corner-image:url(|);",
			"bdci:n": "border-corner-image:none;",
			"bdci:c": "border-corner-image:continue;",
			"bdtli": "border-top-left-image:url(|);",
			"bdtli:n": "border-top-left-image:none;",
			"bdtli:c": "border-top-left-image:continue;",
			"bdtri": "border-top-right-image:url(|);",
			"bdtri:n": "border-top-right-image:none;",
			"bdtri:c": "border-top-right-image:continue;",
			"bdbri": "border-bottom-right-image:url(|);",
			"bdbri:n": "border-bottom-right-image:none;",
			"bdbri:c": "border-bottom-right-image:continue;",
			"bdbli": "border-bottom-left-image:url(|);",
			"bdbli:n": "border-bottom-left-image:none;",
			"bdbli:c": "border-bottom-left-image:continue;",
			"bdf": "border-fit:|;",
			"bdf:c": "border-fit:clip;",
			"bdf:r": "border-fit:repeat;",
			"bdf:sc": "border-fit:scale;",
			"bdf:st": "border-fit:stretch;",
			"bdf:ow": "border-fit:overwrite;",
			"bdf:of": "border-fit:overflow;",
			"bdf:sp": "border-fit:space;",
			"bdl": "border-length:|;",
			"bdl:a": "border-length:auto;",
			"bdsp": "border-spacing:|;",
			"bds": "border-style:|;",
			"bds:n": "border-style:none;",
			"bds:h": "border-style:hidden;",
			"bds:dt": "border-style:dotted;",
			"bds:ds": "border-style:dashed;",
			"bds:s": "border-style:solid;",
			"bds:db": "border-style:double;",
			"bds:dtds": "border-style:dot-dash;",
			"bds:dtdtds": "border-style:dot-dot-dash;",
			"bds:w": "border-style:wave;",
			"bds:g": "border-style:groove;",
			"bds:r": "border-style:ridge;",
			"bds:i": "border-style:inset;",
			"bds:o": "border-style:outset;",
			"bdw": "border-width:|;",
			"bdt": "border-top:|;",
			"bdt+": "border-top:1px solid #000;",
			"bdt:n": "border-top:none;",
			"bdtw": "border-top-width:|;",
			"bdts": "border-top-style:|;",
			"bdts:n": "border-top-style:none;",
			"bdtc": "border-top-color:#000;",
			"bdr": "border-right:|;",
			"bdr+": "border-right:1px solid #000;",
			"bdr:n": "border-right:none;",
			"bdrw": "border-right-width:|;",
			"bdrs": "border-right-style:|;",
			"bdrs:n": "border-right-style:none;",
			"bdrc": "border-right-color:#000;",
			"bdb": "border-bottom:|;",
			"bdb+": "border-bottom:1px solid #000;",
			"bdb:n": "border-bottom:none;",
			"bdbw": "border-bottom-width:|;",
			"bdbs": "border-bottom-style:|;",
			"bdbs:n": "border-bottom-style:none;",
			"bdbc": "border-bottom-color:#000;",
			"bdl": "border-left:|;",
			"bdl+": "border-left:1px solid #000;",
			"bdl:n": "border-left:none;",
			"bdlw": "border-left-width:|;",
			"bdls": "border-left-style:|;",
			"bdls:n": "border-left-style:none;",
			"bdlc": "border-left-color:#000;",
			"bdrs": "border-radius:|;",
			"bdtrrs": "border-top-right-radius:|;",
			"bdtlrs": "border-top-left-radius:|;",
			"bdbrrs": "border-bottom-right-radius:|;",
			"bdblrs": "border-bottom-left-radius:|;",
			"bg": "background:|;",
			"bg+": "background:#FFF url(|) 0 0 no-repeat;",
			"bg:n": "background:none;",
			"bg:ie": "filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src='${1:x}.png',sizingMethod='${2:crop}');",
			"bgc": "background-color:#FFF;",
			"bgi": "background-image:url(|);",
			"bgi:n": "background-image:none;",
			"bgr": "background-repeat:|;",
			"bgr:n": "background-repeat:no-repeat;",
			"bgr:x": "background-repeat:repeat-x;",
			"bgr:y": "background-repeat:repeat-y;",
			"bga": "background-attachment:|;",
			"bga:f": "background-attachment:fixed;",
			"bga:s": "background-attachment:scroll;",
			"bgp": "background-position:0 0;",
			"bgpx": "background-position-x:|;",
			"bgpy": "background-position-y:|;",
			"bgbk": "background-break:|;",
			"bgbk:bb": "background-break:bounding-box;",
			"bgbk:eb": "background-break:each-box;",
			"bgbk:c": "background-break:continuous;",
			"bgcp": "background-clip:|;",
			"bgcp:bb": "background-clip:border-box;",
			"bgcp:pb": "background-clip:padding-box;",
			"bgcp:cb": "background-clip:content-box;",
			"bgcp:nc": "background-clip:no-clip;",
			"bgo": "background-origin:|;",
			"bgo:pb": "background-origin:padding-box;",
			"bgo:bb": "background-origin:border-box;",
			"bgo:cb": "background-origin:content-box;",
			"bgz": "background-size:|;",
			"bgz:a": "background-size:auto;",
			"bgz:ct": "background-size:contain;",
			"bgz:cv": "background-size:cover;",
			"c": "color:#000;",
			"tbl": "table-layout:|;",
			"tbl:a": "table-layout:auto;",
			"tbl:f": "table-layout:fixed;",
			"cps": "caption-side:|;",
			"cps:t": "caption-side:top;",
			"cps:b": "caption-side:bottom;",
			"ec": "empty-cells:|;",
			"ec:s": "empty-cells:show;",
			"ec:h": "empty-cells:hide;",
			"lis": "list-style:|;",
			"lis:n": "list-style:none;",
			"lisp": "list-style-position:|;",
			"lisp:i": "list-style-position:inside;",
			"lisp:o": "list-style-position:outside;",
			"list": "list-style-type:|;",
			"list:n": "list-style-type:none;",
			"list:d": "list-style-type:disc;",
			"list:c": "list-style-type:circle;",
			"list:s": "list-style-type:square;",
			"list:dc": "list-style-type:decimal;",
			"list:dclz": "list-style-type:decimal-leading-zero;",
			"list:lr": "list-style-type:lower-roman;",
			"list:ur": "list-style-type:upper-roman;",
			"lisi": "list-style-image:|;",
			"lisi:n": "list-style-image:none;",
			"q": "quotes:|;",
			"q:n": "quotes:none;",
			"q:ru": "quotes:'\00AB' '\00BB' '\201E' '\201C';",
			"q:en": "quotes:'\201C' '\201D' '\2018' '\2019';",
			"ct": "content:|;",
			"ct:n": "content:normal;",
			"ct:oq": "content:open-quote;",
			"ct:noq": "content:no-open-quote;",
			"ct:cq": "content:close-quote;",
			"ct:ncq": "content:no-close-quote;",
			"ct:a": "content:attr(|);",
			"ct:c": "content:counter(|);",
			"ct:cs": "content:counters(|);",
			"coi": "counter-increment:|;",
			"cor": "counter-reset:|;",
			"va": "vertical-align:|;",
			"va:sup": "vertical-align:super;",
			"va:t": "vertical-align:top;",
			"va:tt": "vertical-align:text-top;",
			"va:m": "vertical-align:middle;",
			"va:bl": "vertical-align:baseline;",
			"va:b": "vertical-align:bottom;",
			"va:tb": "vertical-align:text-bottom;",
			"va:sub": "vertical-align:sub;",
			"ta": "text-align:|;",
			"ta:l": "text-align:left;",
			"ta:c": "text-align:center;",
			"ta:r": "text-align:right;",
			"tal": "text-align-last:|;",
			"tal:a": "text-align-last:auto;",
			"tal:l": "text-align-last:left;",
			"tal:c": "text-align-last:center;",
			"tal:r": "text-align-last:right;",
			"td": "text-decoration:|;",
			"td:n": "text-decoration:none;",
			"td:u": "text-decoration:underline;",
			"td:o": "text-decoration:overline;",
			"td:l": "text-decoration:line-through;",
			"te": "text-emphasis:|;",
			"te:n": "text-emphasis:none;",
			"te:ac": "text-emphasis:accent;",
			"te:dt": "text-emphasis:dot;",
			"te:c": "text-emphasis:circle;",
			"te:ds": "text-emphasis:disc;",
			"te:b": "text-emphasis:before;",
			"te:a": "text-emphasis:after;",
			"th": "text-height:|;",
			"th:a": "text-height:auto;",
			"th:f": "text-height:font-size;",
			"th:t": "text-height:text-size;",
			"th:m": "text-height:max-size;",
			"ti": "text-indent:|;",
			"ti:-": "text-indent:-9999px;",
			"tj": "text-justify:|;",
			"tj:a": "text-justify:auto;",
			"tj:iw": "text-justify:inter-word;",
			"tj:ii": "text-justify:inter-ideograph;",
			"tj:ic": "text-justify:inter-cluster;",
			"tj:d": "text-justify:distribute;",
			"tj:k": "text-justify:kashida;",
			"tj:t": "text-justify:tibetan;",
			"to": "text-outline:|;",
			"to+": "text-outline:0 0 #000;",
			"to:n": "text-outline:none;",
			"tr": "text-replace:|;",
			"tr:n": "text-replace:none;",
			"tt": "text-transform:|;",
			"tt:n": "text-transform:none;",
			"tt:c": "text-transform:capitalize;",
			"tt:u": "text-transform:uppercase;",
			"tt:l": "text-transform:lowercase;",
			"tw": "text-wrap:|;",
			"tw:n": "text-wrap:normal;",
			"tw:no": "text-wrap:none;",
			"tw:u": "text-wrap:unrestricted;",
			"tw:s": "text-wrap:suppress;",
			"tsh": "text-shadow:|;",
			"tsh+": "text-shadow:0 0 0 #000;",
			"tsh:n": "text-shadow:none;",
			"lh": "line-height:|;",
			"whs": "white-space:|;",
			"whs:n": "white-space:normal;",
			"whs:p": "white-space:pre;",
			"whs:nw": "white-space:nowrap;",
			"whs:pw": "white-space:pre-wrap;",
			"whs:pl": "white-space:pre-line;",
			"whsc": "white-space-collapse:|;",
			"whsc:n": "white-space-collapse:normal;",
			"whsc:k": "white-space-collapse:keep-all;",
			"whsc:l": "white-space-collapse:loose;",
			"whsc:bs": "white-space-collapse:break-strict;",
			"whsc:ba": "white-space-collapse:break-all;",
			"wob": "word-break:|;",
			"wob:n": "word-break:normal;",
			"wob:k": "word-break:keep-all;",
			"wob:l": "word-break:loose;",
			"wob:bs": "word-break:break-strict;",
			"wob:ba": "word-break:break-all;",
			"wos": "word-spacing:|;",
			"wow": "word-wrap:|;",
			"wow:nm": "word-wrap:normal;",
			"wow:n": "word-wrap:none;",
			"wow:u": "word-wrap:unrestricted;",
			"wow:s": "word-wrap:suppress;",
			"lts": "letter-spacing:|;",
			"f": "font:|;",
			"f+": "font:1em Arial,sans-serif;",
			"fw": "font-weight:|;",
			"fw:n": "font-weight:normal;",
			"fw:b": "font-weight:bold;",
			"fw:br": "font-weight:bolder;",
			"fw:lr": "font-weight:lighter;",
			"fs": "font-style:|;",
			"fs:n": "font-style:normal;",
			"fs:i": "font-style:italic;",
			"fs:o": "font-style:oblique;",
			"fv": "font-variant:|;",
			"fv:n": "font-variant:normal;",
			"fv:sc": "font-variant:small-caps;",
			"fz": "font-size:|;",
			"fza": "font-size-adjust:|;",
			"fza:n": "font-size-adjust:none;",
			"ff": "font-family:|;",
			"ff:s": "font-family:serif;",
			"ff:ss": "font-family:sans-serif;",
			"ff:c": "font-family:cursive;",
			"ff:f": "font-family:fantasy;",
			"ff:m": "font-family:monospace;",
			"fef": "font-effect:|;",
			"fef:n": "font-effect:none;",
			"fef:eg": "font-effect:engrave;",
			"fef:eb": "font-effect:emboss;",
			"fef:o": "font-effect:outline;",
			"fem": "font-emphasize:|;",
			"femp": "font-emphasize-position:|;",
			"femp:b": "font-emphasize-position:before;",
			"femp:a": "font-emphasize-position:after;",
			"fems": "font-emphasize-style:|;",
			"fems:n": "font-emphasize-style:none;",
			"fems:ac": "font-emphasize-style:accent;",
			"fems:dt": "font-emphasize-style:dot;",
			"fems:c": "font-emphasize-style:circle;",
			"fems:ds": "font-emphasize-style:disc;",
			"fsm": "font-smooth:|;",
			"fsm:a": "font-smooth:auto;",
			"fsm:n": "font-smooth:never;",
			"fsm:aw": "font-smooth:always;",
			"fst": "font-stretch:|;",
			"fst:n": "font-stretch:normal;",
			"fst:uc": "font-stretch:ultra-condensed;",
			"fst:ec": "font-stretch:extra-condensed;",
			"fst:c": "font-stretch:condensed;",
			"fst:sc": "font-stretch:semi-condensed;",
			"fst:se": "font-stretch:semi-expanded;",
			"fst:e": "font-stretch:expanded;",
			"fst:ee": "font-stretch:extra-expanded;",
			"fst:ue": "font-stretch:ultra-expanded;",
			"op": "opacity:|;",
			"op:ie": "filter:progid:DXImageTransform.Microsoft.Alpha(Opacity=100);",
			"op:ms": "-ms-filter:'progid:DXImageTransform.Microsoft.Alpha(Opacity=100)';",
			"rz": "resize:|;",
			"rz:n": "resize:none;",
			"rz:b": "resize:both;",
			"rz:h": "resize:horizontal;",
			"rz:v": "resize:vertical;",
			"cur": "cursor:|;",
			"cur:a": "cursor:auto;",
			"cur:d": "cursor:default;",
			"cur:c": "cursor:crosshair;",
			"cur:ha": "cursor:hand;",
			"cur:he": "cursor:help;",
			"cur:m": "cursor:move;",
			"cur:p": "cursor:pointer;",
			"cur:t": "cursor:text;",
			"pgbb": "page-break-before:|;",
			"pgbb:au": "page-break-before:auto;",
			"pgbb:al": "page-break-before:always;",
			"pgbb:l": "page-break-before:left;",
			"pgbb:r": "page-break-before:right;",
			"pgbi": "page-break-inside:|;",
			"pgbi:au": "page-break-inside:auto;",
			"pgbi:av": "page-break-inside:avoid;",
			"pgba": "page-break-after:|;",
			"pgba:au": "page-break-after:auto;",
			"pgba:al": "page-break-after:always;",
			"pgba:l": "page-break-after:left;",
			"pgba:r": "page-break-after:right;",
			"orp": "orphans:|;",
			"wid": "widows:|;"
		}
	},
	
	'html': {
		'filters': 'html',
		'snippets': {
			'cc:ie6': '<!--[if lte IE 6]>\n\t${child}|\n<![endif]-->',
			'cc:ie': '<!--[if IE]>\n\t${child}|\n<![endif]-->',
			'cc:noie': '<!--[if !IE]><!-->\n\t${child}|\n<!--<![endif]-->',
			'html:4t': '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">\n' +
					'<html lang="${lang}">\n' +
					'<head>\n' +
					'	<meta http-equiv="Content-Type" content="text/html;charset=${charset}">\n' +
					'	<title></title>\n' +
					'</head>\n' +
					'<body>\n\t${child}|\n</body>\n' +
					'</html>',
			
			'html:4s': '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">\n' +
					'<html lang="${lang}">\n' +
					'<head>\n' +
					'	<meta http-equiv="Content-Type" content="text/html;charset=${charset}">\n' +
					'	<title></title>\n' +
					'</head>\n' +
					'<body>\n\t${child}|\n</body>\n' +
					'</html>',
			
			'html:xt': '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\n' +
					'<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${lang}">\n' +
					'<head>\n' +
					'	<meta http-equiv="Content-Type" content="text/html;charset=${charset}" />\n' +
					'	<title></title>\n' +
					'</head>\n' +
					'<body>\n\t${child}|\n</body>\n' +
					'</html>',
			
			'html:xs': '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">\n' +
					'<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${lang}">\n' +
					'<head>\n' +
					'	<meta http-equiv="Content-Type" content="text/html;charset=${charset}" />\n' +
					'	<title></title>\n' +
					'</head>\n' +
					'<body>\n\t${child}|\n</body>\n' +
					'</html>',
			
			'html:xxs': '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">\n' +
					'<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${lang}">\n' +
					'<head>\n' +
					'	<meta http-equiv="Content-Type" content="text/html;charset=${charset}" />\n' +
					'	<title></title>\n' +
					'</head>\n' +
					'<body>\n\t${child}|\n</body>\n' +
					'</html>',
			
			'html:5': '<!DOCTYPE HTML>\n' +
					'<html lang="${locale}">\n' +
					'<head>\n' +
					'	<meta charset="${charset}">\n' +
					'	<title></title>\n' +
					'</head>\n' +
					'<body>\n\t${child}|\n</body>\n' +
					'</html>'
		},
		
		'abbreviations': {
			'a': '<a href="">',
			'a:link': '<a href="http://|">',
			'a:mail': '<a href="mailto:|">',
			'abbr': '<abbr title="">',
			'acronym': '<acronym title="">',
			'base': '<base href="" />',
			'bdo': '<bdo dir="">',
			'bdo:r': '<bdo dir="rtl">',
			'bdo:l': '<bdo dir="ltr">',
			'link:css': '<link rel="stylesheet" type="text/css" href="${1:style}.css" media="all" />',
			'link:print': '<link rel="stylesheet" type="text/css" href="|print.css" media="print" />',
			'link:favicon': '<link rel="shortcut icon" type="image/x-icon" href="|favicon.ico" />',
			'link:touch': '<link rel="apple-touch-icon" href="|favicon.png" />',
			'link:rss': '<link rel="alternate" type="application/rss+xml" title="RSS" href="|rss.xml" />',
			'link:atom': '<link rel="alternate" type="application/atom+xml" title="Atom" href="atom.xml" />',
			'meta:utf': '<meta http-equiv="Content-Type" content="text/html;charset=UTF-8" />',
			'meta:win': '<meta http-equiv="Content-Type" content="text/html;charset=windows-1251" />',
			'meta:compat': '<meta http-equiv="X-UA-Compatible" content="IE=7" />',
			'style': '<style type="text/css">',
			'script': '<script type="text/javascript">',
			'script:src': '<script type="text/javascript" src="">',
			'img': '<img src="" alt="" />',
			'iframe': '<iframe src="" frameborder="0">',
			'embed': '<embed src="" type="" />',
			'object': '<object data="" type="">',
			'param': '<param name="" value="" />',
			'map': '<map name="">',
			'area': '<area shape="" coords="" href="" alt="" />',
			'area:d': '<area shape="default" href="" alt="" />',
			'area:c': '<area shape="circle" coords="" href="" alt="" />',
			'area:r': '<area shape="rect" coords="" href="" alt="" />',
			'area:p': '<area shape="poly" coords="" href="" alt="" />',
			'link': '<link rel="stylesheet" href="" />',
			'form': '<form action="">',
			'form:get': '<form action="" method="get">',
			'form:post': '<form action="" method="post">',
			'label': '<label for="">',
			'input': '<input type="" />',
			'input:hidden': '<input type="hidden" name="" />',
			'input:h': '<input type="hidden" name="" />',
			'input:text': '<input type="text" name="" id="" />',
			'input:t': '<input type="text" name="" id="" />',
			'input:search': '<input type="search" name="" id="" />',
			'input:email': '<input type="email" name="" id="" />',
			'input:url': '<input type="url" name="" id="" />',
			'input:password': '<input type="password" name="" id="" />',
			'input:p': '<input type="password" name="" id="" />',
			'input:datetime': '<input type="datetime" name="" id="" />',
			'input:date': '<input type="date" name="" id="" />',
			'input:datetime-local': '<input type="datetime-local" name="" id="" />',
			'input:month': '<input type="month" name="" id="" />',
			'input:week': '<input type="week" name="" id="" />',
			'input:time': '<input type="time" name="" id="" />',
			'input:number': '<input type="number" name="" id="" />',
			'input:color': '<input type="color" name="" id="" />',
			'input:checkbox': '<input type="checkbox" name="" id="" />',
			'input:c': '<input type="checkbox" name="" id="" />',
			'input:radio': '<input type="radio" name="" id="" />',
			'input:r': '<input type="radio" name="" id="" />',
			'input:range': '<input type="range" name="" id="" />',
			'input:file': '<input type="file" name="" id="" />',
			'input:f': '<input type="file" name="" id="" />',
			'input:submit': '<input type="submit" value="" />',
			'input:s': '<input type="submit" value="" />',
			'input:image': '<input type="image" src="" alt="" />',
			'input:i': '<input type="image" src="" alt="" />',
			'input:reset': '<input type="reset" value="" />',
			'input:button': '<input type="button" value="" />',
			'input:b': '<input type="button" value="" />',
			'select': '<select name="" id=""></select>',
			'option': '<option value=""></option>',
			'textarea': '<textarea name="" id="" cols="30" rows="10">',
			'menu:context': '<menu type="context">',
			'menu:c': '<menu type="context">',
			'menu:toolbar': '<menu type="toolbar">',
			'menu:t': '<menu type="toolbar">',
			'video': '<video src="">',
			'audio': '<audio src="">',
			'html:xml': '<html xmlns="http://www.w3.org/1999/xhtml">',
			'bq': '<blockquote>',
			'acr': '<acronym>',
			'fig': '<figure>',
			'ifr': '<iframe>',
			'emb': '<embed>',
			'obj': '<object>',
			'src': '<source>',
			'cap': '<caption>',
			'colg': '<colgroup>',
			'fst': '<fieldset>',
			'btn': '<button>',
			'optg': '<optgroup>',
			'opt': '<option>',
			'tarea': '<textarea>',
			'leg': '<legend>',
			'sect': '<section>',
			'art': '<article>',
			'hdr': '<header>',
			'ftr': '<footer>',
			'adr': '<address>',
			'dlg': '<dialog>',
			'str': '<strong>',
			'prog': '<progress>',
			'fset': '<fieldset>',
			'datag': '<datagrid>',
			'datal': '<datalist>',
			'kg': '<keygen>',
			'out': '<output>',
			'det': '<details>',
			'cmd': '<command>',
			
			// expandos
			'ol+': 'ol>li',
			'ul+': 'ul>li',
			'dl+': 'dl>dt+dd',
			'map+': 'map>area',
			'table+': 'table>tr>td',
			'colgroup+': 'colgroup>col',
			'colg+': 'colgroup>col',
			'tr+': 'tr>td',
			'select+': 'select>option',
			'optgroup+': 'optgroup>option',
			'optg+': 'optgroup>option'

		},
		
		'element_types': {
			'empty': 'area,base,basefont,br,col,frame,hr,img,input,isindex,link,meta,param,embed,keygen,command',
			'block_level': 'address,applet,blockquote,button,center,dd,del,dir,div,dl,dt,fieldset,form,frameset,hr,iframe,ins,isindex,li,link,map,menu,noframes,noscript,object,ol,p,pre,script,table,tbody,td,tfoot,th,thead,tr,ul,h1,h2,h3,h4,h5,h6',
			'inline_level': 'a,abbr,acronym,applet,b,basefont,bdo,big,br,button,cite,code,del,dfn,em,font,i,iframe,img,input,ins,kbd,label,map,object,q,s,samp,select,small,span,strike,strong,sub,sup,textarea,tt,u,var'
		}
	},
	
	'xml': {
		'extends': 'html',
		'filters': 'html'
	},
	
	'xsl': {
		'extends': 'html',
		'filters': 'html, xsl',
		'abbreviations': {
			'tm': '<xsl:template match="" mode="">',
			'tmatch': 'tm',
			'tn': '<xsl:template name="">',
			'tname': 'tn',
			'xsl:when': '<xsl:when test="">',
			'wh': 'xsl:when',
			'var': '<xsl:variable name="">',
			'vare': '<xsl:variable name="" select=""/>',
			'if': '<xsl:if test="">',
			'call': '<xsl:call-template name=""/>',
			'attr': '<xsl:attribute name="">',
			'wp': '<xsl:with-param name="" select=""/>',
			'par': '<xsl:param name="" select=""/>',
			'val': '<xsl:value-of select=""/>',
			'co': '<xsl:copy-of select=""/>',
			'each': '<xsl:for-each select="">',
			'for': 'each',
			'ap': '<xsl:apply-templates select="" mode=""/>',
			
			//expandos
			'choose+': 'xsl:choose>xsl:when+xsl:otherwise'
		}
	},
	
	'haml': {
		'filters': 'haml',
		'extends': 'html'
	}
};/**
 * Core Zen Coding object, available in global scope
 */
(function(global) {
	
	global.zen_coding = {
		/**
		 * Simple, AMD-like module definition. The module will be added into
		 * <code>zen_coding</code> object and will be available via 
		 * <code>zen_coding.require(name)</code> or <code>zen_coding[name]</code>
		 * @param {String} name
		 * @param {Function} factory
		 * @memberOf zen_coding
		 */
		define: function(name, factory) {
			// do not let redefine existing properties
			if (!(name in this)) {
				this[name] = _.isFunction(factory) 
					? factory(_.bind(this.require, this), _, this)
					: factory;
			}
		},
		
		/**
		 * Returns reference to Zen Coding module
		 * @param {String} name Module name
		 */
		require: function(name) {
			return this[name];
		},
		
		/**
		 * The essential function that expands Zen Coding abbreviation
		 * @param {String} abbr Abbreviation to parse
		 * @param {String} syntax Abbreviation's context syntax
		 * @param {String} profile Output profile (or its name)
		 * @param {TreeNode} contextNode Contextual node where abbreviation is
		 * written
		 * @return {String}
		 */
		expandAbbreviation: function(abbr, syntax, profile, contextNode) {
			if (!abbr) return '';
			
			var filters = this.require('filters');
			var utils = this.require('utils');
			var transform = this.require('transform');
			var parser = this.require('parser');
			
			var data = filters.extractFromAbbreviation(abbr);
			var outputTree = transform.transform(data[0], syntax, contextNode);
			var filtersList = filters.composeList(syntax, profile, data[1]);
			filters.apply(outputTree, filtersList, profile);
			return utils.replaceVariables(outputTree.toString());
		},
		
		/**
		 * Log message into console if it exists
		 */
		log: function() {
			if (global.console && global.console.log)
				global.console.log.apply(global.console, arguments);
		},
		
		/**
		 * Reference to Underscore.js. 
		 * Get it by calling <code>zen_coding.require('_')</code>
		 */
		_: _
	};
	
	
})(this);/**
 * Utility module for Zen Coding
 * @param {Function} require
 * @param {Underscore} _
 */
zen_coding.define('utils', function(require, _) {
	/** 
	 * Special token used as a placeholder for caret positions inside 
	 * generated output 
	 */
	var caretPlaceholder = '{%::zen-caret::%}';
	
	return {
		/** @memberOf zen_coding.utils */
		reTag: /<\/?[\w:\-]+(?:\s+[\w\-:]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*\s*(\/?)>$/,
		
		/**
		 * Test if passed string ends with XHTML tag. This method is used for testing
		 * '>' character: it belongs to tag or it's a part of abbreviation? 
		 * @param {String} str
		 * @return {Boolean}
		 */
		endsWithTag: function(str) {
			return this.reTag.test(str);
		},
		
		/**
		 * Check if passed symbol is valid symbol for abbreviation expression
		 * @param {String} ch
		 * @return {Boolean}
		 */
		isAllowedChar: function(ch) {
			ch = String(ch); // convert Java object to JS
			var charCode = ch.charCodeAt(0);
			var specialChars = '#.>+*:$-_!@[]()|';
			
			return (charCode > 64 && charCode < 91)       // uppercase letter
					|| (charCode > 96 && charCode < 123)  // lowercase letter
					|| this.isNumeric(ch)                 // number
					|| specialChars.indexOf(ch) != -1;    // special character
		},
		
		/**
		 * Check if passed symbol is a number
		 * @param {String} ch
		 * @returns {Boolean}
		 */
		isNumeric: function(ch) {
			if (typeof(ch) == 'string')
				ch = ch.charCodeAt(0);
				
			return (ch && ch > 47 && ch < 58);
		},
		
		/**
		 * Trim whitespace from string
		 * @param {String} text
		 * @return {String}
		 */
		trim: function(text) {
			return (text || "").replace(/^\s+|\s+$/g, "");
		},
		
		/**
		 * Returns newline character
		 * @returns {String}
		 */
		getNewline: function() {
			var nl = zen_coding.require('resources').getVariable('newline');
			return _.isString(nl) ? nl : '\n';
		},
		
		/**
		 * Sets new newline character that will be used in output
		 * @param {String} str
		 */
		setNewline: function(str) {
			var res = zen_coding.require('resources');
			res.setVariable('newline', str);
			res.setVariable('nl', str);
		},
		
		/**
		 * Split text into lines. Set <code>remove_empty</code> to true to filter
		 * empty lines
		 * @param {String} text Text to split
		 * @param {Boolean} remove_empty Remove empty lines from result
		 * @return {Array}
		 */
		splitByLines: function(text, removeEmpty) {
			// IE fails to split string by regexp, 
			// need to normalize newlines first
			// Also, Mozilla's Rhiho JS engine has a weird newline bug
			var nl = this.getNewline();
			var lines = (text || '')
				.replace(/\r\n/g, '\n')
				.replace(/\n\r/g, '\n')
				.replace(/\r/g, '\n')
				.replace(/\n/g, nl)
				.split(nl);
			
			if (removeEmpty) {
				var that = this;
				_.filter(lines, function(line) {
					return !!that.trim(line);
				});
			}
			
			return lines;
		},
		
		/**
		 * Repeats string <code>howMany</code> times
		 * @param {String} str
		 * @param {Number} how_many
		 * @return {String}
		 */
		repeatString: function(str, howMany) {
			var result = [];
			
			for (var i = 0; i < howMany; i++) 
				result.push(str);
				
			return result.join('');
		},
		
		/**
		 * Indents text with padding
		 * @param {String} text Text to indent
		 * @param {String} pad Padding size (number) or padding itself (string)
		 * @return {String}
		 */
		padString: function(text, pad) {
			var padStr = (_.isNumber(pad)) 
				? this.repeatString(zen_resources.getVariable('indentation') || '\t', pad) 
				: pad;
				
			var result = [];
			
			var lines = this.splitByLines(text);
			var nl = this.getNewline();
				
			result.push(lines[0]);
			for (var j = 1; j < lines.length; j++) 
				result.push(nl + padStr + lines[j]);
				
			return result.join('');
		},
		
		/**
		 * Pad string with zeroes
		 * @param {String} str String to pad
		 * @param {Number} pad Desired string length
		 * @return {String}
		 */
		zeroPadString: function(str, pad) {
			var padding = '';
			var il = str.length;
				
			while (pad > il++) padding += '0';
			return padding + str; 
		},
		
		/**
		 * Removes padding at the beginning of each text's line
		 * @param {String} text
		 * @param {String} pad
		 */
		unindentString: function(text, pad) {
			var lines = this.splitByLines(text);
			for (var i = 0; i < lines.length; i++) {
				if (lines[i].search(pad) == 0)
					lines[i] = lines[i].substr(pad.length);
			}
			
			return lines.join(this.getNewline());
		},
		
		/**
		 * Replaces unescaped symbols in <code>str</code>. For example, the '$' symbol
		 * will be replaced in 'item$count', but not in 'item\$count'.
		 * @param {String} str Original string
		 * @param {String} symbol Symbol to replace
		 * @param {String} replace Symbol replacement. Might be a function that 
		 * returns new value
		 * @return {String}
		 */
		replaceUnescapedSymbol: function(str, symbol, replace) {
			var i = 0;
			var il = str.length;
			var sl = symbol.length;
			var matchCount = 0;
				
			while (i < il) {
				if (str.charAt(i) == '\\') {
					// escaped symbol, skip next character
					i += sl + 1;
				} else if (str.substr(i, sl) == symbol) {
					// have match
					var curSl = sl;
					matchCount++;
					var newValue = replace;
					if (_.isFunction(replace)) {
						var replaceData = replace(str, symbol, i, matchCount);
						if (replaceData) {
							curSl = replaceData[0].length;
							newValue = replaceData[1];
						} else {
							newValue = false;
						}
					}
					
					if (newValue === false) { // skip replacement
						i++;
						continue;
					}
					
					str = str.substring(0, i) + newValue + str.substring(i + curSl);
					// adjust indexes
					il = str.length;
					i += newValue.length;
				} else {
					i++;
				}
			}
			
			return str;
		},
		
		/**
		 * Replace variables like ${var} in string
		 * @param {String} str
		 * @param {Object} vars Variable set (defaults to variables defined in 
		 * <code>zen_settings</code>) or variable resolver (<code>Function</code>)
		 * @return {String}
		 */
		replaceVariables: function(str, vars) {
			vars = vars || {};
			var resolver = _.isFunction(vars) ? vars : function(str, p1) {
				return p1 in vars ? vars[p1] : null;
			};
			
			return str.replace(/\$\{([\w\-]+)\}/g, function(str, p1) {
				var newValue = resolver(str, p1);
				if (newValue === null) {
					// try to find variable in zen_settings
					var res = require('resources');
					newValue = res.getVariable(p1);
				}
				
				if (newValue === null || _.isUndefined(newValue))
					// nothing found, return token itself
					newValue = str;
				
				return newValue;
			});
		},
		
		/**
		 * Replaces '$' character in string assuming it might be escaped with '\'
		 * @param {String} str String where caracter should be replaced
		 * @param {String} value Replace value. Might be a <code>Function</code>
		 * @return {String}
		 */
		replaceCounter: function(str, value) {
			var symbol = '$';
			// in case we received strings from Java, convert the to native strings
			str = String(str);
			value = String(value);
			var that = this;
			return this.replaceUnescapedSymbol(str, symbol, function(str, symbol, pos, matchNum){
				if (str.charAt(pos + 1) == '{' || that.isNumeric(str.charAt(pos + 1)) ) {
					// it's a variable, skip it
					return false;
				}
				
				// replace sequense of $ symbols with padded number  
				var j = pos + 1;
				while(str.charAt(j) == '$' && str.charAt(j + 1) != '{') j++;
				return [str.substring(pos, j), that.zeroPadString(value, j - pos)];
			});
		},
		
		/**
		 * Check if string matches against <code>reTag</code> regexp. This 
		 * function may be used to test if provided string contains HTML tags
		 * @param {String} str
		 * @returns {Boolean}
		 */
		matchesTag: function(str) {
			return this.reTag.test(str || '');
		},
		
		/**
		 * Escapes special characters used in Zen Coding, like '$', '|', etc.
		 * Use this method before passing to actions like "Wrap with Abbreviation"
		 * to make sure that existing spacial characters won't be altered
		 * @param {String} text
		 * @return {String}
		 */
		escapeText: function(text) {
			return text.replace(/([\$\|\\])/g, '\\$1');
		},
		
		/**
		 * Unescapes special characters used in Zen Coding, like '$', '|', etc.
		 * @param {String} text
		 * @return {String}
		 */
		unescapeText: function(text) {
			return text.replace(/\\(.)/g, '$1');
		},
		
		/**
		 * Returns caret placeholder
		 * @returns {String}
		 */
		getCaretPlaceholder: function() {
			return _.isFunction(caretPlaceholder) 
				? caretPlaceholder.apply(this, arguments)
				: caretPlaceholder;
		},
		
		/**
		 * Sets new representation for carets in generated output
		 * @param {String} value New caret placeholder. Might be a 
		 * <code>Function</code>
		 */
		setCaretPlaceholder: function(value) {
			caretPlaceholder = value;
		},
		
		/**
		 * Returns context-aware node counter
		 * @param {node} ZenNode
		 * @return {Number}
		 */
		getCounterForNode: function(node) {
			// find nearest repeating parent
			var counter = node.counter;
			if (!node.is_repeating && !node.repeat_by_lines) {
				while (node = node.parent) {
					if (node.is_repeating || node.repeat_by_lines)
						return node.counter;
				}
			}
			
			return counter;
		},
		
		/**
		 * Returns line padding
		 * @param {String} line
		 * @return {String}
		 */
		getLinePadding: function(line) {
			return (line.match(/^(\s+)/) || [''])[0];
		},
		
		/**
		 * Escape special regexp chars in string, making it usable for creating dynamic
		 * regular expressions
		 * @param {String} str
		 * @return {String}
		 */
		escapeForRegexp: function(str) {
			var specials = new RegExp("[.*+?|()\\[\\]{}\\\\]", "g"); // .*+?|()[]{}\
			return str.replace(specials, "\\$&");
		},
		
		/**
		 * Make decimal number look good: convert it to fixed precision end remove
		 * traling zeroes 
		 * @param {Number} num
		 * @param {Number} fracion Fraction numbers (default is 2)
		 * @return {String}
		 */
		prettifyNumber: function(num, fraction) {
			return num.toFixed(typeof fraction == 'undefined' ? 2 : fraction).replace(/\.?0+$/, '');
		}
	};
});
/**
 * Parsed resources (snippets, abbreviations, variables, etc.) for Zen Coding.
 * Contains convenient method to get access for snippets with respect of 
 * inheritance. Also provides ability to store data in different vocabularies
 * ('system' and 'user') for fast and safe resource update
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * 
 * @param {Function} require
 * @param {Underscore} _
 */
zen_coding.define('resources', function(require, _) {
	var VOC_SYSTEM = 'system';
	var VOC_USER = 'user';
		
	/** Regular expression for XML tag matching */
	var re_tag = /^<(\w+\:?[\w\-]*)((?:\s+[\w\:\-]+\s*=\s*(['"]).*?\3)*)\s*(\/?)>/;
		
	var systemSettings = {};
	var userSettings = {};
	
	/** List of registered abbreviation resolvers */
	var resolvers = [];
	
	/**
	 * Check if specified resource is parsed by Zen Coding
	 * @param {Object} obj
	 * @return {Boolean}
	 */
	function isParsed(obj) {
		return obj && obj.__zen_parsed__;
	}
	
	/**
	 * Marks object as parsed by Zen Coding
	 * @param {Object}
	 */
	function setParsed(obj) {
		obj.__zen_parsed__ = true;
	}
	
	/**
	 * Returns resource vocabulary by its name
	 * @param {String} name Vocabulary name ('system' or 'user')
	 */
	function getVocabulary(name) {
		return name == VOC_SYSTEM ? systemSettings : userSettings;
	}
		
	/**
	 * Helper function that transforms string into hash
	 * @return {Object}
	 */
	function stringToHash(str){
		var obj = {}, items = str.split(",");
		for ( var i = 0; i < items.length; i++ )
			obj[ items[i] ] = true;
		return obj;
	}
	
	/**
	 * Creates resource inheritance chain for lookups
	 * @param {String} vocabulary Resource vocabulary
	 * @param {String} syntax Syntax name
	 * @param {String} name Resource name
	 * @return {Array}
	 */
	function createResourceChain(vocabulary, syntax, name) {
		var voc = getVocabulary(vocabulary),
			result = [],
			resource = null;
		
		if (voc && syntax in voc) {
			resource = voc[syntax];
			if (name in resource)
				result.push(resource[name]);
		}
		
		// get inheritance definition
		// in case of user-defined vocabulary, resource dependency
		// may be defined in system vocabulary only, so we have to correctly
		// handle this case
		var chain_source = null;
		if (resource && 'extends' in resource)
			chain_source = resource;
		else if (vocabulary == VOC_USER && syntax in systemSettings 
			&& 'extends' in systemSettings[syntax] )
			chain_source = systemSettings[syntax];
			
		if (chain_source) {
			if (!isParsed(chain_source['extends'])) {
				var ar = chain_source['extends'].split(',');
				var utils = require('utils');
				for (var i = 0; i < ar.length; i++) 
					ar[i] = utils.trim(ar[i]);
				chain_source['extends'] = ar;
				setParsed(chain_source['extends']);
			}
			
			// find resource in ancestors
			for (var i = 0; i < chain_source['extends'].length; i++) {
				var type = chain_source['extends'][i];
				if (voc[type] && voc[type][name])
					result.push(voc[type][name]);
			}
		}
		
		return result;
	}
	
	/**
	 * Get resource collection from settings vocbulary for specified syntax. 
	 * It follows inheritance chain if resource wasn't directly found in
	 * syntax settings
	 * @param {String} vocabulary Resource vocabulary
	 * @param {String} syntax Syntax name
	 * @param {String} name Resource name
	 */
	function getSubset(vocabulary, syntax, name) {
		var chain = createResourceChain(vocabulary, syntax, name);
		return chain[0];
	}
	
	/**
	 * Returns parsed item located in specified vocabulary by its syntax and
	 * name
	 * @param {String} vocabulary Resource vocabulary
	 * @param {String} syntax Syntax name
	 * @param {String} name Resource name ('abbreviation', 'snippet')
	 * @param {String} item Abbreviation or snippet name
	 * @return {Object|null}
	 */
	function getParsedItem(vocabulary, syntax, name, item) {
		var chain = createResourceChain(vocabulary, syntax, name);
		var result = null, res;
		var elements = require('elements');
		
		for (var i = 0, il = chain.length; i < il; i++) {
			res = chain[i];
			if (item in res) {
				if (!isParsed(res[item])) {
					switch(name) {
						case 'abbreviations':
							var value = res[item];
							res[item] = parseAbbreviation(item, value);
							res[item].__ref = value;
							break;
						case 'snippets':
							res[item] = elements.create('snippet', res[item]);
							break;
					}
					
					setParsed(res[item]);
				}
				
				result = res[item];
				break;
			}
		}
		
		return result;
	}
	
	/**
	 * Parses single abbreviation
	 * @param {String} key Abbreviation name
	 * @param {String} value Abbreviation value
	 * @return {Object}
	 */
	function parseAbbreviation(key, value) {
		key = require('utils').trim(key);
		var elements = require('elements');
		var m;
		if (m = re_tag.exec(value)) {
			return elements.create('element', m[1], m[2], m[4] == '/');
		} else {
			// assume it's reference to another abbreviation
			return elements.create('reference', value);
		}
	}
	
	return {
		/**
		 * Sets new unparsed data for specified settings vocabulary
		 * @param {Object} data
		 * @param {String} type Vocabulary type ('system' or 'user')
		 * @memberOf zen_coding.resources
		 */
		setVocabulary: function(data, type) {
			if (type == VOC_SYSTEM)
				systemSettings = data;
			else
				userSettings = data;
		},
		
		/**
		 * Get data from specified vocabulary. Can contain parsed entities
		 * @param {String} name Vocabulary type ('system' or 'user')
		 * @return {Object}
		 */
		getVocabulary: getVocabulary,
		
		/**
		 * Returns resource value from data set with respect of inheritance
		 * @param {String} syntax Resource syntax (html, css, ...)
		 * @param {String} name Resource name ('snippets' or 'abbreviation')
		 * @param {String} abbr Abbreviation name
		 * @return {Object}
		 */
		getResource: function(syntax, name, item) {
			return getParsedItem(VOC_USER, syntax, name, item) 
				|| getParsedItem(VOC_SYSTEM, syntax, name, item);
		},
		
		/**
		 * Returns abbreviation value from data set
		 * @param {String} type Resource type (html, css, ...)
		 * @param {String} name Abbreviation name
		 * @return {Object}
		 */
		getAbbreviation: function(type, name) {
			name = name || '';
			return this.getResource(type, 'abbreviations', name) 
				|| this.getResource(type, 'abbreviations', name.replace(/\-/g, ':'));
		},
		
		/**
		 * Returns snippet value from data set
		 * @param {String} type Resource type (html, css, ...)
		 * @param {String} name Snippet name
		 * @return {Object|null}
		 */
		getSnippet: function(type, name) {
			name = name || '';
			return this.getResource(type, 'snippets', name)
				|| this.getResource(type, 'snippets', name.replace(/\-/g, ':'));
		},
		
		/**
		 * Returns resource (abbreviation, snippet, etc.) matched for passed 
		 * abbreviation
		 * @param {TreeNode} node
		 * @param {String} syntax
		 * @returns {Object}
		 */
		getMatchedResource: function(node, syntax) {
			// walk through registered resolvers
			var result = null;
			for (var i = 0, il = resolvers.length; i < il; i++) {
				result = resolvers[i].call(this, node, syntax);
				if (result !== null)
					return result;
			}
			
			return this.getAbbreviation(syntax, node.name) || this.getSnippet(syntax, node.name);
		},
		
		/**
		 * Returns variable value
		 * @return {String}
		 */
		getVariable: function(name) {
			return getSubset(VOC_USER, 'variables', name) 
				|| getSubset(VOC_SYSTEM, 'variables', name);
		},
		
		/**
		 * Store runtime variable in user storage
		 * @param {String} name Variable name
		 * @param {String} value Variable value
		 */
		setVariable: function(name, value){
			var voc = getVocabulary('user') || {};
			if (!('variables' in voc))
				voc.variables = {};
				
			voc.variables[name] = value;
			this.setVocabulary(voc, 'user');
		},
		
		/**
		 * Returns resource subset from settings vocabulary
		 * @param {String} syntax Syntax name
		 * @param {String} name Resource name
		 * @return {Object}
		 */
		getSubset: function(syntax, name) {
			return getSubset(VOC_USER, syntax, name) 
				|| getSubset(VOC_SYSTEM, syntax, name);
		},
		
		/**
		 * Check if specified item exists in specified resource collection
		 * (like 'empty', 'block_level')
		 * @param {String} syntax 
		 * @param {String} collection Collection name
		 * @param {String} item Item name
		 */
		isItemInCollection: function(syntax, collection, item) {
			return item in this.getElementsCollection(getVocabulary(VOC_USER)[syntax], collection)
				|| item in this.getElementsCollection(getVocabulary(VOC_SYSTEM)[syntax], collection);
		},
		
		/**
		 * Returns specified elements collection (like 'empty', 'block_level') from
		 * <code>resource</code>. If collections wasn't found, returns empty object
		 * @param {Object} resource
		 * @param {String} type
		 * @return {Object}
		 */
		getElementsCollection: function(resource, type) {
			if (resource && resource.element_types) {
				// if it's not parsed yet – do it
				var res = resource.element_types;
				if (!isParsed(res)) {
					for (var p in res) 
						res[p] = stringToHash(res[p]);
						
					setParsed(res);
				}
				return res[type] || {};
			}
			else
				return {};
		},
		
		/**
		 * Check if there are resources for specified syntax
		 * @param {String} syntax
		 * @return {Boolean}
		 */
		hasSyntax: function(syntax) {
			return syntax in getVocabulary(VOC_USER) 
				|| syntax in getVocabulary(VOC_SYSTEM);
		},
		
		/**
		 * Registers new abbreviation resolver.
		 * @param {Function} fn Abbreviation resolver which will receive 
		 * abbreviation as first argument and should return parsed abbreviation
		 * object if abbreviation has handled successfully, <code>null</code>
		 * otherwise
		 */
		addResolver: function(fn) {
			if (!_.include(resolvers, fn))
				resolvers.unshift(fn);
		},
		
		removeResolver: function(fn) {
			resolvers = _.without(resolvers, fn);
		}
	};
});

try {
	var res = zen_coding.require('resources');
	res.setVocabulary(zen_settings, 'system');
	res.setVocabulary(my_zen_settings, 'user');
} catch(e) {}/**
 * Module describes and performs Zen Coding actions. The actions themselves are
 * defined in <i>actions</i> folder
 * @param {Function} require
 * @param {Underscore} _
 */
zen_coding.define('actions', function(require, _, zc) {
	var actions = {};
	
	return {
		/**
		 * Registers new action
		 * @param {String} name Action name
		 * @param {Function} fn Action function
		 * @param {String} label Action label. May be used to build menus
		 * @memberOf zen_coding.actions
		 */
		add: function(name, fn, label) {
			name = name.toLowerCase();
			actions[name] = {
				name: name,
				fn: fn,
				label: label
			};
		},
		
		/**
		 * Returns action object
		 * @param {String} name Action name
		 * @returns {Object}
		 */
		get: function(name) {
			return actions[name.toLowerCase()];
		},
		
		/**
		 * Runs Zen Coding action. For list of available actions and their
		 * arguments see <i>actions</i> folder.
		 * @param {String} name Action name 
		 * @param {Array} args Additional arguments. It may be array of arguments
		 * or inline arguments. The first argument should be <code>zen_editor</code> instance
		 * @returns {Boolean} Status of performed operation, <code>true</code>
		 * means action was performed successfully.
		 * @example
		 * zen_coding.require('actions').run('expand_abbreviation', zen_editor);  
		 * zen_coding.require('actions').run('wrap_with_abbreviation', [zen_editor, 'div']);  
		 */
		run: function(name, args) {
			if (!_.isArray(args)) {
				args = _.rest(arguments);
			}
			
			var action = this.get(name);
			if (action) {
				return action.fn.apply(zen_coding, args);
			} else {
				zen_coding.log('Action "%s" is not defined', name);
				return false;
			}
		},
		
		/**
		 * Returns all registered actions as object
		 * @returns {Object}
		 */
		getAll: function() {
			return actions;
		},
		
		/**
		 * Returns all registered actions as array
		 * @returns {Array}
		 */
		getList: function() {
			return _.values(this.getAll());
		}
	};
});/**
 * Output profile module.
 * Profile defines how XHTML output data should look like
 * @param {Function} require
 * @param {Underscore} _
 */
zen_coding.define('profile', function(require, _) {
	var profiles = {};
	
	var defaultProfile = {
		tag_case: 'lower',
		attr_case: 'lower',
		attr_quotes: 'double',
		
		// each tag on new line
		tag_nl: 'decide',
		
		place_cursor: true,
		
		// indent tags
		indent: true,
		
		// how many inline elements should be to force line break 
		// (set to 0 to disable)
		inline_break: 3,
		
		// use self-closing style for writing empty elements, e.g. <br /> or <br>
		self_closing_tag: 'xhtml',
		
		// Profile-level output filters, re-defines syntax filters 
		filters: ''
	};
	
	/**
	 * Creates new output profile
	 * @param {String} name Profile name
	 * @param {Object} options Profile options
	 */
	function createProfile(name, options) {
		return profiles[name.toLowerCase()] = _.defaults(options || {}, defaultProfile);
	}
	
	// create default profiles
	createProfile('xhtml');
	createProfile('html', {self_closing_tag: false});
	createProfile('xml', {self_closing_tag: true, tag_nl: true});
	createProfile('plain', {tag_nl: false, indent: false, place_cursor: false});
	
	return  {
		/**
		 * Creates new output profile and adds it into internal dictionary
		 * @param {String} name Profile name
		 * @param {Object} options Profile options
		 * @memberOf zen_coding.profile
		 * @returns {Object} New profile
		 */
		create: function(name, options) {
			return createProfile(name, options);
		},
		
		/**
		 * Returns profile by its name. If profile wasn't found, returns
		 * 'plain' profile
		 * @param {String} name Profile name. Might be profile itself
		 * @returns {Object}
		 */
		get: function(name) {
			if (_.isString(name) && name.toLowerCase() in profiles)
				return profiles[name.toLowerCase()];
				
			return name && 'tag_case' in name ? name : profiles['plain'];
		},
		
		/**
		 * Deletes profile with specified name
		 * @param {String} name Profile name
		 */
		remove: function(name) {
			name = (name || '').toLowerCase();
			if (name in profiles)
				delete profiles[name];
		}
	};
});/**
 * Module used to transform parsed abbreviation tree into a final 
 * <code>ZenNode</code> tree that will be used for output
 * @param {Function} require
 * @param {Underscore} _
 * @author Sergey Chikuyonok (serge.che@gmail.com) <http://chikuyonok.ru>
 */
zen_coding.define('transform', function(require, _) {
	/**
	 * Resolves abbreviation node into parsed data
	 * @param {TreeNode} node
	 * @param {String} syntax
	 * @returns {ParsedElement}
	 */
	function resolveNode(node, syntax) {
		if (node.isEmpty()) return null;
		
		var result = require('resources').getMatchedResource(node, syntax);
		/** @type zen_coding.elements */
		var elements = require('elements');
		
		var test = function(elem) {
			if (_.isString(elem) || elements.is(elem, 'snippet'))
				return elements.create('parsedSnippet', node, syntax, elem);
			if (elements.is(elem, 'element'))
				return elements.create('parsedElement', node, syntax, elem);
			if (elements.is(elem, 'ZenNode'))
				throw '"ZenNode" is internal class and should not be used by resolvers';
			if (elements.is(elem, 'parsedElement') || elements.is(elem, 'parsedSnippet') || elements.is(elem, 'empty'))
				return elem;
			
			return null;
		};
		
		if (_.isArray(result)) {
			// received a set of elements, make sure it contains valid elements only
			result = _.map(result, function(elem) {
				var data = test(elem);
				if (!data)
					throw 'Elements list contains unparsed data';
				
				return data;
			});
			
			return result;
		}
		
		return test(result) || elements.create('parsedElement', node, syntax);
	}
	
	/**
	 * Process single tree node: expand it and its children 
	 * @param {TreeNode} node
	 * @param {String} syntax
	 * @param {ParsedElement} parent
	 */
	function parseNodes(node, syntax, parent) {
		var resolvedData = resolveNode(node, syntax);
		/** @type zen_coding.elements */
		var elements = require('elements');
		
		if (!resolvedData) 
			return;
		
		_.each(_.isArray(resolvedData) ? resolvedData : [resolvedData], function(item) {
			if (elements.is(item, 'empty')) // skip empty elements
				return;
			
			parent.addChild(item);
			
			// set repeating element to the topmost node
			var root = parent;
			while (root.parent)
				root = root.parent;
			
			root.last = item;
			if (item.repeat_by_lines)
				root.multiply_elem = item;
				
			// process child groups
			_.each(node.children, function(child) {
				parseNodes(child, syntax, item);
			});
		});
	}
	
	return  {
		/**
		 * Transforms parsed abbreviation tree into final output tree 
		 * @param {TreeNode} abbrTree Parsed abbreviation, returned by 
		 * <code>zen_parser.parse</code>
		 * @param {String} syntax
		 * @param {TreeNode} contextNode Contextual node (XHTML under current 
		 * caret position), for better abbreviation expansion
		 * @returns {ZenNode}
		 * @memberOf zen_coding.transform
		 */
		transform: function(abbrTree, syntax, contextNode) {
			return this.rolloutTree(this.createParsedTree(abbrTree, syntax, contextNode));
		},
		
		/**
		 * Transforms abbreviation tree into parsed elements tree.
		 * The parsed tree consists for resolved elements and snippets, defined 
		 * in <code>zen_settings</code> file mostly. This is an intermediate tree
		 * structure that can be used to produce final output tree.
		 * @param {TreeNode} abbrTree Parsed abbreviation of string abbreviation
		 * @param {String} syntax
		 * @param {TreeNode} contextNode Contextual node (XHTML under current 
		 * caret position), for better abbreviation expansion
		 * @returns {ZenNode}
		 * @returns {ParsedElement}
		 */
		createParsedTree: function(abbrTree, syntax, contextNode) {
			var elems = require('elements');
			var parser = require('parser');
			
			/** @type ParsedElement */
			var treeRoot = elems.create('parsedElement', contextNode || {}, syntax);
			if (_.isString(abbrTree))
				abbrTree = parser.parse(abbrTree);
			
			if (!abbrTree)
				return null;
			abbrTree = parser.optimizeTree(abbrTree);
			
			// recursively expand each group item
			_.each(abbrTree.children, function(child) {
				parseNodes(child, syntax, treeRoot);
			});
			
			return treeRoot;
		},

		/**
		 * Resolves abbreviation node into parsed data
		 * @param {TreeNode} node
		 * @param {String} syntax
		 * @returns {ParsedElement}
		 */
		resolve: function(node, syntax) {
			return resolveNode(node, syntax);
		},
		
		/**
		 * Roll outs basic Zen Coding tree into simplified, DOM-like tree.
		 * The simplified tree, for example, represents each multiplied element 
		 * as a separate element sets with its own content, if exists.
		 * 
		 * The simplified tree element contains some meta info (tag name, attributes, 
		 * etc.) as well as output strings, which are exactly what will be outputted
		 * after expanding abbreviation. This tree is used for <i>filtering</i>:
		 * you can apply filters that will alter output strings to get desired look
		 * of expanded abbreviation.
		 * 
		 * @param {ParsedElement} tree
		 * @param {ZenNode} parent
		 */
		rolloutTree: function(tree, parent) {
			var elements = require('elements');
			var utils = require('utils');
			var howMany = 1;
			var tagContent = '';
			
			parent = parent || elements.create('ZenNode', tree);
			_.each(tree.children, function(child) {
				howMany = child.count;
				
				if (child.repeat_by_lines) {
					// it's a repeating element
					tagContent = utils.splitByLines(child.getPasteContent(), true);
					howMany = Math.max(tagContent.length, 1);
				} else {
					tagContent = child.getPasteContent();
				}
				
				for (var j = 0; j < howMany; j++) {
					var elem = elements.create('ZenNode', child);
					parent.addChild(elem);
					elem.counter = j + 1;
					
					if (child.hasChildren())
						this.rolloutTree(child, elem);
						
					if (tagContent) {
						var text = _.isString(tagContent) ? tagContent : tagContent[j];
						elem.pasteContent(utils.trim(text || ''));
					}
				}
			}, this);
			
			return parent;
		}
	};
});/**
 * Utility module used to prepare text for pasting into back-end editor
 * @param {Function} require
 * @param {Underscore} _
 * @author Sergey Chikuyonok (serge.che@gmail.com) <http://chikuyonok.ru>
 */
zen_coding.define('editorUtils', function(require, _) {
	return  {
		/**
		 * Returns context-aware node counter
		 * @param {node} ZenNode
		 * @return {Number}
		 * @memberOf zen_coding.editorUtils
		 */
		getCounterForNode: function(node) {
			// find nearest repeating parent
			var counter = node.counter;
			if (!node.is_repeating && !node.repeat_by_lines) {
				while (node = node.parent) {
					if (node.is_repeating || node.repeat_by_lines)
						return node.counter;
				}
			}
			
			return counter;
		},
		
		/**
		 * Process text that should be pasted into editor: clear escaped text and
		 * handle tabstops
		 * @param {String} text
		 * @param {Function} escapeFn Handle escaped character. Must return
		 * replaced value
		 * @param {Function} tabstopFn Callback function that will be called on every
		 * tabstob occurrence, passing <b>index</b>, <code>number</code> and 
		 * <b>value</b> (if exists) arguments. This function must return 
		 * replacement value
		 * @return {String} 
		 */
		processTextBeforePaste: function(text, escapeFn, tabstopFn) {
			var i = 0, il = text.length, startIx, _i;
			var strBuilder = [];
				
			var nextWhile = function(ix, fn) {
				while (ix < il) if (!fn(text.charAt(ix++))) break;
				return ix - 1;
			};
			
			var utils = require('utils');
			
			while (i < il) {
				var ch = text.charAt(i);
				if (ch == '\\' && i + 1 < il) {
					// handle escaped character
					strBuilder.push(escapeFn(text.charAt(i + 1)));
					i += 2;
					continue;
				} else if (ch == '$') {
					// looks like a tabstop
					var next_ch = text.charAt(i + 1) || '';
					_i = i;
					if (utils.isNumeric(next_ch)) {
						// $N placeholder
						startIx = i + 1;
						i = nextWhile(startIx, utils.isNumeric);
						if (startIx < i) {
							strBuilder.push(tabstopFn(_i, text.substring(startIx, i)));
							continue;
						}
					} else if (next_ch == '{') {
						// ${N:value} or ${N} placeholder
						var braceCount = 1;
						startIx = i + 2;
						i = nextWhile(startIx, utils.isNumeric);
						
						if (i > startIx) {
							if (text.charAt(i) == '}') {
								strBuilder.push(tabstopFn(_i, text.substring(startIx, i)));
								i++; // handle closing brace
								continue;
							} else if (text.charAt(i) == ':') {
								var valStart = i + 2;
								i = nextWhile(valStart, function(c) {
									if (c == '{') braceCount++;
									else if (c == '}') braceCount--;
									return !!braceCount;
								});
								strBuilder.push(tabstopFn(_i, text.substring(startIx, valStart - 2), text.substring(valStart - 1, i)));
								i++; // handle closing brace
								continue;
							}
						}
					}
					i = _i;
				}
				
				// push current character to stack
				strBuilder.push(ch);
				i++;
			}
			
			return strBuilder.join('');
		},
		
		/**
		 * Upgrades tabstops in zen node in order to prevent naming conflicts
		 * @param {ZenNode} node
		 * @param {Number} offset Tab index offset
		 * @returns {Number} Maximum tabstop index in element
		 */
		upgradeTabstops: function(node, offset) {
			var maxNum = 0;
			var escapeFn = function(ch){ return '\\' + ch; };
			var tabstopFn = function(i, num, value) {
				num = parseInt(num);
				if (num > maxNum) maxNum = num;
					
				if (value)
					return '${' + (num + offset) + ':' + value + '}';
				else
					return '$' + (num + offset);
			};
			
			_.each(['start', 'end', 'content'], function(p) {
				node[p] = this.processTextBeforePaste(node[p], escapeFn, tabstopFn);
			}, this);
			
			return maxNum;
		},
		
		/**
		 * Check if cursor is placed inside XHTML tag
		 * @param {String} html Contents of the document
		 * @param {Number} caretPos Current caret position inside tag
		 * @return {Boolean}
		 */
		isInsideTag: function(html, caretPos) {
			var reTag = /^<\/?\w[\w\:\-]*.*?>/;
			
			// search left to find opening brace
			var pos = caretPos;
			while (pos > -1) {
				if (html.charAt(pos) == '<') 
					break;
				pos--;
			}
			
			if (pos != -1) {
				var m = reTag.exec(html.substring(pos));
				if (m && caretPos > pos && caretPos < pos + m[0].length)
					return true;
			}
			
			return false;
		},
		
		/**
		 * Sanitizes incoming editor data and provides default values for
		 * output-specific info
		 * @param {IZenEditor} editor
		 * @param {String} syntax
		 * @param {String} profile
		 */
		outputInfo: function(editor, syntax, profile) {
			return  {
				/** @memberOf outputInfo */
				syntax: String(syntax || editor.getSyntax()),
				profile: String(profile || editor.getProfileName()),
				content: String(editor.getContent())
			};
		},
		
		/**
		 * Unindent content, thus preparing text for tag wrapping
		 * @param {IZenEditor} editor Editor instance
		 * @param {String} text
		 * @return {String}
		 */
		unindent: function(editor, text) {
			return require('utils').unindentString(text, require('editorUtils').getCurrentLinePadding(editor));
		},
		
		/**
		 * Returns padding of current editor's line
		 * @param {IZenEditor} Editor instance
		 * @return {String}
		 */
		getCurrentLinePadding: function(editor) {
			return require('utils').getLinePadding(editor.getCurrentLine());
		},
		
		/**
		 * Narrow down text indexes, adjusting selection to non-space characters
		 * @param {String} text
		 * @param {Number} start
		 * @param {Number} end
		 * @return {Array}
		 */
		narrowToNonSpace: function(text, start, end) {
			// narrow down selection until first non-space character
			var reSpace = /\s|\n|\r/;
			var isSpace = function(ch) {
				return reSpace.test(ch);
			};
			
			while (start < end) {
				if (!isSpace(text.charAt(start)))
					break;
					
				start++;
			}
			
			while (end > start) {
				end--;
				if (!isSpace(text.charAt(end))) {
					end++;
					break;
				}
			}
			
			return [start, end];
		}
	};
});
/**
 * Utility methods for Zen Coding actions
 * @param {Function} require
 * @param {Underscore} _
 * @author Sergey Chikuyonok (serge.che@gmail.com) <http://chikuyonok.ru>
 */
zen_coding.define('actionUtils', function(require, _) {
	return {
		mimeTypes: {
			'gif' : 'image/gif',
			'png' : 'image/png',
			'jpg' : 'image/jpeg',
			'jpeg': 'image/jpeg',
			'svg' : 'image/svg+xml',
			'html': 'text/html',
			'htm' : 'text/html'
		},
		
		/**
		 * Extracts abbreviations from text stream, starting from the end
		 * @param {String} str
		 * @return {String} Abbreviation or empty string
		 * @memberOf zen_coding.actionUtils
		 */
		extractAbbreviation: function(str) {
			var curOffset = str.length;
			var startIndex = -1;
			var groupCount = 0;
			var braceCount = 0;
			var textCount = 0;
			
			var utils = require('utils');
			
			while (true) {
				curOffset--;
				if (curOffset < 0) {
					// moved to the beginning of the line
					startIndex = 0;
					break;
				}
				
				var ch = str.charAt(curOffset);
				
				if (ch == ']') {
					braceCount++;
				} else if (ch == '[') {
					if (!braceCount) { // unexpected brace
						startIndex = curOffset + 1;
						break;
					}
					braceCount--;
				} else if (ch == '}') {
					textCount++;
				} else if (ch == '{') {
					if (!textCount) { // unexpected brace
						startIndex = curOffset + 1;
						break;
					}
					textCount--;
				} else if (ch == ')') {
					groupCount++;
				} else if (ch == '(') {
					if (!groupCount) { // unexpected brace
						startIndex = curOffset + 1;
						break;
					}
					groupCount--;
				} else {
					if (braceCount || textCount) 
						// respect all characters inside attribute sets or text nodes
						continue;
					else if (!utils.isAllowedChar(ch) || (ch == '>' && utils.endsWithTag(str.substring(0, curOffset + 1)))) {
						// found stop symbol
						startIndex = curOffset + 1;
						break;
					}
				}
			}
			
			if (startIndex != -1 && !textCount && !braceCount && !groupCount) 
				// found something, return abbreviation
				return str.substring(startIndex);
			else
				return '';
		},
		
		/**
		 * Gets image size from image byte stream.
		 * @author http://romeda.org/rePublish/
		 * @param {String} stream Image byte stream (use <code>zen_file.read()</code>)
		 * @return {Object} Object with <code>width</code> and <code>height</code> properties
		 */
		getImageSize: function(stream) {
			var pngMagicNum = "\211PNG\r\n\032\n",
				jpgMagicNum = "\377\330",
				gifMagicNum = "GIF8",
				nextByte = function() {
					return stream.charCodeAt(pos++);
				};
		
			if (stream.substr(0, 8) === pngMagicNum) {
				// PNG. Easy peasy.
				var pos = stream.indexOf('IHDR') + 4;
			
				return { width:  (nextByte() << 24) | (nextByte() << 16) |
								 (nextByte() <<  8) | nextByte(),
						 height: (nextByte() << 24) | (nextByte() << 16) |
								 (nextByte() <<  8) | nextByte() };
			
			} else if (stream.substr(0, 4) === gifMagicNum) {
				pos = 6;
			
				return {
					width:  nextByte() | (nextByte() << 8),
					height: nextByte() | (nextByte() << 8)
				};
			
			} else if (stream.substr(0, 2) === jpgMagicNum) {
				pos = 2;
			
				var l = stream.length;
				while (pos < l) {
					if (nextByte() != 0xFF) return;
				
					var marker = nextByte();
					if (marker == 0xDA) break;
				
					var size = (nextByte() << 8) | nextByte();
				
					if (marker >= 0xC0 && marker <= 0xCF && !(marker & 0x4) && !(marker & 0x8)) {
						pos += 1;
						return { height:  (nextByte() << 8) | nextByte(),
								 width: (nextByte() << 8) | nextByte() };
				
					} else {
						pos += size - 2;
					}
				}
			}
		},
		
		/**
		 * Captures context XHTML element from editor under current caret position.
		 * This node can be used as a helper for abbreviation extraction
		 * @param {IZenEditor} editor
		 * @returns {TreeNode}
		 */
		captureContext: function(editor) {
			var allowedSyntaxes = {'html': 1, 'xml': 1, 'xsl': 1};
			var syntax = String(editor.getSyntax());
			if (syntax in allowedSyntaxes) {
				var tags = require('html_matcher').getTags(
						String(editor.getContent()), 
						editor.getCaretPos(), 
						String(editor.getProfileName()));
				
				if (tags && tags[0] && tags[0].type == 'tag') {
					var reAttr = /([\w\-:]+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g;
					var startTag = tags[0];
					var tagAttrs = startTag.full_tag.replace(/^<[\w\-\:]+/, '');
					var parser = require('parser');
					/** @type TreeNode */
					var contextNode = new parser.TreeNode;
					contextNode.name = startTag.name;
					
					// parse attributes
					var m;
					while (m = reAttr.exec(tagAttrs)) {
						contextNode.attributes.push({
							name: m[1],
							value: m[2]
						});
					}
					
					return contextNode;
				}
			}
			
			return null;
		},
		
		/**
		 * Returns line bounds for specific character position
		 * @param {String} text
		 * @param {Number} from Where to start searching
		 * @return {Object}
		 */
		getLineBounds: function(text, from) {
			var len = text.length,
				start = 0,
				end = len - 1;
			
			// search left
			for (var i = from - 1; i > 0; i--) {
				var ch = text.charAt(i);
				if (ch == '\n' || ch == '\r') {
					start = i + 1;
					break;
				}
			}
			// search right
			for (var j = from; j < len; j++) {
				var ch = text.charAt(j);
				if (ch == '\n' || ch == '\r') {
					end = j;
					break;
				}
			}
			
			return {start: start, end: end};
		},
		
		/**
		 * Find expression bounds in current editor at caret position. 
		 * On each character a <code>fn</code> function will be caller which must 
		 * return <code>true</code> if current character meets requirements, 
		 * <code>false</code> otherwise
		 * @param {zen_editor} editor
		 * @param {Function} fn Function to test each character of expression
		 * @return {Array} If expression found, returns array with start and end 
		 * positions 
		 */
		findExpressionBounds: function(editor, fn) {
			var content = String(editor.getContent());
			var il = content.length;
			var exprStart = editor.getCaretPos() - 1;
			var exprEnd = exprStart + 1;
				
			// start by searching left
			while (exprStart >= 0 && fn(content.charAt(exprStart), exprStart, content)) exprStart--;
			
			// then search right
			while (exprEnd < il && fn(content.charAt(exprEnd), exprEnd, content)) exprEnd++;
			
			return exprEnd > exprStart ? [++exprStart, exprEnd] : null;
		},
		
		/**
		 * Make decimal number look good: convert it to fixed precision end remove
		 * trailing zeroes 
		 * @param {Number} num
		 * @param {Number} fraction Fraction numbers (default is 2)
		 * @return {String}
		 */
		prettifyNumber: function(num, fraction) {
			return num.toFixed(typeof fraction == 'undefined' ? 2 : fraction).replace(/\.?0+$/, '');
		},
		
		/**
		 * @param {IZenEditor} editor
		 * @param {Object} data
		 * @returns {Boolean}
		 */
		compoundUpdate: function(editor, data) {
			if (data) {
				var sel = editor.getSelectionRange();
				editor.replaceContent(data.data, data.start, data.end, true);
				editor.createSelection(data.caret, data.caret + sel.end - sel.start);
				return true;
			}
			
			return false;
		},
		
		/**
		 * Replaces or adds attribute to the tag
		 * @param {String} tag
		 * @param {String} attr_name
		 * @param {String} attr_value
		 */
		replaceOrAppendHTMLAttribute: function(tag, attrName, attrValue) {
			if (tag.toLowerCase().indexOf(attrName) != -1) {
				// attribute exists
				var re = new RegExp(attrName + '=([\'"])(.*?)([\'"])', 'i');
				return tag.replace(re, function(str, p1, p2){
					return attrName + '=' + p1 + attrValue + p1;
				});
			} else {
				return tag.replace(/\s*(\/?>)$/, ' ' + attrName + '="' + attrValue + '" $1');
			}
		}
	};
});/**
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 */
zen_coding.define('base64', function(require, _) {
	var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
	
	return {
		/**
		 * Encodes data using base64 algorithm
		 * @author Tyler Akins (http://rumkin.com)
		 * @param {String} input
		 * @returns {String}
		 * @memberOf zen_coding.base64
		 */
		encode : function(input) {
			var output = [];
			var chr1, chr2, chr3, enc1, enc2, enc3, enc4, cdp1, cdp2, cdp3;
			var i = 0, il = input.length, b64 = chars;

			while (i < il) {

				cdp1 = input.charCodeAt(i++);
				cdp2 = input.charCodeAt(i++);
				cdp3 = input.charCodeAt(i++);

				chr1 = cdp1 & 0xff;
				chr2 = cdp2 & 0xff;
				chr3 = cdp3 & 0xff;

				enc1 = chr1 >> 2;
				enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
				enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
				enc4 = chr3 & 63;

				if (isNaN(cdp2)) {
					enc3 = enc4 = 64;
				} else if (isNaN(cdp3)) {
					enc4 = 64;
				}

				output.push(b64.charAt(enc1) + b64.charAt(enc2) + b64.charAt(enc3) + b64.charAt(enc4));
			}

			return output.join('');
		},

		/**
		 * Decodes string using MIME base64 algorithm
		 * 
		 * @author Tyler Akins (http://rumkin.com)
		 * @param {String} data
		 * @return {String}
		 */
		decode : function(data) {
			var o1, o2, o3, h1, h2, h3, h4, bits, i = 0, ac = 0, dec = "", tmpArr = [];
			var b64 = chars, il = data.length;

			if (!data) {
				return data;
			}

			data += '';

			do { // unpack four hexets into three octets using index points in b64
				h1 = b64.indexOf(data.charAt(i++));
				h2 = b64.indexOf(data.charAt(i++));
				h3 = b64.indexOf(data.charAt(i++));
				h4 = b64.indexOf(data.charAt(i++));

				bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;

				o1 = bits >> 16 & 0xff;
				o2 = bits >> 8 & 0xff;
				o3 = bits & 0xff;

				if (h3 == 64) {
					tmpArr[ac++] = String.fromCharCode(o1);
				} else if (h4 == 64) {
					tmpArr[ac++] = String.fromCharCode(o1, o2);
				} else {
					tmpArr[ac++] = String.fromCharCode(o1, o2, o3);
				}
			} while (i < il);

			return tmpArr.join('');
		}
	};
});/**
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 */(function(){
	// Regular Expressions for parsing tags and attributes
	var start_tag = /^<([\w\:\-]+)((?:\s+[\w\-:]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/,
		end_tag = /^<\/([\w\:\-]+)[^>]*>/,
		attr = /([\w\-:]+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g;
		
	// Empty Elements - HTML 4.01
	var empty = makeMap("area,base,basefont,br,col,frame,hr,img,input,isindex,link,meta,param,embed");

	// Block Elements - HTML 4.01
	var block = makeMap("address,applet,blockquote,button,center,dd,dir,div,dl,dt,fieldset,form,frameset,hr,iframe,isindex,li,map,menu,noframes,noscript,object,ol,p,pre,script,table,tbody,td,tfoot,th,thead,tr,ul");

	// Inline Elements - HTML 4.01
	var inline = makeMap("a,abbr,acronym,applet,b,basefont,bdo,big,br,button,cite,code,del,dfn,em,font,i,iframe,img,input,ins,kbd,label,map,object,q,s,samp,select,small,span,strike,strong,sub,sup,textarea,tt,u,var");

	// Elements that you can, intentionally, leave open
	// (and which close themselves)
	var close_self = makeMap("colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr");
	
	/** Current matching mode */
	var cur_mode = 'xhtml';
	
	/** Last matched HTML pair */
	var last_match = {
		opening_tag: null, // tag() or comment() object
		closing_tag: null, // tag() or comment() object
		start_ix: -1,
		end_ix: -1
	};
	
	function setMode(new_mode) {
		if (!new_mode || new_mode != 'html')
			new_mode = 'xhtml';
			
		cur_mode = new_mode;
	}
	
	function tag(match, ix) {
		var name = match[1].toLowerCase();
		return  {
			name: name,
			full_tag: match[0],
			start: ix,
			end: ix + match[0].length,
			unary: Boolean(match[3]) || (name in empty && cur_mode == 'html'),
			has_close: Boolean(match[3]),
			type: 'tag',
			close_self: (name in close_self && cur_mode == 'html')
		};
	}
	
	function comment(start, end) {
		return {
			start: start,
			end: end,
			type: 'comment'
		};
	}
	
	function makeMap(str){
		var obj = {}, items = str.split(",");
		for ( var i = 0; i < items.length; i++ )
			obj[ items[i] ] = true;
		return obj;
	}
	
	/**
	 * Makes selection ranges for matched tag pair
	 * @param {tag} opening_tag
	 * @param {tag} closing_tag
	 * @param {Number} ix
	 */
	function makeRange(opening_tag, closing_tag, ix) {
		ix = ix || 0;
		
		var start_ix = -1, 
			end_ix = -1;
		
		if (opening_tag && !closing_tag) { // unary element
			start_ix = opening_tag.start;
			end_ix = opening_tag.end;
		} else if (opening_tag && closing_tag) { // complete element
			if (
				(opening_tag.start < ix && opening_tag.end > ix) || 
				(closing_tag.start <= ix && closing_tag.end > ix)
			) {
				start_ix = opening_tag.start;
				end_ix = closing_tag.end;
			} else {
				start_ix = opening_tag.end;
				end_ix = closing_tag.start;
			}
		}
		
		return [start_ix, end_ix];
	}
	
	/**
	 * Save matched tag for later use and return found indexes
	 * @param {tag} opening_tag
	 * @param {tag} closing_tag
	 * @param {Number} ix
	 * @return {Array}
	 */
	function saveMatch(opening_tag, closing_tag, ix) {
		ix = ix || 0;
		last_match.opening_tag = opening_tag; 
		last_match.closing_tag = closing_tag;
		
		var range = makeRange(opening_tag, closing_tag, ix);
		last_match.start_ix = range[0];
		last_match.end_ix = range[1];
		
		return last_match.start_ix != -1 ? [last_match.start_ix, last_match.end_ix] : null;
	}
	
	/**
	 * Handle unary tag: find closing tag if needed
	 * @param {String} text
	 * @param {Number} ix
	 * @param {tag} open_tag
	 * @return {tag|null} Closing tag (or null if not found) 
	 */
	function handleUnaryTag(text, ix, open_tag) {
		if (open_tag.has_close)
			return null;
		else {
			// TODO finish this method
		}
	}
	
	/**
	 * Search for matching tags in <code>html</code>, starting from 
	 * <code>start_ix</code> position
	 * @param {String} html Code to search
	 * @param {Number} start_ix Character index where to start searching pair 
	 * (commonly, current caret position)
	 * @param {Function} action Function that creates selection range
	 * @return {Array|null}
	 */
	function findPair(html, start_ix, mode, action) {
		action = action || makeRange;
		setMode(mode);
		
		var forward_stack = [],
			backward_stack = [],
			/** @type {tag()} */
			opening_tag = null,
			/** @type {tag()} */
			closing_tag = null,
			range = null,
			html_len = html.length,
			m,
			ix,
			tmp_tag;
			
		forward_stack.last = backward_stack.last = function() {
			return this[this.length - 1];
		};
		
		function hasMatch(str, start) {
			if (arguments.length == 1)
				start = ix;
			return html.substr(start, str.length) == str;
		}
		
		function searchCommentStart(from) {
			while (from--) {
				if (html.charAt(from) == '<' && hasMatch('<!--', from))
					break;
			}
			
			return from;
		}
		
		// find opening tag
		ix = start_ix;
		while (ix-- && ix >= 0) {
			var ch = html.charAt(ix);
			if (ch == '<') {
				var check_str = html.substring(ix, html_len);
				
				if ( (m = check_str.match(end_tag)) ) { // found closing tag
					tmp_tag = tag(m, ix);
					if (tmp_tag.start < start_ix && tmp_tag.end > start_ix) // direct hit on searched closing tag
						closing_tag = tmp_tag;
					else
						backward_stack.push(tmp_tag);
				} else if ( (m = check_str.match(start_tag)) ) { // found opening tag
					tmp_tag = tag(m, ix);
					
					if (tmp_tag.unary) {
						if (tmp_tag.start < start_ix && tmp_tag.end > start_ix) // exact match
							// TODO handle unary tag 
							return action(tmp_tag, null, start_ix);
					} else if (backward_stack.last() && backward_stack.last().name == tmp_tag.name) {
						backward_stack.pop();
					} else { // found nearest unclosed tag
						opening_tag = tmp_tag;
						break;
					}
				} else if (check_str.indexOf('<!--') == 0) { // found comment start
					var end_ix = check_str.search('-->') + ix + 3;
					if (ix < start_ix && end_ix >= start_ix)
						return action( comment(ix, end_ix) );
				}
			} else if (ch == '-' && hasMatch('-->')) { // found comment end
				// search left until comment start is reached
				ix = searchCommentStart(ix);
			}
		}
		
		if (!opening_tag)
			return action(null);
		
		// find closing tag
		if (!closing_tag) {
			for (ix = start_ix; ix < html_len; ix++) {
				var ch = html.charAt(ix);
				if (ch == '<') {
					var check_str = html.substring(ix, html_len);
					
					if ( (m = check_str.match(start_tag)) ) { // found opening tag
						tmp_tag = tag(m, ix);
						if (!tmp_tag.unary)
							forward_stack.push( tmp_tag );
					} else if ( (m = check_str.match(end_tag)) ) { // found closing tag
						var tmp_tag = tag(m, ix);
						if (forward_stack.last() && forward_stack.last().name == tmp_tag.name)
							forward_stack.pop();
						else { // found matched closing tag
							closing_tag = tmp_tag;
							break;
						}
					} else if (hasMatch('<!--')) { // found comment
						ix += check_str.search('-->') + 2;
					}
				} else if (ch == '-' && hasMatch('-->')) {
					// looks like cursor was inside comment with invalid HTML
					if (!forward_stack.last() || forward_stack.last().type != 'comment') {
						var end_ix = ix + 3;
						return action(comment( searchCommentStart(ix), end_ix ));
					}
				}
			}
		}
		
		return action(opening_tag, closing_tag, start_ix);
	}
	
	/**
	 * Search for matching tags in <code>html</code>, starting 
	 * from <code>start_ix</code> position. The result is automatically saved in 
	 * <code>last_match</code> property
	 * 
	 * @return {Array|null}
	 */
	var HTMLPairMatcher = function(/* String */ html, /* Number */ start_ix, /*  */ mode){
		return findPair(html, start_ix, mode, saveMatch);
	};
	
	HTMLPairMatcher.start_tag = start_tag;
	HTMLPairMatcher.end_tag = end_tag;
	
	/**
	 * Search for matching tags in <code>html</code>, starting from 
	 * <code>start_ix</code> position. The difference between 
	 * <code>HTMLPairMatcher</code> function itself is that <code>find</code> 
	 * method doesn't save matched result in <code>last_match</code> property.
	 * This method is generally used for lookups 
	 */
	HTMLPairMatcher.find = function(html, start_ix, mode) {
		return findPair(html, start_ix, mode);
	};
	
	/**
	 * Search for matching tags in <code>html</code>, starting from 
	 * <code>start_ix</code> position. The difference between 
	 * <code>HTMLPairMatcher</code> function itself is that <code>getTags</code> 
	 * method doesn't save matched result in <code>last_match</code> property 
	 * and returns array of opening and closing tags
	 * This method is generally used for lookups 
	 */
	HTMLPairMatcher.getTags = function(html, start_ix, mode) {
		return findPair(html, start_ix, mode, function(opening_tag, closing_tag){
			return [opening_tag, closing_tag];
		});
	};
	
	HTMLPairMatcher.last_match = last_match;
	
	try {
		zen_coding.define('html_matcher', function() {
			return HTMLPairMatcher;
		});
	} catch(e){}
	
})();/**
 * Module for handling filters
 * @param {Function} require
 * @param {Underscore} _
 * @author Sergey Chikuyonok (serge.che@gmail.com) <http://chikuyonok.ru>
 */
zen_coding.define('filters', function(require, _) {
	/** List of registered filters */
	var registeredFilters = {};
	
	/** Filters that will be applied for unknown syntax */
	var basicFilters = 'html';
	
	function list(filters) {
		if (!filters)
			return [];
		
		if (_.isString(filters))
			return filters.split(/[\|,]/g);
		
		return filters;
	}
	
	return  {
		/**
		 * Register new filter
		 * @param {String} name Filter name
		 * @param {Function} fn Filter function
		 */
		add: function(name, fn) {
			registeredFilters[name] = fn;
		},
		
		/**
		 * Apply filters for final output tree
		 * @param {ZenNode} tree Output tree
		 * @param {Array} filters List of filters to apply. Might be a 
		 * <code>String</code>
		 * @param {Object} profile Output profile, defined in <i>profile</i> 
		 * module. Filters defined it profile are not used, <code>profile</code>
		 * is passed to filter function
		 * @memberOf zen_coding.filters
		 * @returns {ZenNode}
		 */
		apply: function(tree, filters, profile) {
			var utils = require('utils');
			profile = require('profile').get(profile);
			
			_.each(list(filters), function(filter) {
				var name = utils.trim(filter.toLowerCase());
				if (name && name in registeredFilters) {
					tree = registeredFilters[name](tree, profile);
				}
			});
			
			return tree;
		},
		
		/**
		 * Composes list of filters that should be applied to a tree, based on 
		 * passed data
		 * @param {String} syntax Syntax name ('html', 'css', etc.)
		 * @param {Object} profile Output profile
		 * @param {String} additionalFilters List or pipe-separated
		 * string of additional filters to apply
		 * @returns {Array}
		 */
		composeList: function(syntax, profile, additionalFilters) {
			profile = require('profile').get(profile);
			var filters = list(profile.filters || require('resources').getSubset(syntax, 'filters') || basicFilters);
				
			if (additionalFilters)
				filters = filters.concat(list(additionalFilters));
				
			if (!filters || !filters.length)
				// looks like unknown syntax, apply basic filters
				filters = list(basicFilters);
				
			return filters;
		},
		
		/**
		 * Extracts filter list from abbreviation
		 * @param {String} abbr
		 * @returns {Array} Array with cleaned abbreviation and list of 
		 * extracted filters
		 */
		extractFromAbbreviation: function(abbr) {
			var filters = '';
			abbr = abbr.replace(/\|([\w\|\-]+)$/, function(str, p1){
				filters = p1;
				return '';
			});
			
			return [abbr, list(filters)];
		}
	};
});/**
 * Module that contains factories for element types used by Zen Coding
 * @param {Function} require
 * @param {Underscore} _
 */
zen_coding.define('elements', function(require, _) {
	var factories = {};
	var reAttrs = /([\w\-]+)\s*=\s*(['"])(.*?)\2/g;
	
	var result = {
		/**
		 * Create new element factory
		 * @param {String} name Element identifier
		 * @param {Function} factory Function that produces element of specified 
		 * type. The object generated by this factory is automatically 
		 * augumented with <code>type</code> property pointing to element
		 * <code>name</code>
		 * @memberOf zen_coding.elements
		 */
		add: function(name, factory) {
			var that = this;
			factories[name] = function() {
				var elem = factory.apply(that, arguments);
				if (elem)
					elem.type = name;
				
				return elem;
			};
		},
		
		/**
		 * Returns factory for specified name
		 * @param {String} name
		 * @returns {Function}
		 */
		get: function(name) {
			return factories[name];
		},
		
		/**
		 * Creates new element with specified type
		 * @param {String} name
		 * @returns {Object}
		 */
		create: function(name) {
			var args = [].slice.call(arguments, 1);
			var factory = this.get(name);
			return factory ? factory.apply(this, args) : null;
		},
		
		/**
		 * Check if passed element is of specified type
		 * @param {Object} elem
		 * @param {String} type
		 * @returns {Boolean}
		 */
		is: function(elem, type) {
			return elem && elem.type === type;
		}
	};
	
	// register resource references
	function commonFactory(value) {
		return {data: value};
	}
	
	/**
	 * Element factory
	 * @param {String} elementName Name of output element
	 * @param {String} attrs Attributes definition. You may also pass
	 * <code>Array</code> where each contains object with <code>name</code> 
	 * and <code>value</code> properties, or <code>Object</code>
	 * @param {Boolean} isEmpty Is expanded element should be empty
	 */
	result.add('element', function(elementName, attrs, isEmpty) {
		var ret = {
			/** @memberOf __zenDataElement */
			name: elementName,
			is_empty: !!isEmpty
		};
		
		if (attrs) {
			ret.attributes = [];
			if (_.isArray(attrs)) {
				ret.attributes = attrs;
			} else if (_.isString(attrs)) {
				var m;
				while (m = reAttrs.exec(attrs)) {
					ret.attributes.push({
						name: m[1],
						value: m[3]
					});
				}
			} else {
				_.each(attrs, function(value, name) {
					ret.attributes.push({
						name: name, 
						value: value
					});
				});
			}
		}
		
		return ret;
	});
	
	result.add('snippet', commonFactory);
	result.add('expando', commonFactory);
	result.add('reference', commonFactory);
	result.add('empty', function() {
		return {};
	});
	
	return result;
});/**
 * Zen Coding abbreviation parser. This module is designed to be stand-alone
 * (e.g. without any dependencies) so authors can copy this file into their
 * projects
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * @memberOf __zen_parser
 */var zen_parser = (/** @constructor */ function(){
	
	var re_valid_name = /^[\w\d\-_\$\:@!]+\+?$/i;
	
	/**
	 * @type TreeNode
	 */
	function TreeNode(parent) {
		this.abbreviation = '';
		/** @type {TreeNode} */
		this.parent = null;
		this.children = [];
		this.count = 1;
		this.name = null;
		this.text = null;
		this.attributes = [];
		this.is_repeating = false;
		this.has_implict_name = false;
	}
	
	TreeNode.prototype = {
		/**
		 * Adds passed or creates new child
		 * @param {TreeNode} [child]
		 * @return {TreeNode}
		 */
		addChild: function(child) {
			child = child || new TreeNode;
			child.parent = this;
			this.children.push(child);
			return child;
		},
		
		/**
		 * Replace current node in parent's child list with another node
		 * @param {TreeNode} node
		 */
		replace: function(node) {
			if (this.parent) {
				var children = this.parent.children;
				for (var i = 0, il = children.length; i < il; i++) {
					if (children[i] === this) {
						children[i] = node;
						this.parent = null;
						return;
					}
				}
			}
		},
		
		/**
		 * Sets abbreviation that belongs to current node
		 * @param {String} abbr
		 */
		setAbbreviation: function(abbr) {
			this.abbreviation = abbr;
			var m = abbr.match(/\*(\d+)?$/);
			if (m) {
				this.count = parseInt(m[1] || 1, 10);
				this.is_repeating = !m[1];
				abbr = abbr.substr(0, abbr.length - m[0].length);
			}
			
			if (abbr) {
				var name_text = splitExpression(abbr);
				var name = name_text[0];
				if (name_text.length == 2)
					this.text = name_text[1];
					
				if (name) {
					var attr_result = parseAttributes(name);
					this.name = attr_result[0] || 'div';
					this.has_implict_name = !attr_result[0];
					this.attributes = attr_result[1];
				}
			}
			
			// validate name
			if (this.name && !re_valid_name.test(this.name)) {
				throw new Error('InvalidAbbreviation');
			}
		},
		
		/**
		 * @return {String}
		 */
		getAbbreviation: function() {
			return this.expr;
		},
		
		/**
		 * Dump current tree node into a foramtted string
		 * @return {String}
		 */
		toString: function(level) {
			level = level || 0;
			var output = '(empty)';
			if (this.abbreviation) {
				output = '';
				if (this.name)
					output = this.name;
					
				if (this.text !== null)
					output += (output ? ' ' : '') + '{text: "' + this.text + '"}';
					
				if (this.attributes.length) {
					var attrs = [];
					for (var i = 0, il = this.attributes.length; i < il; i++) {
						attrs.push(this.attributes[i].name + '="' + this.attributes[i].value + '"'); 
					}
					output += ' [' + attrs.join(', ') + ']';
				}
			}
			var result = zen_coding.repeatString('-', level)
				+ output 
				+ '\n';
			for (var i = 0, il = this.children.length; i < il; i++) {
				result += this.children[i].toString(level + 1);
			}
			
			return result;
		},
		
		/**
		 * Check if current node contains children with empty <code>expr</code>
		 * property
		 * @return {Boolean}
		 */
		hasEmptyChildren: function() {
			for (var i = 0, il = this.children.length; i < il; i++) {
				if (this.children[i].isEmpty())
					return true;
			}
			
			return false;
		},
		
		/**
		 * @return {Boolean}
		 */
		isEmpty: function() {
			return !this.abbreviation;
		},
		
		/**
		 * Check if current node is a text-only node
		 * @return {Boolean}
		 */
		isTextNode: function() {
			return !this.name && this.text;
		},
		
		/**
		 * Returns attribute value (might be empty string) or <code>null</code> 
		 * if attribute wasn't found 
		 * @param {String} name
		 * @returns {String}
		 */
		getAttribute: function(name) {
			for (var i = 0, il = this.attributes.length; i < il; i++) {
				if (this.attributes[i].name == name)
					return this.attributes[i].value;
			}
			
			return null;
		}
	};
	
	/**
	 * Check if character is numeric
	 * @requires {Stirng} ch
	 * @return {Boolean}
	 */
	function isNumeric(ch) {
		if (typeof(ch) == 'string')
			ch = ch.charCodeAt(0);
			
		return (ch && ch > 47 && ch < 58);
	}
	
	/**
	 * Optimizes tree node: replaces empty nodes with their children
	 * @param {TreeNode} node
	 * @return {TreeNode}
	 */
	function squash(node) {
		for (var i = node.children.length - 1; i >=0; i--) {
			/** @type {TreeNode} */
			var n = node.children[i];
			if (n.isEmpty()) {
				var args = [i, 1];
				for (var j = 0, jl = n.children.length; j < jl; j++) {
					args.push(n.children[j]);
				}
				
				Array.prototype.splice.apply(node.children, args);
			}
		}
		
		return node;
	}
	
	/**
	 * Trim whitespace from string
	 * @param {String} text
	 * @return {String}
	 */
	function trim(text) {
		return (text || "").replace( /^\s+|\s+$/g, "" );
	}
	
	/**
	 * Get word, starting at <code>ix</code> character of <code>str</code>
	 */
	function getWord(ix, str) {
		var m = str.substring(ix).match(/^[\w\-:\$]+/);
		return m ? m[0] : '';
	}
	
	/**
	 * Extract attributes and their values from attribute set 
	 * @param {String} attr_set
	 */
	function extractAttributes(attr_set) {
		attr_set = trim(attr_set);
		var loop_count = 100, // endless loop protection
			re_string = /^(["'])((?:(?!\1)[^\\]|\\.)*)\1/,
			result = [],
			attr;
			
		while (attr_set && loop_count--) {
			var attr_name = getWord(0, attr_set);
			attr = null;
			if (attr_name) {
				attr = {name: attr_name, value: ''};
//				result[attr_name] = '';
				// let's see if attribute has value
				var ch = attr_set.charAt(attr_name.length);
				switch (ch) {
					case '=':
						var ch2 = attr_set.charAt(attr_name.length + 1);
						if (ch2 == '"' || ch2 == "'") {
							// we have a quoted string
							var m = attr_set.substring(attr_name.length + 1).match(re_string);
							if (m) {
								attr.value = m[2];
								attr_set = trim(attr_set.substring(attr_name.length + m[0].length + 1));
							} else {
								// something wrong, break loop
								attr_set = '';
							}
						} else {
							// unquoted string
							var m = attr_set.substring(attr_name.length + 1).match(/(.+?)(\s|$)/);
							if (m) {
								attr.value = m[1];
								attr_set = trim(attr_set.substring(attr_name.length + m[1].length + 1));
							} else {
								// something wrong, break loop
								attr_set = '';
							}
						}
						break;
					default:
						attr_set = trim(attr_set.substring(attr_name.length));
						break;
				}
			} else {
				// something wrong, can't extract attribute name
				break;
			}
			
			if (attr) result.push(attr);
		}
		return result;
	}
	
	/**
	 * Parses tag attributes extracted from abbreviation
	 * @param {String} str
	 */
	function parseAttributes(str) {
		/*
		 * Example of incoming data:
		 * #header
		 * .some.data
		 * .some.data#header
		 * [attr]
		 * #item[attr=Hello other="World"].class
		 */
		var result = [],
			name = '',
			collect_name = true,
			class_name,
			char_map = {'#': 'id', '.': 'class'};
		
		// walk char-by-char
		var i = 0,
			il = str.length,
			val;
			
		while (i < il) {
			var ch = str.charAt(i);
			switch (ch) {
				case '#': // id
					val = getWord(i, str.substring(1));
					result.push({name: char_map[ch], value: val});
					i += val.length + 1;
					collect_name = false;
					break;
				case '.': // class
					val = getWord(i, str.substring(1));
					if (!class_name) {
						// remember object pointer for value modification
						class_name = {name: char_map[ch], value: ''};
						result.push(class_name);
					}
					
					class_name.value += ((class_name.value) ? ' ' : '') + val;
					i += val.length + 1;
					collect_name = false;
					break;
				case '[': //begin attribute set
					// search for end of set
					var end_ix = str.indexOf(']', i);
					if (end_ix == -1) {
						// invalid attribute set, stop searching
						i = str.length;
					} else {
						var attrs = extractAttributes(str.substring(i + 1, end_ix));
						for (var j = 0, jl = attrs.length; j < jl; j++) {
							result.push(attrs[j]);
						}
						i = end_ix;
					}
					collect_name = false;
					break;
				default:
					if (collect_name)
						name += ch;
					i++;
			}
		}
		
		return [name, result];
	}
	
	/**
	 * @param {TreeNode} node
	 * @return {TreeNode}
	 */
	function optimizeTree(node) {
		while (node.hasEmptyChildren())
			squash(node);
			
		for (var i = 0, il = node.children.length; i < il; i++) {
			optimizeTree(node.children[i]);
		}
		
		return node;
	}
	
	/**
	 * Split expression by node name and its content, if exists. E.g. if we pass
	 * <code>a{Text}</code> expression, it will be splitted into <code>a</code>
	 * and <code>Text</code>
	 * @param {String} expr
	 * @return {Array} Result with one or two elements (if expression contains
	 * text node)
	 */
	function splitExpression(expr) {
		// fast test on text node
		if (expr.indexOf('{') == -1)
			return [expr];
			
		var attr_lvl = 0,
			text_lvl = 0,
			brace_stack = [],
			i = 0,
			il = expr.length,
			ch;
			
		while (i < il) {
			ch = expr.charAt(i);
			switch (ch) {
				case '[':
					if (!text_lvl)
						attr_lvl++;
					break;
				case ']':
					if (!text_lvl)
						attr_lvl--;
					break;
				case '{':
					if (!attr_lvl) {
						text_lvl++;
						brace_stack.push(i);
					}
					break;
				case '}':
					if (!attr_lvl) {
						text_lvl--;
						var brace_start = brace_stack.pop();
						if (text_lvl === 0) {
							// found braces bounds
							return [
								expr.substring(0, brace_start),
								expr.substring(brace_start + 1, i)
							];
						}
					}
					break;
			}
			i++;
		}
		
		// if we are here, then no valid text node found
		return [expr];
	}
	
	
	return {
		/**
		 * Parses abbreviation into tree with respect of groups, 
		 * text nodes and attributes. Each node of the tree is a single 
		 * abbreviation. Tree represents actual structure of the outputted 
		 * result
		 * @memberOf zen_parser
		 * @param {String} abbr Abbreviation to parse
		 * @return {TreeNode}
		 */
		parse: function(abbr) {
			var root = new TreeNode,
				context = root.addChild(),
				i = 0,
				il = abbr.length,
				text_lvl = 0,
				attr_lvl = 0,
				group_lvl = 0,
				group_stack = [root],
				ch, prev_ch,
				token = '';
				
			group_stack.last = function() {
				return this[this.length - 1];
			};
			
			var dumpToken = function() {
				if (token)
					context.setAbbreviation(token);
				token = '';
			};
				
			while (i < il) {
				ch = abbr.charAt(i);
				prev_ch = i ? abbr.charAt(i - 1) : '';
				switch (ch) {
					case '{':
						if (!attr_lvl)
							text_lvl++;
						token += ch;
						break;
					case '}':
						if (!attr_lvl)
							text_lvl--;
						token += ch;
						break;
					case '[':
						if (!text_lvl)
							attr_lvl++;
						token += ch;
						break;
					case ']':
						if (!text_lvl)
							attr_lvl--;
						token += ch;
						break;
					case '(':
						if (!text_lvl && !attr_lvl) {
							// beginning of the new group
							dumpToken();
							
							if (prev_ch != '+' && prev_ch != '>') {
								// previous char is not an operator, assume it's
								// a sibling
								context = context.parent.addChild();
							}
							
							group_stack.push(context);
							context = context.addChild();
						} else {
							token += ch;
						}
						break;
					case ')':
						if (!text_lvl && !attr_lvl) {
							// end of the group, pop stack
							dumpToken();
							context = group_stack.pop();
							
							if (i < il - 1 && abbr.charAt(i + 1) == '*') {
								// group multiplication
								var group_mul = '', n_ch;
								for (var j = i + 2; j < il; j++) {
									n_ch = abbr.charAt(j);
									if (isNumeric(n_ch))
										group_mul += n_ch;
									else 
										break;
								}
								
								i += group_mul.length + 1;
								group_mul = parseInt(group_mul || 1, 10);
								while (1 < group_mul--)
									context.parent.addChild(context);
//									last_parent.addChild(cur_item);
							}
							
						} else {
							token += ch;
						}
						break;
					case '+': // sibling operator
						if (!text_lvl && !attr_lvl && i != il - 1 /* expando? */) {
							dumpToken();
							context = context.parent.addChild();
						} else {
							token += ch;
						}
						break;
					case '>': // child operator
						if (!text_lvl && !attr_lvl) {
							dumpToken();
							context = context.addChild();
						} else {
							token += ch;
						}
						break;
					default:
						token += ch;
				}
				
				i++;
			}
			// put the final token
			dumpToken();
			
			return optimizeTree(root);
		},
		
		TreeNode: TreeNode,
		optimizeTree: optimizeTree
	};
})();

try {
	zen_coding.define('parser', zen_parser);
} catch(e) {};/**
 * @author Stoyan Stefanov
 * @link https://github.com/stoyan/etc/tree/master/cssex
 */

zen_coding.define('cssParser', function(require, _) {
var walker, tokens = [], isOp, isNameChar, isDigit;
    
    // walks around the source
    walker = {
        lines: null,
        total_lines: 0,
        linenum: -1,
        line: '',
        ch: '',
        chnum: -1,
        init: function (source) {
            var me = walker;
        
            // source, yumm
            me.lines = source
                .replace(/\r\n/g, '\n')
                .replace(/\r/g, '\n')
                .split('\n');
            me.total_lines = me.lines.length;
        
            // reset
            me.chnum = -1;
            me.linenum = -1;
            me.ch = '';
            me.line = '';
        
            // advance
            me.nextLine();
            me.nextChar();
        },
        nextLine: function () {
            var me = this;
            me.linenum += 1;
            if (me.total_lines <= me.linenum) {
                me.line = false;
            } else {
                me.line = me.lines[me.linenum];
            }
            if (me.chnum !== -1) {
                me.chnum = 0;
            }
            return me.line;
        }, 
        nextChar: function () {
            var me = this;
            me.chnum += 1;
            while (me.line.charAt(me.chnum) === '') {
                if (this.nextLine() === false) {
                    me.ch = false;
                    return false; // end of source
                }
                me.chnum = -1;
                me.ch = '\n';
                return '\n';
            }
            me.ch = me.line.charAt(me.chnum);
            return me.ch;
        },
        peek: function() {
            return this.line.charAt(this.chnum + 1);
        }
    };

    // utility helpers
    isNameChar = function (c) {
        return (c === '_' || c === '-' || (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z'));
    };

    isDigit = function (ch) {
        return (ch !== false && ch >= '0' && ch <= '9');
    };  

    isOp = (function () {
        var opsa = "{}[]()+*=.,;:>~|\\%$#@^!".split(''),
            opsmatcha = "*^|$~".split(''),
            ops = {},
            opsmatch = {},
            i = 0;
        for (; i < opsa.length; i += 1) {
            ops[opsa[i]] = true;
        }
        for (i = 0; i < opsmatcha.length; i += 1) {
            opsmatch[opsmatcha[i]] = true;
        }
        return function (ch, matchattr) {
            if (matchattr) {
                return !!opsmatch[ch];
            }
            return !!ops[ch];
        };
    }());
    
    // shorthands
    function isset(v) {
        return typeof v !== 'undefined';
    }
    function getConf() {
        return {
            'char': walker.chnum,
            line: walker.linenum
        };
    }


    // creates token objects and pushes them to a list
    function tokener(value, type, conf) {
        var w = walker, c = conf || {};
        tokens.push({
            charstart: isset(c['char']) ? c['char'] : w.chnum,
            charend:   isset(c.charend) ? c.charend : w.chnum,
            linestart: isset(c.line)    ? c.line    : w.linenum,
            lineend:   isset(c.lineend) ? c.lineend : w.linenum,
            value:     value,
            type:      type || value
        });
    }
    
    // oops
    function error(m, config) { 
        var w = walker,
            conf = config || {},
            c = isset(conf['char']) ? conf['char'] : w.chnum,
            l = isset(conf.line) ? conf.line : w.linenum;
        return {
            name: "ParseError",
            message: m + " at line " + (l + 1) + ' char ' + (c + 1),
            walker: w,
            tokens: tokens
        };
    }


    // token handlers follow for:
    // white space, comment, string, identifier, number, operator
    function white() {
    
        var c = walker.ch,
            token = '',
            conf = getConf();
    
        while (c === " " || c === "\t") {
            token += c;
            c = walker.nextChar();
        }
    
        tokener(token, 'white', conf);
    
    }

    function comment() {
    
        var w = walker,
            c = w.ch,
            token = c,
            cnext,
            conf = getConf();    
     
        cnext = w.nextChar();
        
        if (cnext !== '*') {
            // oops, not a comment, just a /
            conf.charend = conf['char'];
            conf.lineend = conf.line;
            return tokener(token, token, conf);
        }
    
        while (!(c === "*" && cnext === "/")) {
            token += cnext;
            c = cnext;
            cnext = w.nextChar();        
        }
        token += cnext;
        w.nextChar();
        tokener(token, 'comment', conf);
    }

    function str() {
        var w = walker,
            c = w.ch,
            q = c,
            token = c,
            cnext,
            conf = getConf();
    
        c = w.nextChar();
    
        while (c !== q) {
            
            if (c === '\n') {
                cnext = w.nextChar();
                if (cnext === "\\") {
                    token += c + cnext;
                } else {
                    // end of line with no \ escape = bad
                    throw error("Unterminated string", conf);
                }
            } else {
                if (c === "\\") {
                    token += c + w.nextChar();
                } else {
                    token += c;
                }
            }
        
            c = w.nextChar();
        
        }
        token += c;
        w.nextChar();
        tokener(token, 'string', conf);
    }
    
    function brace() {
        var w = walker,
            c = w.ch,
            depth = 0,
            token = c,
            conf = getConf();
    
        c = w.nextChar();
    
        while (c !== ')' && !depth) {
        	if (c === '(') {
        		depth++;
        	} else if (c === ')') {
        		depth--;
        	} else if (c === false) {
        		throw error("Unterminated brace", conf);
        	}
        	
        	token += c;
            c = w.nextChar();
        }
        
        token += c;
        w.nextChar();
        tokener(token, 'brace', conf);
    }

    function identifier(pre) {
        var w = walker,
            c = w.ch,
            conf = getConf(),
            token = (pre) ? pre + c : c;
            
        c = w.nextChar();
    
        if (pre) { // adjust token position
        	conf['char'] -= pre.length;
        }
        
        while (isNameChar(c) || isDigit(c)) {
            token += c;
            c = w.nextChar();
        }
    
        tokener(token, 'identifier', conf);    
    }

    function num() {
        var w = walker,
            c = w.ch,
            conf = getConf(),
            token = c,
            point = token === '.',
            nondigit;
        
        c = w.nextChar();
        nondigit = !isDigit(c);
    
        // .2px or .classname?
        if (point && nondigit) {
            // meh, NaN, could be a class name, so it's an operator for now
            conf.charend = conf['char'];
            conf.lineend = conf.line;
            return tokener(token, '.', conf);    
        }
        
        // -2px or -moz-something
        if (token === '-' && nondigit) {
            return identifier('-');
        }
    
        while (c !== false && (isDigit(c) || (!point && c === '.'))) { // not end of source && digit or first instance of .
            if (c === '.') {
                point = true;
            }
            token += c;
            c = w.nextChar();
        }

        tokener(token, 'number', conf);    
    
    }

    function op() {
        var w = walker,
            c = w.ch,
            conf = getConf(),
            token = c,
            next = w.nextChar();
            
        if (next === "=" && isOp(token, true)) {
            token += next;
            tokener(token, 'match', conf);
            w.nextChar();
            return;
        } 
        
        conf.charend = conf['char'] + 1;
        conf.lineend = conf.line;    
        tokener(token, token, conf);
    }


    // call the appropriate handler based on the first character in a token suspect
    function tokenize() {

        var ch = walker.ch;
    
        if (ch === " " || ch === "\t") {
            return white();
        }

        if (ch === '/') {
            return comment();
        } 

        if (ch === '"' || ch === "'") {
            return str();
        }
        
        if (ch === '(') {
            return brace();
        }
    
        if (ch === '-' || ch === '.' || isDigit(ch)) { // tricky - char: minus (-1px) or dash (-moz-stuff)
            return num();
        }
    
        if (isNameChar(ch)) {
            return identifier();
        }

        if (isOp(ch)) {
            return op();
        }
        
        if (ch === "\n") {
            tokener("line");
            walker.nextChar();
            return;
        }
        
        throw error("Unrecognized character");
    }


    return {
    	/**
    	 * @param source
    	 * @returns
    	 * @memberOf zen_coding.cssParser
    	 */
        lex: function (source) {
            walker.init(source);
            tokens = [];
            while (walker.ch !== false) {
                tokenize();            
            }
            return tokens;
        },
        toSource: function (toks) {
            var i = 0, max = toks.length, t, src = '';
            for (; i < max; i += 1) {
                t = toks[i];
                if (t.type === 'line') {
                    src += '\n';
                } else {
                    src += t.value;
                }
            }
            return src;
        }
    };
});/* This file defines an XML parser, with a few kludges to make it
 * usable for HTML. autoSelfClosers defines a set of tag names that
 * are expected to not have a closing tag, and doNotIndent specifies
 * the tags inside of which no indentation should happen (see Config
 * object). These can be disabled by passing the editor an object like
 * {useHTMLKludges: false} as parserConfig option.
 * 
 * Original code by Marijn Haverbeke
 * from CodeMirror project: http://codemirror.net/
 */
zen_coding.define('xmlParser', function(require, _) {
	// The value used to signal the end of a sequence in
	// iterators.
	var StopIteration = {
		toString : function() {
			return "StopIteration";
		}
	};

	// Apply a function to each element in a sequence.
	function forEach(iter, f) {
		if (iter.next) {
			try {
				while (true)
					f(iter.next());
			} catch (e) {
				if (e != StopIteration)
					throw e;
			}
		} else {
			for ( var i = 0; i < iter.length; i++)
				f(iter[i]);
		}
	}

	// A framework for simple tokenizers. Takes care of newlines
	// and
	// white-space, and of getting the text from the source
	// stream into
	// the token object. A state is a function of two arguments
	// -- a
	// string stream and a setState function. The second can be
	// used to
	// change the tokenizer's state, and can be ignored for
	// stateless
	// tokenizers. This function should advance the stream over
	// a token
	// and return a string or object containing information
	// about the next
	// token, or null to pass and have the (new) state be called
	// to finish
	// the token. When a string is given, it is wrapped in a
	// {style, type}
	// object. In the resulting object, the characters consumed
	// are stored
	// under the content property. Any whitespace following them
	// is also
	// automatically consumed, and added to the value property.
	// (Thus,
	// content is the actual meaningful part of the token, while
	// value
	// contains all the text it spans.)

	function tokenizer(source, state) {
		// Newlines are always a separate token.
		function isWhiteSpace(ch) {
			// The messy regexp is because IE's regexp matcher
			// is of the
			// opinion that non-breaking spaces are no
			// whitespace.
			return ch != "\n" && /^[\s\u00a0]*$/.test(ch);
		}

		var tokenizer = {
			state : state,

			take : function(type) {
				if (typeof (type) == "string")
					type = {
						style : type,
						type : type
					};

				type.content = (type.content || "")
						+ source.get();
				if (!/\n$/.test(type.content))
					source.nextWhile(isWhiteSpace);
				type.value = type.content + source.get();
				return type;
			},

			next : function() {
				if (!source.more())
					throw StopIteration;

				var type;
				if (source.equals("\n")) {
					source.next();
					return this.take("whitespace");
				}

				if (source.applies(isWhiteSpace))
					type = "whitespace";
				else
					while (!type)
						type = this.state(source, function(s) {
							tokenizer.state = s;
						});

				return this.take(type);
			}
		};
		return tokenizer;
	}

	/*
	 * String streams are the things fed to parsers (which can
	 * feed them to a tokenizer if they want). They provide peek
	 * and next methods for looking at the current character
	 * (next 'consumes' this character, peek does not), and a
	 * get method for retrieving all the text that was consumed
	 * since the last time get was called.
	 * 
	 * An easy mistake to make is to let a StopIteration
	 * exception finish the token stream while there are still
	 * characters pending in the string stream (hitting the end
	 * of the buffer while parsing a token). To make it easier
	 * to detect such errors, the stringstreams throw an
	 * exception when this happens.
	 */

	// Make a stringstream stream out of an iterator that
	// returns strings.
	// This is applied to the result of traverseDOM (see
	// codemirror.js),
	// and the resulting stream is fed to the parser.
	var stringStream = function(source) {
		// String that's currently being iterated over.
		var current = "";
		// Position in that string.
		var pos = 0;
		// Accumulator for strings that have been iterated over
		// but not
		// get()-ed yet.
		var accum = "";

		// ZC fix: if we've passed a string, wrap it with
		// traverseDOM-like interface
		if (typeof source == 'string') {
			var _source = source, _fed = false;
			source = {
				next : function() {
					if (!_fed) {
						_fed = true;
						return _source;
					} else {
						throw StopIteration;
					}
				}
			};
		}

		// Make sure there are more characters ready, or throw
		// StopIteration.
		function ensureChars() {
			while (pos == current.length) {
				accum += current;
				current = ""; // In case source.next() throws
				pos = 0;
				try {
					current = source.next();
				} catch (e) {
					if (e != StopIteration)
						throw e;
					else
						return false;
				}
			}
			return true;
		}

		return {
			// peek: -> character
			// Return the next character in the stream.
			peek : function() {
				if (!ensureChars())
					return null;
				return current.charAt(pos);
			},
			// next: -> character
			// Get the next character, throw StopIteration if at
			// end, check
			// for unused content.
			next : function() {
				if (!ensureChars()) {
					if (accum.length > 0)
						throw "End of stringstream reached without emptying buffer ('"
								+ accum + "').";
					else
						throw StopIteration;
				}
				return current.charAt(pos++);
			},
			// get(): -> string
			// Return the characters iterated over since the
			// last call to
			// .get().
			get : function() {
				var temp = accum;
				accum = "";
				if (pos > 0) {
					temp += current.slice(0, pos);
					current = current.slice(pos);
					pos = 0;
				}
				return temp;
			},
			// Push a string back into the stream.
			push : function(str) {
				current = current.slice(0, pos) + str
						+ current.slice(pos);
			},
			lookAhead : function(str, consume, skipSpaces,
					caseInsensitive) {
				function cased(str) {
					return caseInsensitive ? str.toLowerCase()
							: str;
				}
				str = cased(str);
				var found = false;

				var _accum = accum, _pos = pos;
				if (skipSpaces)
					this.nextWhileMatches(/[\s\u00a0]/);

				while (true) {
					var end = pos + str.length, left = current.length
							- pos;
					if (end <= current.length) {
						found = str == cased(current.slice(pos,
								end));
						pos = end;
						break;
					} else if (str.slice(0, left) == cased(current
							.slice(pos))) {
						accum += current;
						current = "";
						try {
							current = source.next();
						} catch (e) {
							if (e != StopIteration)
								throw e;
							break;
						}
						pos = 0;
						str = str.slice(left);
					} else {
						break;
					}
				}

				if (!(found && consume)) {
					current = accum.slice(_accum.length)
							+ current;
					pos = _pos;
					accum = _accum;
				}

				return found;
			},
			// Wont't match past end of line.
			lookAheadRegex : function(regex, consume) {
				if (regex.source.charAt(0) != "^")
					throw new Error(
							"Regexps passed to lookAheadRegex must start with ^");

				// Fetch the rest of the line
				while (current.indexOf("\n", pos) == -1) {
					try {
						current += source.next();
					} catch (e) {
						if (e != StopIteration)
							throw e;
						break;
					}
				}
				var matched = current.slice(pos).match(regex);
				if (matched && consume)
					pos += matched[0].length;
				return matched;
			},

			// Utils built on top of the above
			// more: -> boolean
			// Produce true if the stream isn't empty.
			more : function() {
				return this.peek() !== null;
			},
			applies : function(test) {
				var next = this.peek();
				return (next !== null && test(next));
			},
			nextWhile : function(test) {
				var next;
				while ((next = this.peek()) !== null
						&& test(next))
					this.next();
			},
			matches : function(re) {
				var next = this.peek();
				return (next !== null && re.test(next));
			},
			nextWhileMatches : function(re) {
				var next;
				while ((next = this.peek()) !== null
						&& re.test(next))
					this.next();
			},
			equals : function(ch) {
				return ch === this.peek();
			},
			endOfLine : function() {
				var next = this.peek();
				return next == null || next == "\n";
			}
		};
	};

	var Kludges = {
		autoSelfClosers : {
			"br" : true,
			"img" : true,
			"hr" : true,
			"link" : true,
			"input" : true,
			"meta" : true,
			"col" : true,
			"frame" : true,
			"base" : true,
			"area" : true
		},
		doNotIndent : {
			"pre" : true,
			"!cdata" : true
		}
	};
	var NoKludges = {
		autoSelfClosers : {},
		doNotIndent : {
			"!cdata" : true
		}
	};
	var UseKludges = Kludges;
	var alignCDATA = false;

	// Simple stateful tokenizer for XML documents. Returns a
	// MochiKit-style iterator, with a state property that
	// contains a
	// function encapsulating the current state. See
	// tokenize.js.
	var tokenizeXML = (function() {
		function inText(source, setState) {
			var ch = source.next();
			if (ch == "<") {
				if (source.equals("!")) {
					source.next();
					if (source.equals("[")) {
						if (source.lookAhead("[CDATA[", true)) {
							setState(inBlock("xml-cdata", "]]>"));
							return null;
						} else {
							return "xml-text";
						}
					} else if (source.lookAhead("--", true)) {
						setState(inBlock("xml-comment", "-->"));
						return null;
					} else if (source
							.lookAhead("DOCTYPE", true)) {
						source.nextWhileMatches(/[\w\._\-]/);
						setState(inBlock("xml-doctype", ">"));
						return "xml-doctype";
					} else {
						return "xml-text";
					}
				} else if (source.equals("?")) {
					source.next();
					source.nextWhileMatches(/[\w\._\-]/);
					setState(inBlock("xml-processing", "?>"));
					return "xml-processing";
				} else {
					if (source.equals("/"))
						source.next();
					setState(inTag);
					return "xml-punctuation";
				}
			} else if (ch == "&") {
				while (!source.endOfLine()) {
					if (source.next() == ";")
						break;
				}
				return "xml-entity";
			} else {
				source.nextWhileMatches(/[^&<\n]/);
				return "xml-text";
			}
		}

		function inTag(source, setState) {
			var ch = source.next();
			if (ch == ">") {
				setState(inText);
				return "xml-punctuation";
			} else if (/[?\/]/.test(ch) && source.equals(">")) {
				source.next();
				setState(inText);
				return "xml-punctuation";
			} else if (ch == "=") {
				return "xml-punctuation";
			} else if (/[\'\"]/.test(ch)) {
				setState(inAttribute(ch));
				return null;
			} else {
				source
						.nextWhileMatches(/[^\s\u00a0=<>\"\'\/?]/);
				return "xml-name";
			}
		}

		function inAttribute(quote) {
			return function(source, setState) {
				while (!source.endOfLine()) {
					if (source.next() == quote) {
						setState(inTag);
						break;
					}
				}
				return "xml-attribute";
			};
		}

		function inBlock(style, terminator) {
			return function(source, setState) {
				while (!source.endOfLine()) {
					if (source.lookAhead(terminator, true)) {
						setState(inText);
						break;
					}
					source.next();
				}
				return style;
			};
		}

		return function(source, startState) {
			return tokenizer(source, startState || inText);
		};
	})();

	// The parser. The structure of this function largely
	// follows that of
	// parseJavaScript in parsejavascript.js (there is actually
	// a bit more
	// shared code than I'd like), but it is quite a bit
	// simpler.
	function parseXML(source) {
		var tokens = tokenizeXML(source), token;
		var cc = [ base ];
		var tokenNr = 0, indented = 0;
		var currentTag = null, context = null;
		var consume;

		function push(fs) {
			for ( var i = fs.length - 1; i >= 0; i--)
				cc.push(fs[i]);
		}
		function cont() {
			push(arguments);
			consume = true;
		}
		function pass() {
			push(arguments);
			consume = false;
		}

		function markErr() {
			token.style += " xml-error";
		}
		function expect(text) {
			return function(style, content) {
				if (content == text)
					cont();
				else {
					markErr();
					cont(arguments.callee);
				}
			};
		}

		function pushContext(tagname, startOfLine) {
			var noIndent = UseKludges.doNotIndent
					.hasOwnProperty(tagname)
					|| (context && context.noIndent);
			context = {
				prev : context,
				name : tagname,
				indent : indented,
				startOfLine : startOfLine,
				noIndent : noIndent
			};
		}
		function popContext() {
			context = context.prev;
		}
		function computeIndentation(baseContext) {
			return function(nextChars, current) {
				var context = baseContext;
				if (context && context.noIndent)
					return current;
				if (alignCDATA && /<!\[CDATA\[/.test(nextChars))
					return 0;
				if (context && /^<\//.test(nextChars))
					context = context.prev;
				while (context && !context.startOfLine)
					context = context.prev;
				if (context)
					return context.indent + indentUnit;
				else
					return 0;
			};
		}

		function base() {
			return pass(element, base);
		}
		var harmlessTokens = {
			"xml-text" : true,
			"xml-entity" : true,
			"xml-comment" : true,
			"xml-processing" : true,
			"xml-doctype" : true
		};
		function element(style, content) {
			if (content == "<")
				cont(tagname, attributes, endtag(tokenNr == 1));
			else if (content == "</")
				cont(closetagname, expect(">"));
			else if (style == "xml-cdata") {
				if (!context || context.name != "!cdata")
					pushContext("!cdata");
				if (/\]\]>$/.test(content))
					popContext();
				cont();
			} else if (harmlessTokens.hasOwnProperty(style))
				cont();
			else {
				markErr();
				cont();
			}
		}
		function tagname(style, content) {
			if (style == "xml-name") {
				currentTag = content.toLowerCase();
				token.style = "xml-tagname";
				cont();
			} else {
				currentTag = null;
				pass();
			}
		}
		function closetagname(style, content) {
			if (style == "xml-name") {
				token.style = "xml-tagname";
				if (context
						&& content.toLowerCase() == context.name)
					popContext();
				else
					markErr();
			}
			cont();
		}
		function endtag(startOfLine) {
			return function(style, content) {
				if (content == "/>"
						|| (content == ">" && UseKludges.autoSelfClosers
								.hasOwnProperty(currentTag)))
					cont();
				else if (content == ">") {
					pushContext(currentTag, startOfLine);
					cont();
				} else {
					markErr();
					cont(arguments.callee);
				}
			};
		}
		function attributes(style) {
			if (style == "xml-name") {
				token.style = "xml-attname";
				cont(attribute, attributes);
			} else
				pass();
		}
		function attribute(style, content) {
			if (content == "=")
				cont(value);
			else if (content == ">" || content == "/>")
				pass(endtag);
			else
				pass();
		}
		function value(style) {
			if (style == "xml-attribute")
				cont(value);
			else
				pass();
		}

		return {
			indentation : function() {
				return indented;
			},

			next : function() {
				token = tokens.next();
				if (token.style == "whitespace" && tokenNr == 0)
					indented = token.value.length;
				else
					tokenNr++;
				if (token.content == "\n") {
					indented = tokenNr = 0;
					token.indentation = computeIndentation(context);
				}

				if (token.style == "whitespace"
						|| token.type == "xml-comment")
					return token;

				while (true) {
					consume = false;
					cc.pop()(token.style, token.content);
					if (consume)
						return token;
				}
			},

			copy : function() {
				var _cc = cc.concat([]), _tokenState = tokens.state, _context = context;
				var parser = this;

				return function(input) {
					cc = _cc.concat([]);
					tokenNr = indented = 0;
					context = _context;
					tokens = tokenizeXML(input, _tokenState);
					return parser;
				};
			}
		};
	}

  return {
    make: function(stream) {
    	if (typeof stream == 'string')
    		stream = stringStream(stream);
    		
    	return parseXML(stream);
    }
  };
});
/**
 * Some utility functions for CSS parser:
 * -- optimizes CSS lexer token, produced by Stoyan Stefanov's CSSEX parser,
 *    for Zen Coding needs
 * -- extracts full CSS rule (selector + style rules) from content
 *  
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * @param {Function} require
 * @param {Underscore} _
 */
zen_coding.define('parserUtils', function(require, _) {
	var css_stop_chars = '{}/\\<>';
	
	function isStopChar(token) {
		var stop_chars = '{};:';
		return stop_chars.indexOf(token.type) != -1;
	}
	
	/**
	 * Calculates newline width at specified position in content
	 * @param {String} content
	 * @param {Number} pos
	 * @return {Number}
	 */
	function calculateNlLength(content, pos) {
		return content.charAt(pos) == '\r' && content.charAt(pos + 1) == '\n' ? 2 : 1;
	}
	
	/**
	 * Post-process optimized tokens: collapse tokens for complex values
	 * @param {Array} optimized Optimized tokens
	 * @param {Array} original Original preprocessed tokens 
	 */
	function postProcessOptimized(optimized, original) {
		var token, child;
		_.each(optimized, function(token, i) {
			if (token.type == 'value') {
				token.children = [];
				child = null;
				
				var subtokenStart = token.ref_start_ix;
				
				while (subtokenStart <= token.ref_end_ix) {
					var subtoken = original[subtokenStart];
					if (subtoken.type != 'white') {
						if (!child)
							child = [subtoken.start, subtoken.end];
						else
							child[1] = subtoken.end;
					} else if (child) {
						token.children.push(child);
						child = null;
					}
					
					subtokenStart++;	
				}
				
				if (child) // push last token
					token.children.push(child);
			}
		});
		
		return optimized;
	}
	
	function makeToken(type, value, pos, ix) {
		value = value || '';
		return {
			/** @memberOf syntaxToken */
			type: type || '',
			content: value,
			start: pos,
			end: pos + value.length,
			/** Reference token index that starts current token */
			ref_start_ix: ix,
			/** Reference token index that ends current token */
			ref_end_ix: ix
		};
	}
	
	function CSSTreeNode(token) {
 		this.start_token = token;
 		this.end_token = null;
 		
 		this.children = [];
 		this.properties = [];
 		
 		this.parent = null;
 		this.next_sibling = null;
 		this.prev_sibling = null;
 	}
 	
 	CSSTreeNode.prototype = {
 		/**
 		 * @param {syntaxToken} token
 		 * @returns {CSSTreeNode}
 		 */
 		addChild: function(token) {
 			var child = new CSSTreeNode(token);
 			/** @type CSSTreeNode */
 			var lastChild = _.last(this.children);
 				
 			child.parent = this;
 			if (lastChild) {
 				lastChild.next_sibling = child;
 				child.prev_sibling = lastChild;
 			}
 			
 			this.children.push(child);
 			return child;
 		},
 		
 		/**
 		 * Adds CSS property name and value into current section
 		 * @param {syntaxToken} name_token
 		 * @param {syntaxToken} value_token
 		 */
 		addProperty: function(nameToken, valueToken) {
 			this.properties.push({
 				name: nameToken ? nameToken.content : null,
 				value: valueToken ? valueToken.content : null,
 				name_token: nameToken,
 				value_token: valueToken
 			});
 		}
 	};
	
	return {
		/**
		 * Parses CSS and optimizes parsed chunks
		 * @see ParserUtils#optimizeCSS
		 * @param {String} source CSS source code fragment
		 * @param {Number} offset Offset of CSS fragment inside whole document
		 * @return {Array}
		 * @memberOf zen_coding.parserUtils
		 */
		parseCSS: function(source, offset) {
			return this.optimizeCSS(require('cssParser').lex(source), offset || 0, source);
		},
		
		/**
		 * Parses HTML and optimizes parsed chunks
		 * @param {String} source HTML source code fragment
		 * @param {Number} offset Offset of HTML fragment inside whole document
		 * @return {Array}
		 */
		parseHTML: function(tag, offset) {
			var tokens = require('xmlParser').make(tag),
				result = [],
				t, i = 0;
				
			try {
				while (t = tokens.next()) {
					result.push(makeToken(t.style, t.content, offset + i, 0));
					i += t.value.length;
				}
			} catch (e) {
				if (e != 'StopIteration') throw e;
			}
			
			return result;
		},
		
		/**
		 * Optimizes parsed CSS tokens: combines selector chunks, complex values
		 * into a single chunk
		 * @param {Array} tokens Tokens produced by <code>CSSEX.lex()</code>
		 * @param {Number} offset CSS rule offset in source code (character index)
		 * @param {String} content Original CSS source code
		 * @return {Array} Optimized tokens  
		 */
		optimizeCSS: function(tokens, offset, content) {
			offset = offset || 0;
			var result = [], token, i, il, _o = 0,
				in_rules = false,
				in_value = false,
				delta = 0,
				acc_type,
				acc_tokens = {
					/** @type {makeToken} */
					selector: null,
					/** @type {makeToken} */
					value: null
				},
				nl_size,
				orig_tokens = [];
				
			function addToken(token, type) {
				if (type && type in acc_tokens) {
					if (!acc_tokens[type]) {
						acc_tokens[type] = makeToken(type, token.value, offset + delta + token.charstart, i);
						result.push(acc_tokens[type]);
					} else {
						acc_tokens[type].content += token.value;
						acc_tokens[type].end += token.value.length;
						acc_tokens[type].ref_end_ix = i;
					}
				} else {
					result.push(makeToken(token.type, token.value, offset + delta + token.charstart, i));
				}
			}
			
			for (i = 0, il = tokens.length; i < il; i++) {
				token = tokens[i];
				acc_type = null;
				
				if (token.type == 'line') {
					delta += _o;
					nl_size = content ? calculateNlLength(content, delta) : 1;
					
					var tok_value = nl_size == 1 ? '\n' : '\r\n';
					orig_tokens.push(makeToken(token.type, tok_value, offset + delta));
					
					result.push(makeToken(token.type, tok_value, offset + delta, i));
					delta += nl_size;
					_o = 0;
					
					continue;
				}
				
				orig_tokens.push(makeToken(token.type, token.value, offset + delta + token.charstart));
				
//				_o = token.charend;
				// use charstart and length because of incorrect charend 
				// computation for whitespace
				_o = token.charstart + token.value.length;
				
				if (token.type != 'white') {
					if (token.type == '{') {
						in_rules = true;
						acc_tokens.selector = null;
					} else if (in_rules) {
						if (token.type == ':') {
							in_value = true;
						} else if (token.type == ';') {
							in_value = false;
							acc_tokens.value = null;
						}  else if (token.type == '}') {
							in_value = in_rules = false;
							acc_tokens.value = null;
						} else if (in_value || acc_tokens.value) {
							acc_type = 'value';
						}
					} else if (acc_tokens.selector || (!in_rules && !isStopChar(token))) {
						// start selector token
						acc_type = 'selector';
					}
					
					addToken(token, acc_type);
				} else {
					// whitespace token, decide where it should be
					if (i < il - 1 && isStopChar(tokens[i + 1])) continue;
					
					if (acc_tokens.selector || acc_tokens.value)
						addToken(token, acc_tokens.selector ? 'selector' : 'value');
				}
			}
			
			result.__original = orig_tokens;
			return postProcessOptimized(result, orig_tokens);
		},
		
		/**
		 * Extracts single CSS selector definition from source code
		 * @param {String} content CSS source code
		 * @param {Number} pos Character position where to start source code extraction
		 */
		extractCSSRule: function(content, pos, is_backward) {
			var result = '', 
				c_len = content.length,
				offset = pos, 
				brace_pos = -1, ch;
			
			// search left until we find rule edge
			while (offset >= 0) {
				ch = content.charAt(offset);
				if (ch == '{') {
					brace_pos = offset;
					break;
				}
				else if (ch == '}' && !is_backward) {
					offset++;
					break;
				}
				
				offset--;
			}
			
			// search right for full rule set
			while (offset < c_len) {
				ch = content.charAt(offset);
				if (ch == '{')
					brace_pos = offset;
				else if (ch == '}') {
					if (brace_pos != -1)
						result = content.substring(brace_pos, offset + 1);
					break;
				}
				
				offset++;
			}
			
			if (result) {
				// find CSS selector
				offset = brace_pos - 1;
				var selector = '';
				while (offset >= 0) {
					ch = content.charAt(offset);
					if (css_stop_chars.indexOf(ch) != -1) break;
					offset--;
				}
				
				// also trim whitespace
				selector = content.substring(offset + 1, brace_pos).replace(/^[\s\n\r]+/m, '');
				return [brace_pos - selector.length, brace_pos + result.length];
			}
			
			return null;
		},
		
		token: makeToken,
		
		/**
		 * Find value token, staring at <code>pos</code> index and moving right
		 * @param {Array} tokens
		 * @param {Number} pos
		 * @return {syntaxToken}
		 */
		findValueToken: function(tokens, pos) {
			for (var i = pos, il = tokens.length; i < il; i++) {
				var t = tokens[i];
				if (t.type == 'value')
					return t;
				else if (t.type == 'identifier' || t.type == ';')
					break;
			}
			
			return null;
		},
		
		/**
		 * Search for token with specified type left to the specified position
		 * @param {Array} tokens List of parsed tokens
		 * @param {Number} pos Position where to start searching
		 * @param {String} type Token type
		 * @return {Number} Token index
		 */
		findTokenFromPosition: function(tokens, pos, type) {
			// find token under caret
			var tokenIx = -1;
			for (var i = 0, il = tokens.length; i < il; i++) {
				var token = tokens[i];
				if (token.start <= pos && token.end >= pos) {
					tokenIx = i;
					break;
				}
			}
			
			if (tokenIx != -1) {
				// token found, search left until we find token with specified type
				while (tokenIx >= 0) {
					if (tokens[tokenIx].type == type)
						return tokenIx;
					tokenIx--;
				}
			}
			
			return -1;
		},
		
		/**
	 	 * Parses content of CSS file into some sort of syntax tree for faster 
	 	 * search and lookups
	 	 * @param {String} text CSS stylesheet
	 	 */
 		cssParseIntoTree: function(text) {
	 		var tokens = this.parseCSS(text);
	 		var tree = new CSSTreeNode();
	 		/** @type syntaxToken */
	 		var curNode = tree;
	 			
	 		_.each(tokens, function(token, i) {
	 			switch (token.type) {
		 			case '{': // rule/section start
		 				curNode = curNode.addChild(token);
		 				break;
		 			case '}': // rule/section end
		 				curNode.end_token = token;
		 				curNode = curNode.parent;
		 				break;
		 			case 'identifier': // CSS property
		 				if (curNode) {
		 					curNode.addProperty(token, this.findValueToken(tokens, i + 1));
		 				}
		 				break;
	 			}
			});
	 		
	 		return tree;
	 	},
	 	
	 	/**
	 	 * Search for insertion point for new CSS properties
	 	 * @param {Array} tokens
	 	 * @param {Number} start_ix Token index where to start searching
	 	 */
	 	findCSSInsertionPoint: function(tokens, startIx) {
	 		var insPoint;
	 		var insIx = -1; 
	 		var needCol = false;
	 			
	 		for (var i = startIx, il = tokens.length; i < il; i++) {
	 			var t = tokens[i];
	 			if (t.type == 'value') {
	 				insPoint = t;
	 				insIx = i;
	 				// look ahead for rule termination
	 				if (tokens[i + 1] && tokens[i + 1].type == ';') {
	 					insPoint = tokens[i + 1];
	 					insIx += 1;
	 				} else {
	 					needCol = true;
	 				}
	 				break;
	 			}
	 		}
	 		
	 		return {
	 			token: insPoint,
	 			ix: insIx,
	 			need_col: needCol
	 		};
	 	},
	 	
	 	/**
	 	 * Learns formatting style from parsed tokens
	 	 * @param {Array} tokens List of tokens
	 	 * @param {Number} pos Identifier token position, from which style should be learned
	 	 * @returns {Function} Function with <code>(name, value)</code> arguments that will create
	 	 * CSS rule based on learned formatting
	 	 */
	 	learnCSSStyle: function(tokens, pos) {
	 		var prefix = '', glue = '', i, il;
	 		
	 		// use original tokens instead of optimized ones
	 		pos = tokens[pos].ref_start_ix;
	 		tokens = tokens.__original;
	 		
	 		// learn prefix
	 		for (i = pos - 1; i >= 0; i--) {
	 			if (tokens[i].type == 'white') {
	 				prefix = tokens[i].content + prefix;
	 			} else if (tokens[i].type == 'line') {
	 				prefix = tokens[i].content + prefix;
	 				break;
	 			} else {
	 				break;
	 			}
	 		}
	 		
	 		// learn glue
	 		for (i = pos + 1, il = tokens.length; i < il; i++) {
	 			if (tokens[i].type == 'white' || tokens[i].type == ':')
	 				glue += tokens[i].content;
	 			else break;
	 		}
	 		
	 		if (glue.indexOf(':') == -1)
	 			glue = ':';
	 		
	 		return function(name, value) {
	 			return prefix + name + glue + value + ';';
	 		};
	 	},
	 	
	 	/**
	 	 * Removes vendor prefix from CSS property
	 	 * @param {String} name CSS property
	 	 * @return {String}
	 	 */
	 	getBaseCSSName: function(name) {
	 		return name.replace(/^\s*\-\w+\-/, '');
	 	}
	};
});(function() {
	/**
	 * Parsed element that represents intermediate node in abbreviation 
	 * transformation process. This element will then be converted to 
	 * <code>ZenNode</code>
	 * 
	 * @param {TreeNode} node Parsed tree node
	 * @param {String} syntax Tag type (html, xml)
	 * @param {__zenDataElement} resource Matched element resource from <code>zen_settings</code>
	 */
	function ParsedElement(node, syntax, resource) {
		this._abbr = resource;
		
		this.name = this._abbr ? this._abbr.name : node.name;
		this.real_name = node.name;
		this.count = node.count || 1;
		this.syntax = syntax;
		this._content = '';
		this._paste_content = '';
		this.repeat_by_lines = !!node.is_repeating;
		this.is_repeating = node && node.count > 1;
		this.parent = null;
		this.has_implicit_name = !!node.has_implict_name;
		this.children = [];
		
		this.setContent(node.text);
	}

	ParsedElement.prototype = {
		/**
		 * Adds new child tag to current one
		 * @param {ParsedElement} elem
		 */
		addChild: function(elem) {
			elem.parent = this;
			this.children.push(elem);
		},
		
		/**
		 * Check if current node contains children
		 * @returns {Boolean}
		 */
		hasChildren: function() {
			return !!this.children.length;
		},
		
		/**
		 * Adds new attribute
		 * @param {String} name Attribute's name
		 * @param {String} value Attribute's value
		 */
		addAttribute: function(name, value) {
			if (!this.attributes)
				this.attributes = [];
				
			if (!this._attr_hash)
				this._attr_hash = {};
			
			/** @type {zen_coding.utils} */
			var utils = zen_coding.require('utils');
			
			// escape pipe (caret) character with internal placeholder
			value = utils.replaceUnescapedSymbol(value, '|', utils.getCaretPlaceholder());
			
			var a;
			if (name in this._attr_hash) {
				// attribute already exists, decide what to do
				a = this._attr_hash[name];
				if (name == 'class') {
					// 'class' is a magic attribute
					a.value += ((a.value) ? ' ' : '') + value;
				} else {
					a.value = value;
				}
			} else {
				a = {name: name, value: value};
				this._attr_hash[name] = a;
				this.attributes.push(a);
			}
		},
		
		/**
		 * Copy attributes from parsed node
		 */
		copyAttributes: function(node) {
			if (node && node.attributes) {
				var that = this;
				_.each(node.attributes, function(attr) {
					that.addAttribute(attr.name, attr.value);
				});
			}
		},
		
		/**
		 * This function tests if current tags' content contains xHTML tags. 
		 * This function is mostly used for output formatting
		 */
		hasTagsInContent: function() {
			return zen_coding.require('utils').matchesTag(this.getContent());
		},
		
		/**
		 * Set textual content for tag
		 * @param {String} str Tag's content
		 */
		setContent: function(str) {
			var utils = zen_coding.require('utils');
			this._content = utils.replaceUnescapedSymbol(str || '', '|', utils.getCaretPlaceholder());
		},
		
		/**
		 * Returns tag's textual content
		 * @return {String}
		 */
		getContent: function() {
			return this._content || '';
		},
		
		/**
		 * Set content that should be pasted to the output
		 * @param {String} val
		 */
		setPasteContent: function(val) {
			this._paste_content = zen_coding.require('utils').escapeText(val);
		},
		
		/**
		 * Get content that should be pasted to the output
		 * @return {String}
		 */
		getPasteContent: function() {
			return this._paste_content;
		},
		
		/**
		 * Search for deepest and latest child of current element
		 * @return {ParsedElement} Returns null if there's no children
		 */
		findDeepestChild: function() {
			if (!this.children || !this.children.length)
				return null;
				
			var deepestChild = this;
			while (deepestChild.children.length) {
				deepestChild = _.last(deepestChild.children);
			}
			
			return deepestChild;
		}
	};
	
	var elems = zen_coding.require('elements');
	elems.add('parsedElement', function(node, syntax, resource) {
		var res = zen_coding.require('resources');
		if (!resource && node.name) {
			resource = res.getAbbreviation(syntax, node.name);
		}
		
		if (resource && elems.is(resource, 'reference')) {
			resource = res.getAbbreviation(type, resource.data);
		}
		
		var elem = new ParsedElement(node, syntax, resource);
		// add default attributes
		if (elem._abbr)
			elem.copyAttributes(elem._abbr);
		
		elem.copyAttributes(node);
		
		return elem;
	});
	
	elems.add('parsedSnippet', function(node, syntax, resource) {
		if (_.isString(resource))
			resource = elems.create('snippet', resource);
		
		var elem = new ParsedElement(node, syntax, resource);
		var utils = zen_coding.require('utils');
		var res = zen_coding.require('resources');
		
		var data = resource ? resource.data : res.getSnippet(syntax, elem.name);
		elem.value = utils.replaceUnescapedSymbol(data, '|', utils.getCaretPlaceholder());
		
		// override some attributes
		elem.addAttribute('id', utils.getCaretPlaceholder());
		elem.addAttribute('class', utils.getCaretPlaceholder());
		elem.copyAttributes(node);
		
		return elem;
	});
})();/**
 * <code>ZenNode</code> — an element in final transformation process which will 
 * be used to generate output
 * @author Sergey Chikuyonok (serge.che@gmail.com) <http://chikuyonok.ru>
 */
(function(){
	/**
	 * Test if text contains output placeholder $#
	 * @param {String} text
	 * @return {Boolean}
	 */
	function hasOutputPlaceholder(text) {
		for (var i = 0, il = text.length; i < il; i++) {
			var ch = text.charAt(i);
			if (ch == '\\') { // escaped char
				i++;
				continue;
			} else if (ch == '$' && text.charAt(i + 1) == '#') {
				return true;
			}
		}
		
		return false;
	}
	
	/**
	 * Creates simplified tag from Zen Coding tag
	 * @param {ParsedElement} elem
	 */
	function ZenNode(elem) {
		var elems = zen_coding.require('elements');
		
		this.type = elems.is(elem, 'parsedSnippet') ? 'snippet' : 'tag';
		this.children = [];
		this.counter = 1;
		
		// copy attributes
		_.each('name,real_name,is_repeating,repeat_by_lines,has_implicit_name'.split(','), function(p) {
			this[p] = elem[p];
		}, this);
		
		// create deep copy of attribute list so we can change
		// their values in runtime without affecting other nodes
		// created from the same tag
		this.attributes = _.map(elem.attributes, function(a) {
			return _.clone(a);
		});
		
		/** @type {ParsedElement} Source element from which current tag was created */
		this.source = elem;
		
		// relations
		/** @type {ZenNode} */
		this.parent = null;
		/** @type {ZenNode} */
		this.nextSibling = null;
		/** @type {ZenNode} */
		this.previousSibling = null;
		
		// output params
		this.start = '';
		this.end = '';
		this.content = elem.getContent() || '';
		this.padding = '';
	}
	
	ZenNode.prototype = {
		/**
		 * Add child node
		 * @param {ZenNode} tag
		 */
		addChild: function(node) {
			node.parent = this;
			
			// check for implicit name
			if (node.has_implicit_name && this.isInline())
				node.name = 'span';
			
			var lastChild = _.last(this.children);
			if (lastChild) {
				node.previousSibling = lastChild;
				lastChild.nextSibling = node;
			}
			
			this.children.push(node);
		},
		
		/**
		 * Returns attribute object
		 * @private
		 * @param {String} name Attribute name
		 */
		_getAttr: function(name) {
			name = name.toLowerCase();
			return _.find(this.attributes, function(a) {
				return a.name.toLowerCase() == name;
			});
		},
		
		/**
		 * Get attribute's value.
		 * @param {String} name
		 * @return {String|null} Returns <code>null</code> if attribute wasn't found
		 */
		getAttribute: function(name) {
			var attr = this._getAttr(name);
			return attr && attr.value;
		},
		
		/**
		 * Set attribute's value.
		 * @param {String} name
		 * @param {String} value
		 */
		setAttribute: function(name, value) {
			var attr = this._getAttr(name);
			if (attr)
				attr.value = value;
		},
		
		/**
		 * Test if current tag is unary (no closing tag)
		 * @return {Boolean}
		 */
		isUnary: function() {
			if (this.type == 'snippet')
				return false;
				
			return (this.source._abbr && this.source._abbr.is_empty) 
				|| zen_coding.require('resources').isItemInCollection(this.source.syntax, 'empty', this.name);
		},
		
		/**
		 * Test if current tag is inline-level (like &lt;strong&gt;, &lt;img&gt;)
		 * @return {Boolean}
		 */
		isInline: function() {
			return this.type == 'text' || !this.source.name
				|| zen_coding.require('resources').isItemInCollection(this.source.syntax, 'inline_level', this.name);
		},
		
		/**
		 * Test if current element is block-level
		 * @return {Boolean}
		 */
		isBlock: function() {
			return this.type == 'snippet' || !this.isInline();
		},
		
		/**
		 * This function tests if current tags' content contains xHTML tags. 
		 * This function is mostly used for output formatting
		 */
		hasTagsInContent: function() {
			return zen_coding.require('utils').matchesTag(this.content);
		},
		
		/**
		 * Check if tag has child elements
		 * @return {Boolean}
		 */
		hasChildren: function() {
			return !!this.children.length;
		},
		
		/**
		 * Test if current tag contains block-level children
		 * @return {Boolean}
		 */
		hasBlockChildren: function() {
			return (this.hasTagsInContent() && this.isBlock()) 
				|| _.any(this.children, function(child) {
					return child.isBlock();
				});
		},
		
		/**
		 * Search for deepest and latest child of current element
		 * @return {ZenNode} Returns <code>null</code> if there's no children
		 */
		findDeepestChild: function() {
			if (!this.children.length)
				return null;
				
			var deepestChild = this;
			while (deepestChild.children.length) {
				deepestChild = _.last(deepestChild.children);
			}
			
			return deepestChild;
		},
		
		/**
		 * Returns string output for current node
		 * @return {String}
		 */
		toString: function() {
			var innerContent = _.map(this.children, function(child) {
				return child.toString();
			}).join('');
			
			return this.start + this.content + innerContent + this.end;
		},
		
		/**
		 * Test if current element contains output placeholder (aka $#)
		 * @return {Boolean}
		 */
		hasOutputPlaceholder: function() {
			if (hasOutputPlaceholder(this.content)) {
				return true;
			} else {
				// search inside attributes
				for (var i = 0, il = this.attributes.length; i < il; i++) {
					if (hasOutputPlaceholder(this.attributes[i].value))
						return true;
				}
			}
			
			return false;
		},
		
		/**
		 * Recursively search for elements with output placeholders (aka $#)
		 * inside current element (not included in result)
		 * @param {Array} receiver
		 * @return {Array} Array of elements with output placeholders.  
		 */
		findElementsWithOutputPlaceholder: function(receiver) {
			receiver = receiver || [];
			_.each(this.children, function(child) {
				if (child.hasOutputPlaceholder()) {
					receiver.push(child);
				}
				child.findElementsWithOutputPlaceholder(receiver);
			});
			
			return receiver;
		},
		
		/**
		 * Paste content in context of current node. Pasting is a special case
		 * of recursive adding content in node. 
		 * This function will try to find $# placeholder inside node's 
		 * attributes and text content and replace in with <code>text</code>.
		 * If it doesn't find $# placeholder, it will put <code>text</code>
		 * value as the deepest child content
		 * @param {String} text Text to paste
		 */
		pasteContent: function(text) {
			var symbol = '$#';
			var r = [symbol, text];
			var replaceFn = function() {return r;};
			var utils = zen_coding.require('utils');
			/** @type {ZenNode[]} */
			var items = [];
				
			if (this.hasOutputPlaceholder())
				items.push(this);
				
			items = items.concat(this.findElementsWithOutputPlaceholder());
			
			if (items.length) {
				_.each(items, function(item){
					item.content = utils.replaceUnescapedSymbol(item.content, symbol, replaceFn);
					_.each(item.attributes, function(a) {
						a.value = utils.replaceUnescapedSymbol(a.value, symbol, replaceFn);
					});
				});
			} else {
				// no placeholders found, add content to the deepest child
				var child = this.findDeepestChild() || this;
				child.content += text;
			}
		}
	};
	
	var elems = zen_coding.require('elements');
	elems.add('ZenNode', function(elem) {
		return new ZenNode(elem);
	});
})();/**
 * Expando (elements like 'ul+') resolver
 * @author Sergey Chikuyonok (serge.che@gmail.com) <http://chikuyonok.ru>
 * @param {TreeNode} node
 * @param {String} syntax
 */
zen_coding.require('resources').addResolver(function(node, syntax) {
	if (!node.isEmpty() && !node.isTextNode() && node.name.indexOf('+') != -1) {
		// it's expando
		var a = this.getAbbreviation(syntax, node.name);
		if (a) {
			return zen_coding.require('transform').createParsedTree(a.data, syntax);
		}
	}
	
	return null;
});/**
 * Module adds support for generators: a regexp-based abbreviation resolver 
 * that can produce custom output.
 */
(function() {
	var generators = [];
	var resources = zen_coding.require('resources');
	
	_.extend(resources, {
		addGenerator: function(regexp, fn) {
			if (_.isString(regexp))
				regexp = new RegExp(regexp);
			
			generators.unshift({
				re: regexp,
				fn: fn
			});
		}
	});
	
	resources.addResolver(function(node, syntax) {
		var result = null;
		var elements = zen_coding.require('elements');
		for (var i = 0, il = generators.length; i < il; i++) {
			var item = generators[i], m;
			if ((m = item.re.exec(node.name))) {
				result = item.fn(m, node, syntax);
				if (result !== null) {
					return result;
				}
			}
		}
		
		return result;
	});
}());/**
 * @memberOf __zen_filter_bem
 * @constructor
 */
zen_coding.require('filters').add('bem', (function() {
	var separators = {
		element: '__',
		modifier: '_'
	};
	
	var shouldRunHtmlFilter = false;
	
	/**
	 * @param {ZenNode} item
	 */
	function bemParse(item) {
		if (!zen_coding.require('elements').is(item.source, 'parsedElement'))
			return item;
		
		/** @type Underscore */
		var _ = zen_coding.require('_');
		
		// save BEM stuff in cache for faster lookups
		item.__bem = {
			block: '',
			element: '',
			modifier: ''
		};
		
		var classNames = normalizeClassName(item.getAttribute('class')).split(' ');
		var allClassNames = _.chain(classNames)
			.map(function(name) {return processClassName(name, item);})
			.flatten()
			.uniq()
			.value();
		
		item.setAttribute('class', allClassNames.join(' '));
		
		if (!item.__bem.block) {
			// guess best match for block name
			var reBlockName = /^[a-z]\-/i;
			for (var i = 0, il = allClassNames.length; i < il; i++) {
				/** @type String */
				if (reBlockName.test(allClassNames[i])) {
					item.__bem.block = allClassNames[i];
					break;
				}
			}
			
			// guessing doesn't worked, pick first class name as block name
			if (!item.__bem.block) {
				item.__bem.block = allClassNames[0];
			}
		}
		
		return item;
	
	}
	
	/**
	 * @param {String} className
	 * @returns {String}
	 */
	function normalizeClassName(className) {
		var utils = zen_coding.require('utils');
		className = ' ' + (className || '') + ' ';
		className = className.replace(/\s+/g, ' ').replace(/\s(\-+)/g, function(str, p1) {
			return ' ' + utils.repeatString(separators.element, p1.length);
		});
		
		return utils.trim(className);
	}
	
	/**
	 * Processes class name
	 * @param {String} name Class name item to process
	 * @param {ZenNode} item Host node for provided class name
	 * @returns {String} Processed class name. May return <code>Array</code> of
	 * class names 
	 */
	function processClassName(name, item) {
		name = transformClassName(name, item, 'element');
		name = transformClassName(name, item, 'modifier');
		
		// expand class name
		// possible values:
		// * block__element
		// * block__element_modifier
		// * block__element_modifier1_modifier2
		// * block_modifier
		var result, block = '', element = '', modifier = '';
		if (~name.indexOf(separators.element)) {
			var blockElem = name.split(separators.element);
			var elemModifiers = blockElem[1].split(separators.modifier);
			
			block = blockElem[0];
			element = elemModifiers.shift();
			modifier = elemModifiers.join(separators.modifier);
		} else if (~name.indexOf(separators.modifier)) {
			var blockModifiers = name.split(separators.modifier);
			
			block = blockModifiers.shift();
			modifier = blockModifiers.join(separators.modifier);
		}
		
		if (block) {
			// inherit parent bem element, if exists
//			if (item.parent && item.parent.__bem && item.parent.__bem.element)
//				element = item.parent.__bem.element + separators.element + element;
			
			// produce multiple classes
			var prefix = block;
			var result = [];
			
			if (element) {
				prefix += separators.element + element;
				result.push(prefix);
			} else {
				result.push(prefix);
			}
			
			if (modifier) {
				result.push(prefix + separators.modifier + modifier);
			}
			
			
			item.__bem.block = block;
			item.__bem.element = element;
			item.__bem.modifier = modifier;
			
			return result;
		}
		
		// ...otherwise, return processed or original class name
		return name;
	}
	
	/**
	 * Low-level function to transform user-typed class name into full BEM class
	 * @param {String} name Class name item to process
	 * @param {ZenNode} item Host node for provided class name
	 * @param {String} entityType Type of entity to be tried to transform 
	 * ('element' or 'modifier')
	 * @returns {String} Processed class name or original one if it can't be
	 * transformed
	 */
	function transformClassName(name, item, entityType) {
		var reSep = new RegExp('^(' + separators[entityType] + ')+', 'g');
		if (reSep.test(name)) {
			var depth = 0; // parent lookup depth
			var cleanName = name.replace(reSep, function(str, p1) {
				depth = str.length / separators[entityType].length;
				return '';
			});
			
			// find donor element
			var donor = item;
			while (donor.parent && depth--) {
				donor = donor.parent;
			}
			
			if (!donor || !donor.__bem)
				donor = item;
			
			if (donor && donor.__bem) {
				var prefix = donor.__bem.block;
				
				// decide if we should inherit element name
//				if (entityType == 'element') {
//					var curElem = cleanName.split(separators.modifier, 1)[0];
//					if (donor.__bem.element && donor.__bem.element != curElem)
//						prefix += separators.element + donor.__bem.element;
//				}
				
				if (entityType == 'modifier' &&  donor.__bem.element)
					prefix += separators.element + donor.__bem.element;
				
				return prefix + separators[entityType] + cleanName;
			}
		}
		
		return name;
	}
	
	/**
	 * Recursive function for processing tags, which extends class names 
	 * according to BEM specs: http://bem.github.com/bem-method/pages/beginning/beginning.ru.html
	 * <br><br>
	 * It does several things:<br>
	 * <ul>
	 * <li>Expands complex class name (according to BEM symbol semantics):
	 * .block__elem_modifier → .block.block__elem.block__elem_modifier
	 * </li>
	 * <li>Inherits block name on child elements: 
	 * .b-block > .__el > .__el → .b-block > .b-block__el > .b-block__el__el
	 * </li>
	 * <li>Treats first dash symbol as '__'</li>
	 * <li>Double underscore (or typographic '–') is also treated as an element 
	 * level lookup, e.g. ____el will search for element definition in parent’s 
	 * parent element:
	 * .b-block > .__el1 > .____el2 → .b-block > .b-block__el1 > .b-block__el2
	 * </li>
	 * </ul>
	 * 
	 * @param {ZenNode} tree
	 * @param {Object} profile
	 * @param {Number} [level] Depth level
	 */
	function process(tree, profile, level) {
		if (tree.name)
			bemParse(tree);
		
		var elements = zen_coding.require('elements');
		
		for (var i = 0, il = tree.children.length; i < il; i++) {
			var item = tree.children[i];
			process(bemParse(item), profile);
			if (elements.is(item.source, 'parsedElement') && item.start)
				shouldRunHtmlFilter = true;
		}
		
		return tree;
	};
	
	/**
	 * @param {ZenNode} tree
	 * @param {Object} profile
	 * @param {Number} [level] Depth level
	 */
	return function(tree, profile, level) {
		shouldRunHtmlFilter = false;
		tree = process(tree, profile, level);
		// in case 'bem' filter is applied after 'html' filter: run it again
		// to update output
		if (shouldRunHtmlFilter) {
			tree = zen_coding.require('filters').apply(tree, 'html', profile);
		}
		
		return tree;
	};
})());/**
 * Comment important tags (with 'id' and 'class' attributes)
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 */zen_coding.require('filters').add('c', (function() {
	/**
	 * Add comments to tag
	 * @param {ZenNode} node
	 */
	function addComments(node, i) {
		var utils = zen_coding.require('utils');
		
		var id_attr = node.getAttribute('id'),
			class_attr = node.getAttribute('class'),
			nl = utils.getNewline();
			
		if (id_attr || class_attr) {
			var comment_str = '',
				padding = (node.parent) ? node.parent.padding : '';
			if (id_attr) comment_str += '#' + id_attr;
			if (class_attr) comment_str += '.' + class_attr;
			
			node.start = node.start.replace(/</, '<!-- ' + comment_str + ' -->' + nl + padding + '<');
			node.end = node.end.replace(/>/, '>' + nl + padding + '<!-- /' + comment_str + ' -->');
			
			// replace counters
			var counter = utils.getCounterForNode(node);
			node.start = utils.replaceCounter(node.start, counter);
			node.end = utils.replaceCounter(node.end, counter);
		}
	}
	
	function process(tree, profile) {
		if (profile.tag_nl === false)
			return tree;
		
		var elemens = zen_coding.require('element');
			
		for (var i = 0, il = tree.children.length; i < il; i++) {
			/** @type {ZenNode} */
			var item = tree.children[i];
			
			if (item.isBlock() && elements.is(item.source, 'parsedElement'))
				addComments(item, i);
			
			process(item, profile);
		}
		
		return tree;
	}
	
	return process;
})());/**
 * Filter for escaping unsafe XML characters: <, >, &
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 */(function(){
	var char_map = {
		'<': '&lt;',
		'>': '&gt;',
		'&': '&amp;'
	};
	
	function escapeChars(str) {
		return str.replace(/([<>&])/g, function(str, p1){
			return char_map[p1];
		});
	}
	
	function process(tree, profile, level) {
		for (var i = 0, il = tree.children.length; i < il; i++) {
			/** @type {ZenNode} */
			var item = tree.children[i];
			
			item.start = escapeChars(item.start);
			item.end = escapeChars(item.end);
			
			process(item);
		}
		
		return tree;
	}
	
	zen_coding.require('filters').add('e', process);
})();/**
 * Format CSS properties: add space after property name:
 * padding:0; → padding: 0;
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 */(function(){
	function process(tree, profile) {
		var elements = zen_coding.require('elements');
		for (var i = 0, il = tree.children.length; i < il; i++) {
			/** @type {ZenNode} */
			var item = tree.children[i];
			
			// CSS properties are always snippets 
			if (elements.is(item.source, 'parsedSnippet')) {
				item.start = item.start.replace(/([\w\-]+\s*:)(?!:)\s*/, '$1 ');
			}
			
			process(item, profile);
		}
		
		return tree;
	}
	
	zen_coding.require('filters').add('fc', process);
})();/**
 * Generic formatting filter: creates proper indentation for each tree node,
 * placing "%s" placeholder where the actual output should be. You can use
 * this filter to preformat tree and then replace %s placeholder to whatever you
 * need. This filter should't be called directly from editor as a part 
 * of abbreviation.
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * 
 * @include "../zen_coding.js"
 */(function(){
	var child_token = '${child}',
		placeholder = '%s';
	
	function getNewline() {
		return zen_coding.require('resources').getVariable('newline');
	}
	
	function getIndentation() {
		return zen_coding.require('resources').getVariable('indentation');
	}
	
	/**
	 * Test if passed node has block-level sibling element
	 * @param {ZenNode} item
	 * @return {Boolean}
	 */
	function hasBlockSibling(item) {
		return (item.parent && item.parent.hasBlockChildren());
	}
	
	/**
	 * Test if passed itrem is very first child of the whole tree
	 * @param {ZenNode} tree
	 */
	function isVeryFirstChild(item) {
		return item.parent && !item.parent.parent && !item.previousSibling;
	}
	
	/**
	 * Need to add line break before element
	 * @param {ZenNode} node
	 * @param {Object} profile
	 * @return {Boolean}
	 */
	function shouldBreakLine(node, profile) {
		if (!profile.inline_break)
			return false;
			
		// find toppest non-inline sibling
		while (node.previousSibling && node.previousSibling.isInline())
			node = node.previousSibling;
		
		if (!node.isInline())
			return false;
			
		// calculate how many inline siblings we have
		var node_count = 1;
		while (node = node.nextSibling) {
			if (node.type == 'text' || !node.isInline())
				node_count = 0;
			else if (node.isInline())
				node_count++;
		}
		
		return node_count >= profile.inline_break;
	}
	
	/**
	 * Need to add newline because <code>item</code> has too many inline children
	 * @param {ZenNode} node
	 * @param {Object} profile
	 */
	function shouldBreakChild(node, profile) {
		// we need to test only one child element, because 
		// hasBlockChildren() method will do the rest
		return (node.children.length && shouldBreakLine(node.children[0], profile));
	}
	
	/**
	 * Processes element with <code>snippet</code> type
	 * @param {ZenNode} item
	 * @param {Object} profile
	 * @param {Number} [level] Depth level
	 */
	function processSnippet(item, profile, level) {
		var data = item.source.value;
			
		if (!data)
			// snippet wasn't found, process it as tag
			return processTag(item, profile, level);
			
		item.start = item.end = placeholder;
		
		var utils = zen_coding.require('utils');
		var padding = (item.parent) 
			? item.parent.padding
			: utils.repeatString(getIndentation(), level);
		
		if (!isVeryFirstChild(item)) {
			item.start = getNewline() + padding + item.start;
		}
		
		// adjust item formatting according to last line of <code>start</code> property
		var parts = data.split(child_token),
			lines = utils.splitByLines(parts[0] || ''),
			padding_delta = getIndentation();
			
		if (lines.length > 1) {
			var m = lines[lines.length - 1].match(/^(\s+)/);
			if (m)
				padding_delta = m[1];
		}
		
		item.padding = padding + padding_delta;
		
		return item;
	}
	
	/**
	 * Processes element with <code>tag</code> type
	 * @param {ZenNode} item
	 * @param {Object} profile
	 * @param {Number} [level] Depth level
	 */
	function processTag(item, profile, level) {
		if (!item.name)
			// looks like it's a root element
			return item;
		
		item.start = item.end = placeholder;
		var utils = zen_coding.require('utils');
		var is_unary = (item.isUnary() && !item.children.length);
			
		// formatting output
		if (profile.tag_nl !== false) {
			var padding = (item.parent) 
					? item.parent.padding
					: utils.repeatString(getIndentation(), level),
				force_nl = (profile.tag_nl === true),
				should_break = shouldBreakLine(item, profile);
			
			// formatting block-level elements
			if (item.type != 'text') {
				if (( (item.isBlock() || should_break) && item.parent) || force_nl) {
					// snippet children should take different formatting
					if (!item.parent || (item.parent.type != 'snippet' && !isVeryFirstChild(item)))
						item.start = getNewline() + padding + item.start;
						
					if (item.hasBlockChildren() || shouldBreakChild(item, profile) || (force_nl && !is_unary))
						item.end = getNewline() + padding + item.end;
						
					if (item.hasTagsInContent() || (force_nl && !item.hasChildren() && !is_unary))
						item.start += getNewline() + padding + getIndentation();
					
				} else if (item.isInline() && hasBlockSibling(item) && !isVeryFirstChild(item)) {
					item.start = getNewline() + padding + item.start;
				} else if (item.isInline() && item.hasBlockChildren()) {
					item.end = getNewline() + padding + item.end;
				}
				
				item.padding = padding + getIndentation();
			}
		}
		
		return item;
	}
	
	/**
	 * Processes simplified tree, making it suitable for output as HTML structure
	 * @param {ZenNode} tree
	 * @param {Object} profile
	 * @param {Number} [level] Depth level
	 */
	function process(tree, profile, level) {
		level = level || 0;
		var utils = zen_coding.require('utils');
		
		for (var i = 0, il = tree.children.length; i < il; i++) {
			/** @type {ZenNode} */
			var item = tree.children[i];
			item = (item.type == 'tag') 
				? processTag(item, profile, level) 
				: processSnippet(item, profile, level);
				
			if (item.content)
				item.content = utils.padString(item.content, item.padding);
				
			process(item, profile, level + 1);
		}
		
		return tree;
	}
	
	zen_coding.require('filters').add('_format', process);
})();/**
 * Filter that produces HAML tree
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * 
 * @include "../zen_coding.js"
 */
(function(){
	var child_token = '${child}';
	
	/**
	 * Returns proper string case, depending on profile value
	 * @param {String} val String to process
	 * @param {String} caseParam Profile's case value ('lower', 'upper', 'leave')
	 */
	function processStringCase(val, caseParam) {
		switch (String(caseParam || '').toLowerCase()) {
			case 'lower':
				return val.toLowerCase();
			case 'upper':
				return val.toUpperCase();
		}
		
		return val;
	}
	
	/**
	 * Creates HTML attributes string from tag according to profile settings
	 * @param {ZenNode} tag
	 * @param {default_profile} profile
	 */
	function makeAttributesString(tag, profile) {
		// make attribute string
		var attrs = '';
		var otherAttrs = [];
		var attrQuote = profile.attr_quotes == 'single' ? "'" : '"';
		var cursor = profile.place_cursor ? zen_coding.require('utils').getCaretPlaceholder() : '';
		
		/** @type Underscore */
		var _ = zen_coding.require('_');
		
		_.each(tag.attributes, function(a) {
			switch (a.name.toLowerCase()) {
				// use short notation for ID and CLASS attributes
				case 'id':
					attrs += '#' + (a.value || cursor);
					break;
				case 'class':
					attrs += '.' + (a.value || cursor);
					break;
				// process other attributes
				default:
					var attrName = processStringCase(a.name, profile.attr_case);
					otherAttrs.push(':' +attrName + ' => ' + attrQuote + (a.value || cursor) + attrQuote);
			}
		});
		
		if (otherAttrs.length)
			attrs += '{' + otherAttrs.join(', ') + '}';
		
		return attrs;
	}
	
	/**
	 * Processes element with <code>snippet</code> type
	 * @param {ZenNode} item
	 * @param {Object} profile
	 * @param {Number} [level] Depth level
	 */
	function processSnippet(item, profile, level) {
		var data = item.source.value;
		var utils = zen_coding.require('utils');
		var res = zen_coding.require('resources');
			
		if (!data)
			// snippet wasn't found, process it as tag
			return processTag(item, profile, level);
			
		var parts = data.split(child_token),
			start = parts[0] || '',
			end = parts[1] || '',
			padding = item.parent ? item.parent.padding : '';
			
		item.start = item.start.replace('%s', utils.padString(start, padding));
		item.end = item.end.replace('%s', utils.padString(end, padding));
		
		var startPlaceholderNum = 100;
		var placeholderMemo = {};
		
		// replace variables ID and CLASS
		var cb = function(str, varName) {
			var attr = item.getAttribute(varName);
			if (attr !== null)
				return attr;
			
			var varValue = res.getVariable(varName);
			if (varValue)
				return varValue;
			
			// output as placeholder
			if (!placeholderMemo[varName])
				placeholderMemo[varName] = startPlaceholderNum++;
				
			return '${' + placeholderMemo[varName] + ':' + varName + '}';
		};
		
		item.start = utils.replaceVariables(item.start, cb);
		item.end = utils.replaceVariables(item.end, cb);
		
		return item;
	}
	
	/**
	 * Test if passed node has block-level sibling element
	 * @param {ZenNode} item
	 * @return {Boolean}
	 */
	function hasBlockSibling(item) {
		return (item.parent && item.parent.hasBlockChildren());
	}
	
	/**
	 * Processes element with <code>tag</code> type
	 * @param {ZenNode} item
	 * @param {Object} profile
	 * @param {Number} [level] Depth level
	 */
	function processTag(item, profile, level) {
		if (!item.name)
			// looks like it's root element
			return item;
		
		var attrs = makeAttributesString(item, profile), 
			content = '', 
			cursor = profile.place_cursor ? zen_coding.require('utils').getCaretPlaceholder() : '',
			self_closing = '',
			is_unary = (item.isUnary() && !item.children.length),
			start= '',
			end = '';
		
		if (profile.self_closing_tag && is_unary)
			self_closing = '/';
			
		// define tag name
		var tag_name = '%' + ((profile.tag_case == 'upper') ? item.name.toUpperCase() : item.name.toLowerCase());
		if (tag_name.toLowerCase() == '%div' && attrs && attrs.indexOf('{') == -1)
			// omit div tag
			tag_name = '';
			
		item.end = '';
		start = tag_name + attrs + self_closing + ' ';
		
		var placeholder = '%s';
		// We can't just replace placeholder with new value because
		// JavaScript will treat double $ character as a single one, assuming
		// we're using RegExp literal. 
		var pos = item.start.indexOf(placeholder);
		item.start = item.start.substring(0, pos) + start + item.start.substring(pos + placeholder.length);
		
		if (!item.children.length && !is_unary)
			item.start += cursor;
		
		return item;
	}
	
	/**
	 * Processes simplified tree, making it suitable for output as HTML structure
	 * @param {ZenNode} tree
	 * @param {Object} profile
	 * @param {Number} [level] Depth level
	 */
	function process(tree, profile, level) {
		level = level || 0;
		/** @type Underscore */
		var _ = zen_coding.require('_');
		/** @type zen_coding.utils */
		var utils = zen_coding.require('utils');
		var editorUtils = zen_coding.require('editorUtils');
		var elements = zen_coding.require('elements');
		
		if (level == 0)
			// preformat tree
			tree = zen_coding.require('filters').apply(tree, '_format', profile);
		
		_.each(tree.children, function(item) {
			item = elements.is(item.source, 'parsedElement') 
				? processTag(item, profile, level) 
				: processSnippet(item, profile, level);
			
			// replace counters
			var counter = editorUtils.getCounterForNode(item);
			item.start = utils.unescapeText(utils.replaceCounter(item.start, counter));
			item.end = utils.unescapeText(utils.replaceCounter(item.end, counter));
			
			process(item, profile, level + 1);
		});
		
		return tree;
	}
	
	zen_coding.require('filters').add('haml', process);
})();/**
 * Filter that produces HTML tree
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * 
 * @include "../zen_coding.js"
 */
(function(){
	var child_token = '${child}',
		tabstops = 0;
		
	/**
	 * Returns proper string case, depending on profile value
	 * @param {String} val String to process
	 * @param {String} case_param Profile's case value ('lower', 'upper', 'leave')
	 */
	function processStringCase(val, case_param) {
		switch (String(case_param || '').toLowerCase()) {
			case 'lower':
				return val.toLowerCase();
			case 'upper':
				return val.toUpperCase();
		}
		
		return val;
	}
	
	/**
	 * Creates HTML attributes string from tag according to profile settings
	 * @param {ZenNode} tag
	 * @param {default_profile} profile
	 */
	function makeAttributesString(tag, profile) {
		// make attribute string
		var attrs = '',
			attr_quote = profile.attr_quotes == 'single' ? "'" : '"',
			cursor = profile.place_cursor ? zen_coding.require('utils').getCaretPlaceholder() : '',
			attr_name;
			
		for (var i = 0; i < tag.attributes.length; i++) {
			var a = tag.attributes[i];
			attr_name = processStringCase(a.name, profile.attr_case);
			attrs += ' ' + attr_name + '=' + attr_quote + (a.value || cursor) + attr_quote;
		}
		
		return attrs;
	}
	
	/**
	 * Processes element with <code>snippet</code> type
	 * @param {ZenNode} item
	 * @param {Object} profile
	 * @param {Number} [level] Depth level
	 */
	function processSnippet(item, profile, level) {
		var data = item.source.value;
		var utils = zen_coding.require('utils');
		var res = zen_coding.require('resources');
			
		if (!data)
			// snippet wasn't found, process it as tag
			return processTag(item, profile, level);
			
		var parts = data.split(child_token),
			start = parts[0] || '',
			end = parts[1] || '',
			padding = item.parent ? item.parent.padding : '';
			
			
		item.start = item.start.replace('%s', utils.padString(start, padding));
		item.end = item.end.replace('%s', utils.padString(end, padding));
		
		var startPlaceholderNum = 100;
		var placeholderMemo = {};
		
		// replace variables ID and CLASS
		var cb = function(str, varName) {
			var attr = item.getAttribute(varName);
			if (attr !== null)
				return attr;
			
			var varValue = res.getVariable(varName);
			if (varValue)
				return varValue;
			
			// output as placeholder
			if (!placeholderMemo[varName])
				placeholderMemo[varName] = startPlaceholderNum++;
				
			return '${' + placeholderMemo[varName] + ':' + varName + '}';
		};
		
		item.start = utils.replaceVariables(item.start, cb);
		item.end = utils.replaceVariables(item.end, cb);
		
		return item;
	}
	
	/**
	 * Test if passed node has block-level sibling element
	 * @param {ZenNode} item
	 * @return {Boolean}
	 */
	function hasBlockSibling(item) {
		return (item.parent && item.parent.hasBlockChildren());
	}
	
	/**
	 * Processes element with <code>tag</code> type
	 * @param {ZenNode} item
	 * @param {Object} profile
	 * @param {Number} [level] Depth level
	 */
	function processTag(item, profile, level) {
		if (!item.name)
			// looks like it's root element
			return item;
		
		var attrs = makeAttributesString(item, profile), 
			cursor = profile.place_cursor ? zen_coding.require('utils').getCaretPlaceholder() : '',
			self_closing = '',
			is_unary = (item.isUnary() && !item.children.length),
			start= '',
			end = '';
		
		if (profile.self_closing_tag == 'xhtml')
			self_closing = ' /';
		else if (profile.self_closing_tag === true)
			self_closing = '/';
			
		// define opening and closing tags
		if (item.type != 'text') {
			var tag_name = processStringCase(item.name, profile.tag_case);
			if (is_unary) {
				start = '<' + tag_name + attrs + self_closing + '>';
				item.end = '';
			} else {
				start = '<' + tag_name + attrs + '>';
				end = '</' + tag_name + '>';
			}
		}
		
		var placeholder = '%s';
		// We can't just replace placeholder with new value because
		// JavaScript will treat double $ character as a single one, assuming
		// we're using RegExp literal. 
		var pos = item.start.indexOf(placeholder);
		item.start = item.start.substring(0, pos) + start + item.start.substring(pos + placeholder.length);
		
		pos = item.end.indexOf(placeholder);
		item.end = item.end.substring(0, pos) + end + item.end.substring(pos + placeholder.length);
		
		if (!item.children.length && !is_unary && item.content.indexOf(cursor) == -1)
			item.start += cursor;
		
		return item;
	}
	
	/**
	 * Processes simplified tree, making it suitable for output as HTML structure
	 * @param {ZenNode} tree
	 * @param {Object} profile
	 * @param {Number} [level] Depth level
	 */
	function process(tree, profile, level) {
		level = level || 0;
		if (level == 0) {
			tree = zen_coding.require('filters').apply(tree, '_format', profile);
			tabstops = 0;
		}
		
		var utils = zen_coding.require('utils');
		var editorUtils = zen_coding.require('editorUtils');
		var elements = zen_coding.require('elements');
		
		for (var i = 0, il = tree.children.length; i < il; i++) {
			/** @type {ZenNode} */
	
			var item = tree.children[i];
			item = elements.is(item.source, 'parsedElement') 
				? processTag(item, profile, level) 
				: processSnippet(item, profile, level);
			
			// replace counters
			var counter = editorUtils.getCounterForNode(item);
			item.start = utils.unescapeText(utils.replaceCounter(item.start, counter));
			item.end = utils.unescapeText(utils.replaceCounter(item.end, counter));
			item.content = utils.unescapeText(utils.replaceCounter(item.content, counter));
			
			tabstops += editorUtils.upgradeTabstops(item, tabstops) + 1;
			
			process(item, profile, level + 1);
		}
		
		return tree;
	}
	
	zen_coding.require('filters').add('html', process);
})();/**
 * Output abbreviation on a single line (i.e. no line breaks)
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 */
(function(){
	function process(tree, profile, level) {
		var elements = zen_coding.require('elements');
		for (var i = 0, il = tree.children.length; i < il; i++) {
			/** @type {ZenNode} */
			var item = tree.children[i];
			if (elements.is(item.source, 'parsedElement')) {
				// remove padding from item 
				var re_pad = /^\s+/;
				item.start = item.start.replace(re_pad, '');
				item.end = item.end.replace(re_pad, '');
			}
			
			// remove newlines 
			var re_nl = /[\n\r]/g;
			item.start = item.start.replace(re_nl, '');
			item.end = item.end.replace(re_nl, '');
			item.content = item.content.replace(re_nl, '');
			
			process(item);
		}
		
		return tree;
	}
	
	zen_coding.require('filters').add('s', process);
})();/**
 * Trim filter: removes characters at the beginning of the text
 *  content that indicates lists: numbers, #, *, -, etc.
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 */
(function(){
	function process(tree, profile, level) {
		for (var i = 0, il = tree.children.length; i < il; i++) {
			/** @type {ZenNode} */
			var item = tree.children[i];
			
			if (item.content)
				item.content = item.content.replace(/^([\s|\u00a0])?[\d|#|\-|\*|\u2022]+\.?\s*/, '$1');
			
			process(item);
		}
		
		return tree;
	}
	
	zen_coding.require('filters').add('t', process);
})();/**
 * Filter for trimming "select" attributes from some tags that contains
 * child elements
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 */(function(){
	var tags = {
		'xsl:variable': 1,
		'xsl:with-param': 1
	};
	
	/**
	 * Removes "select" attribute from node
	 * @param {ZenNode} node
	 */
	function trimAttribute(node) {
		node.start = node.start.replace(/\s+select\s*=\s*(['"]).*?\1/, '');
	}
	
	function process(tree) {
		var elements = zen_coding.require('elements');
		for (var i = 0, il = tree.children.length; i < il; i++) {
			/** @type {ZenNode} */
			var item = tree.children[i];
			if (elements.is(item.source, 'parsedElement') && item.name.toLowerCase() in tags && item.children.length)
				trimAttribute(item);
			process(item);
		}
	}
	
	zen_coding.require('filters').add('xsl', process);
})();/**
 * Encodes/decodes image under cursor to/from base64
 * @param {IZenEditor} editor
 * @since 0.65
 */
(function() {
	zen_coding.require('actions').add('encode_decode_data_url', function(editor) {
		var data = String(editor.getSelection());
		var caretPos = editor.getCaretPos();
			
		if (!data) {
			// no selection, try to find image bounds from current caret position
			var text = String(editor.getContent()), ch, m;
			while (caretPos-- >= 0) {
				if (startsWith('src=', text, caretPos)) { // found <img src="">
					if (m = text.substr(caretPos).match(/^(src=(["'])?)([^'"<>\s]+)\1?/)) {
						data = m[3];
						caretPos += m[1].length;
					}
					break;
				} else if (startsWith('url(', text, caretPos)) { // found CSS url() pattern
					if (m = text.substr(caretPos).match(/^(url\((['"])?)([^'"\)\s]+)\1?/)) {
						data = m[3];
						caretPos += m[1].length;
					}
					break;
				}
			}
		}
		
		if (data) {
			if (startsWith('data:', data))
				return decodeFromBase64(editor, data, caretPos);
			else
				return encodeToBase64(editor, data, caretPos);
		}
		
		return false;
	});
	
	/**
	 * Test if <code>text</code> starts with <code>token</code> at <code>pos</code>
	 * position. If <code>pos</code> is ommited, search from beginning of text 
	 * @param {String} token Token to test
	 * @param {String} text Where to search
	 * @param {Number} pos Position where to start search
	 * @return {Boolean}
	 * @since 0.65
	 */
	function startsWith(token, text, pos) {
		pos = pos || 0;
		return text.charAt(pos) == token.charAt(0) && text.substr(pos, token.length) == token;
	}
	
	/**
	 * Encodes image to base64
	 * @requires zen_file
	 * 
	 * @param {zen_editor} editor
	 * @param {String} imgPath Path to image
	 * @param {Number} pos Caret position where image is located in the editor
	 * @return {Boolean}
	 */
	function encodeToBase64(editor, imgPath, pos) {
		var file = zen_coding.require('file');
		var actionUtils = zen_coding.require('actionUtils');
		
		var editorFile = editor.getFilePath();
		var defaultMimeType = 'application/octet-stream';
			
		if (editorFile === null) {
			throw "You should save your file before using this action";
		}
		
		// locate real image path
		var realImgPath = file.locateFile(editorFile, imgPath);
		if (realImgPath === null) {
			throw "Can't find " + imgPath + ' file';
		}
		
		var b64 = zen_coding.require('base64').encode(String(file.read(realImgPath)));
		if (!b64) {
			throw "Can't encode file content to base64";
		}
		
		b64 = 'data:' + (actionUtils.mimeTypes[String(file.getExt(realImgPath))] || defaultMimeType) +
			';base64,' + b64;
			
		editor.replaceContent('$0' + b64, pos, pos + imgPath.length);
		return true;
	}

	/**
	 * Decodes base64 string back to file.
	 * @requires zen_editor.prompt
	 * @requires zen_file
	 * 
	 * @param {zen_editor} editor
	 * @param {String} data Base64-encoded file content
	 * @param {Number} pos Caret position where image is located in the editor
	 */
	function decodeFromBase64(editor, data, pos) {
		// ask user to enter path to file
		var filePath = String(editor.prompt('Enter path to file (absolute or relative)'));
		if (!filePath)
			return false;
			
		var absPath = zen_file.createPath(editor.getFilePath(), filePath);
		if (!absPath) {
			throw "Can't save file";
		}
		
		zen_coding.require('file').save(absPath, zen_coding.require('base64').decode( data.replace(/^data\:.+?;.+?,/, '') ));
		editor.replaceContent('$0' + filePath, pos, pos + data.length);
		return true;
	}
})();
/**
 * Move between next/prev edit points. 'Edit points' are places between tags 
 * and quotes of empty attributes in html
 */
(function() {
	/** @type zen_coding.actions */
	var actions = zen_coding.require('actions');
	/**
	 * Search for new caret insertion point
	 * @param {zen_editor} editor Editor instance
	 * @param {Number} inc Search increment: -1 — search left, 1 — search right
	 * @param {Number} offset Initial offset relative to current caret position
	 * @return {Number} Returns -1 if insertion point wasn't found
	 */
	function findNewEditPoint(editor, inc, offset) {
		inc = inc || 1;
		offset = offset || 0;
		
		var curPoint = editor.getCaretPos() + offset;
		var content = String(editor.getContent());
		var maxLen = content.length;
		var nextPoint = -1;
		var reEmptyLine = /^\s+$/;
		
		function ch(ix) {
			return content.charAt(ix);
		}
		
		function getLine(ix) {
			var start = ix;
			while (start >= 0) {
				var c = ch(start);
				if (c == '\n' || c == '\r')
					break;
				start--;
			}
			
			return content.substring(start, ix);
		}
			
		while (curPoint < maxLen && curPoint > 0) {
			curPoint += inc;
			var cur_char = ch(curPoint),
				next_char = ch(curPoint + 1),
				prev_char = ch(curPoint - 1);
				
			switch (cur_char) {
				case '"':
				case '\'':
					if (next_char == cur_char && prev_char == '=') {
						// empty attribute
						nextPoint = curPoint + 1;
					}
					break;
				case '>':
					if (next_char == '<') {
						// between tags
						nextPoint = curPoint + 1;
					}
					break;
				case '\n':
				case '\r':
					// empty line
					if (reEmptyLine.test(getLine(curPoint - 1))) {
						nextPoint = curPoint;
					}
					break;
			}
			
			if (nextPoint != -1)
				break;
		}
		
		return nextPoint;
	}
		
	/**
	 * Move caret to previous edit point
	 * @param {zen_editor} editor Editor instance
	 */
	actions.add('prev_edit_point', function(editor) {
		var curPos = editor.getCaretPos();
		var newPoint = findNewEditPoint(editor, -1);
			
		if (newPoint == curPos)
			// we're still in the same point, try searching from the other place
			newPoint = findNewEditPoint(editor, -1, -2);
		
		if (newPoint != -1) {
			editor.setCaretPos(newPoint);
			return true;
		}
		
		return false;
	});
	
	/**
	 * Move caret to next edit point
	 * @param {zen_editor} editor Editor instance
	 */
	actions.add('next_edit_point', function(editor) {
		var newPoint = findNewEditPoint(editor, 1);
		if (newPoint != -1)
			editor.setCaretPos(newPoint);
	});
})();/**
 * Evaluates simple math expression under caret
 * @param {IZenEditor} editor
 */
zen_coding.require('actions').add('evaluate_math_expression', function(editor) {
	var actionUtils = zen_coding.require('actionUtils');
	var utils = zen_coding.require('utils');
	
	var content = String(editor.getContent());
	var chars = '.+-*/\\';
		
	var r = actionUtils.findExpressionBounds(editor, function(ch) {
		return utils.isNumeric(ch) || chars.indexOf(ch) != -1;
	});
		
	if (r) {
		var expr = content.substring(r[0], r[1]);
		
		// replace integral division: 11\2 => Math.round(11/2) 
		expr = expr.replace(/([\d\.\-]+)\\([\d\.\-]+)/g, 'Math.round($1/$2)');
		
		try {
			var result = new Function('return ' + expr)();
			result = utils.prettifyNumber(result);
			editor.replaceContent(result, r[0], r[1]);
			editor.setCaretPos(r[0] + result.length);
			return true;
		} catch (e) {}
	}
	
	return false;
});
(function() {
	var actions = zen_coding.require('actions');
	
	/**
	 * Search for abbreviation in editor from current caret position
	 * @param {IZenEditor} editor Editor instance
	 * @return {String}
	 */
	function findAbbreviation(editor) {
		var range = editor.getSelectionRange();
		var content = String(editor.getContent());
		if (range.start != range.end) {
			// abbreviation is selected by user
			return content.substring(range.start, range.end);
		}
		
		// search for new abbreviation from current caret position
		var curLine = editor.getCurrentLineRange();
		return zen_coding.require('actionUtils').extractAbbreviation(content.substring(curLine.start, range.start));
	}
	
	/**
	 * 'Expand abbreviation' editor action: extracts abbreviation from current caret 
	 * position and replaces it with formatted output 
	 * @param {IZenEditor} editor Editor instance
	 * @param {String} syntax Syntax type (html, css, etc.)
	 * @param {String} profile Output profile name (html, xml, xhtml)
	 * @return {Boolean} Returns <code>true</code> if abbreviation was expanded 
	 * successfully
	 */
	actions.add('expand_abbreviation', function(editor, syntax, profile) {
		syntax = String(syntax || editor.getSyntax());
		profile = String(profile || editor.getProfileName());
		
		var caretPos = editor.getSelectionRange().end;
		var abbr;
		var content = '';
			
		if ( (abbr = findAbbreviation(editor)) ) {
			content = zen_coding.expandAbbreviation(abbr, syntax, profile, 
					zen_coding.require('actionUtils').captureContext(editor));
			if (content) {
				editor.replaceContent(content, caretPos - abbr.length, caretPos);
				return true;
			}
		}
		
		return false;
	});
	
	/**
	 * A special version of <code>expandAbbreviation</code> function: if it can't
	 * find abbreviation, it will place Tab character at caret position
	 * @param {IZenEditor} editor Editor instance
	 * @param {String} syntax Syntax type (html, css, etc.)
	 * @param {String} profile Output profile name (html, xml, xhtml)
	 */
	actions.add('expand_abbreviation_with_tab', function(editor, syntax, profile) {
		if (!actions.run('expand_abbreviation', editor, syntax, profile))
			editor.replaceContent(zen_coding.require('resources').getVariable('indentation'), editor.getCaretPos());
	});
})();/**
 * Increment/decrement number under cursor
 */
(function() {
	/**
	 * Extract number from current caret position of the <code>editor</code> and
	 * increment it by <code>step</code>
	 * @param {zen_editor} editor
	 * @param {Number} step Increment step (may be negative)
	 */
	function incrementNumber(editor, step) {
		var utils = zen_coding.require('utils');
		var actionUtils = zen_coding.require('actionUtils');
		
		var hasSign = false;
		var hasDecimal = false;
			
		var r = actionUtils.findExpressionBounds(editor, function(ch, pos, content) {
			if (utils.isNumeric(ch))
				return true;
			if (ch == '.') {
				// make sure that next character is numeric too
				if (!utils.isNumeric(content.charAt(pos + 1)))
					return false;
				
				return hasDecimal ? false : hasDecimal = true;
			}
			if (ch == '-')
				return hasSign ? false : hasSign = true;
				
			return false;
		});
			
		if (r) {
			var num = parseFloat(String(editor.getContent()).substring(r[0], r[1]));
			if (!isNaN(num)) {
				num = utils.prettifyNumber(num + step);
				editor.replaceContent(num, r[0], r[1]);
				editor.createSelection(r[0], r[0] + num.length);
				return true;
			}
		}
		
		return false;
	}
	
	var actions = zen_coding.require('actions');
	_.each([1, -1, 10, -10, 0.1, -0.1], function(num) {
		var prefix = num > 0 ? 'increment' : 'decrement';
		
		actions.add(prefix + '_number_by_' + String(Math.abs(num)).replace('.', '').substring(0, 2), function(editor) {
			return incrementNumber(editor, num);
		});
	});
})();/**
 * Actions to insert line breaks. Some simple editors (like browser's 
 * &lt;textarea&gt;, for example) do not provide such simple things
 */
(function() {
	var actions = zen_coding.require('actions');
	
	/**
	 * Inserts newline character with proper indentation in specific positions only.
	 * @param {IZenEditor} editor
	 * @return {Boolean} Returns <code>true</code> if line break was inserted 
	 */
	actions.add('insert_formatted_line_break_only', function(editor) {
		var utils = zen_coding.require('utils');
		/** @type zen_coding.editorUtils */
		var editorUtils = zen_coding.require('editorUtils');
		var matcher = zen_coding.require('html_matcher');
		/** @type zen_coding.resources */
		var res = zen_coding.require('resources');
		
		var info = editorUtils.outputInfo(editor);
		var caretPos = editor.getCaretPos();
		var nl = utils.getNewline();
		var pad = res.getVariable('indentation');
		
			
		if (info.syntax == 'html') {
			// let's see if we're breaking newly created tag
			var pair = matcher.getTags(info.content, caretPos, info.profile);
			
			if (pair[0] && pair[1] && pair[0].type == 'tag' && pair[0].end == caretPos && pair[1].start == caretPos) {
				editor.replaceContent(nl + pad + utils.getCaretPlaceholder() + nl, caretPos);
				return true;
			}
		} else if (info.syntax == 'css') {
			if (caretPos && info.content.charAt(caretPos - 1) == '{') {
				// look ahead for a closing brace
				for (var i = caretPos, il = info.content.length, ch; i < il; i++) {
					ch = info.content.charAt(i);
					if (ch == '}') return false;
					if (ch == '{') break;
				}
				
				// defining rule set
				var insValue = nl + pad + utils.getCaretPlaceholder() + nl;
				var hasCloseBrace = caretPos < info.content.length && info.content.charAt(caretPos) == '}';
					
				var userCloseBrace = res.getVariable('close_css_brace');
				if (userCloseBrace) {
					// user defined how close brace should look like
					insValue += utils.replaceVariables(userCloseBrace);
				} else if (!hasCloseBrace) {
					insValue += '}';
				}
				
				editor.replaceContent(insValue, caretPos, caretPos + (hasCloseBrace ? 1 : 0));
				return true;
			}
		}
			
		return false;
	});
	
	/**
	 * Inserts newline character with proper indentation. This action is used in
	 * editors that doesn't have indentation control (like textarea element) to 
	 * provide proper indentation
	 * @param {IZenEditor} editor Editor instance
	 */
	actions.add('insert_formatted_line_break', function(editor) {
		if (!actions.run('insert_formatted_line_break_only', editor)) {
			var editorUtils = zen_coding.require('editorUtils');
			var utils = zen_coding.require('utils');
			
			var curPadding = editorUtils.getCurrentLinePadding(editor);
			var content = String(editor.getContent());
			var caret_pos = editor.getCaretPos();
			var c_len = content.length;
			var nl = utils.getNewline();
				
			// check out next line padding
			var lineRange = editor.getCurrentLineRange();
			var nextPadding = '';
				
			for (var i = lineRange.end + 1, ch; i < c_len; i++) {
				ch = content.charAt(i);
				if (ch == ' ' || ch == '\t')
					nextPadding += ch;
				else
					break;
			}
			
			if (nextPadding.length > curPadding.length)
				editor.replaceContent(nl + nextPadding, caret_pos, caret_pos, true);
			else
				editor.replaceContent(nl, caret_pos);
		}
		
		return true;
	});
})();/**
 * HTML pair matching (balancing) actions
 */
(function() {
	/** @type zen_coding.actions */
	var actions = zen_coding.require('actions');
	var matcher = zen_coding.require('html_matcher');
	
	/**
	 * Find and select HTML tag pair
	 * @param {IZenEditor} editor Editor instance
	 * @param {String} direction Direction of pair matching: 'in' or 'out'. 
	 * Default is 'out'
	 */
	function matchPair(editor, direction, syntax) {
		direction = String((direction || 'out').toLowerCase());
		syntax = String(syntax || editor.getProfileName());
		
		var range = editor.getSelectionRange();
		var cursor = range.end;
		var rangeStart = range.start; 
		var rangeEnd = range.end;
		var content = String(editor.getContent());
		var range = null;
		var _r;
		
		var oldOpenTag = matcher.last_match['opening_tag'];
		var oldCloseTag = matcher.last_match['closing_tag'];
			
		if (direction == 'in' && oldOpenTag && rangeStart != rangeEnd) {
//			user has previously selected tag and wants to move inward
			if (!oldCloseTag) {
//				unary tag was selected, can't move inward
				return false;
			} else if (oldOpenTag.start == rangeStart) {
				if (content.charAt(oldOpenTag.end) == '<') {
//					test if the first inward tag matches the entire parent tag's content
					_r = matcher.find(content, oldOpenTag.end + 1, syntax);
					if (_r[0] == oldOpenTag.end && _r[1] == oldCloseTag.start) {
						range = matcher(content, oldOpenTag.end + 1, syntax);
					} else {
						range = [oldOpenTag.end, oldCloseTag.start];
					}
				} else {
					range = [oldOpenTag.end, oldCloseTag.start];
				}
			} else {
				var new_cursor = content.substring(0, oldCloseTag.start).indexOf('<', oldOpenTag.end);
				var search_pos = new_cursor != -1 ? new_cursor + 1 : oldOpenTag.end;
				range = matcher(content, search_pos, syntax);
			}
		} else {
			range = matcher(content, cursor, syntax);
		}
		
		if (range !== null && range[0] != -1) {
			editor.createSelection(range[0], range[1]);
			return true;
		}
		
		return false;
	}
	
	actions.add('match_pair', matchPair);
	actions.add('match_pair_inward', function(editor){
		return matchPair(editor, 'in');
	});

	actions.add('match_pair_outward', function(editor){
		return matchPair(editor, 'out');
	});
	
	/**
	 * Moves caret to matching opening or closing tag
	 * @param {IZenEditor} editor
	 */
	actions.add('matching_pair', function(editor) {
		var content = String(editor.getContent());
		var caretPos = editor.getCaretPos();
		
		if (content.charAt(caretPos) == '<') 
			// looks like caret is outside of tag pair  
			caretPos++;
			
		var tags = matcher.getTags(content, caretPos, String(editor.getProfileName()));
			
		if (tags && tags[0]) {
			// match found
			var openTag = tags[0];
			var closeTag = tags[1];
				
			if (closeTag) { // exclude unary tags
				if (openTag.start <= caretPos && openTag.end >= caretPos) {
					editor.setCaretPos(closeTag.start);
					return true;
				} else if (closeTag.start <= caretPos && closeTag.end >= caretPos){
					editor.setCaretPos(openTag.start);
					return true;
				}
			}
		}
		
		return false;
	});
})();/**
 * Merges selected lines or lines between XHTML tag pairs
 */
zen_coding.require('actions').add('merge_lines', function(editor) {
	var matcher = zen_coding.require('html_matcher');
	var utils = zen_coding.require('utils');
	var editorUtils = zen_coding.require('editorUtils');
	
	var info = editorUtils.outputInfo(editor);
	
	
	var selection = editor.getSelectionRange();
	if (selection.start == selection.end) {
		// find matching tag
		var pair = matcher(info.content, editor.getCaretPos(), info.profile);
		if (pair) {
			selection.start = pair[0];
			selection.end = pair[1];
		}
	}
	
	if (selection.start != selection.end) {
		// got range, merge lines
		var text = info.content.substring(selection.start, selection.end);
		var oldLength = text.length;
		var lines = utils.splitByLines(text);
		
		for (var i = 1; i < lines.length; i++) {
			lines[i] = lines[i].replace(/^\s+/, '');
		}
		
		text = lines.join('').replace(/\s{2,}/, ' ');
		editor.replaceContent(text, selection.start, selection.end);
		editor.createSelection(selection.start, selection.start + text.length);
		
		return true;
	}
	
	return false;
});/**
 * Reflect CSS value: takes rule's value under caret and pastes it for the same 
 * rules with vendor prefixes
 * @constructor
 * @memberOf __zenReflectCSSAction
 */
(function() {
	zen_coding.require('actions').add('reflect_css_value', function(editor) {
		if (editor.getSyntax() != 'css') return false;
		
		return zen_coding.require('actionUtils').compoundUpdate(editor, doCSSReflection(editor));
	});
	
	function doCSSReflection(editor) {
		/** @type zen_coding.parserUtils */
		var parserUtils = zen_coding.require('parserUtils');
		
		var content = String(editor.getContent());
		var caretPos = editor.getCaretPos();
		var css = parserUtils.extractCSSRule(content, caretPos);
		var v;
			
		if (!css || caretPos < css[0] || caretPos > css[1])
			// no matching CSS rule or caret outside rule bounds
			return false;
			
		var tokens = parserUtils.parseCSS(content.substring(css[0], css[1]), css[0]);
		var token_ix = parserUtils.findTokenFromPosition(tokens, caretPos, 'identifier');
		
		if (token_ix != -1) {
			var cur_prop = tokens[token_ix].content;
			var value_token = parserUtils.findValueToken(tokens, token_ix + 1);
			var base_name = parserUtils.getBaseCSSName(cur_prop);
			var re_name = new RegExp('^(?:\\-\\w+\\-)?' + base_name + '$');
			var re_name = getReflectedCSSName(base_name);
			var values = [];
				
			if (!value_token) return false;
				
			// search for all vendor-prefixed properties
			for (var i = 0, token, il = tokens.length; i < il; i++) {
				token = tokens[i];
				if (token.type == 'identifier' && re_name.test(token.content) && token.content != cur_prop) {
					v = parserUtils.findValueToken(tokens, i + 1);
					if (v) 
						values.push({name: token, value: v});
				}
			}
			
			// some editors do not provide easy way to replace multiple code 
			// fragments so we have to squash all replace operations into one
			if (values.length) {
				var data = content.substring(values[0].value.start, values[values.length - 1].value.end);
				var offset = values[0].value.start;
				var value = value_token.content;
				var rv;
					
				for (var i = values.length - 1; i >= 0; i--) {
					v = values[i].value;
					rv = getReflectedValue(cur_prop, value, values[i].name.content, v.content);
					data = replaceSubstring(data, v.start - offset, v.end - offset, rv);
						
					// also calculate new caret position
					if (v.start < caretPos) {
						caretPos += rv.length - v.content.length;
					}
				}
				
				return {
					'data': data,
					'start': offset,
					'end': values[values.length - 1].value.end,
					'caret': caretPos
				};
			}
		}
	}
	
	/**
	 * Returns regexp that should match reflected CSS property names
	 * @param {String} name Current CSS property name
	 * @return {RegExp}
	 */
	function getReflectedCSSName(name) {
		name = zen_coding.require('parserUtils').getBaseCSSName(name);
		var vendorPrefix = '^(?:\\-\\w+\\-)?', m;
		
		if (name == 'opacity' || name == 'filter') {
			return new RegExp(vendorPrefix + '(?:opacity|filter)$');
		} else if (m = name.match(/^border-radius-(top|bottom)(left|right)/)) {
			// Mozilla-style border radius
			return new RegExp(vendorPrefix + '(?:' + name + '|border-' + m[1] + '-' + m[2] + '-radius)$');
		} else if (m = name.match(/^border-(top|bottom)-(left|right)-radius/)) { 
			return new RegExp(vendorPrefix + '(?:' + name + '|border-radius-' + m[1] + m[2] + ')$');
		}
		
		return new RegExp(vendorPrefix + name + '$');
	}
	
	/**
	 * Returns value that should be reflected for <code>ref_name</code> CSS property
	 * from <code>cur_name</code> property. This function is used for special cases,
	 * when the same result must be achieved with different properties for different
	 * browsers. For example: opаcity:0.5; -> filter:alpha(opacity=50);<br><br>
	 * 
	 * This function does value conversion between different CSS properties
	 * 
	 * @param {String} curName Current CSS property name
	 * @param {String} curValue Current CSS property value
	 * @param {String} refName Receiver CSS property's name 
	 * @param {String} refValue Receiver CSS property's value
	 * @return {String} New value for receiver property
	 */
	function getReflectedValue(curName, curValue, refName, refValue) {
		var parserUtils = zen_coding.require('parserUtils');
		var utils = zen_coding.require('utils');
		curName = parserUtils.getBaseCSSName(curName);
		refName = parserUtils.getBaseCSSName(refName);
		
		if (curName == 'opacity' && refName == 'filter') {
			return refValue.replace(/opacity=[^)]*/i, 'opacity=' + Math.floor(parseFloat(curValue) * 100));
		} else if (curName == 'filter' && refName == 'opacity') {
			var m = curValue.match(/opacity=([^)]*)/i);
			return m ? utils.prettifyNumber(parseInt(m[1]) / 100) : refValue;
		}
		
		return curValue;
	}
	
	/**
	 * Replace substring of <code>text</code>, defined by <code>start</code> and 
	 * <code>end</code> indexes with <code>new_value</code>
	 * @param {String} text
	 * @param {Number} start
	 * @param {Number} end
	 * @param {String} new_value
	 * @return {String}
	 */
	function replaceSubstring(text, start, end, new_value) {
		return text.substring(0, start) + new_value + text.substring(end);
	}
})();/**
 * Gracefully removes tag under cursor
 * @param {IZenEditor} editor
 */
zen_coding.require('actions').add('remove_tag', function(editor) {
	var utils = zen_coding.require('utils');
	var actionUtils = zen_coding.require('actionUtils');
	var editorUtils = zen_coding.require('editorUtils');
	var matcher = zen_coding.require('html_matcher');
	
	var info = zen_coding.require('editorUtils').outputInfo(editor);
	var caretPos = editor.getCaretPos();
		
	// search for tag
	var pair = matcher.getTags(info.content, caretPos, info.profile);
	if (pair && pair[0]) {
		if (!pair[1]) {
			// simply remove unary tag
			editor.replaceContent(utils.getCaretPlaceholder(), pair[0].start, pair[0].end);
		} else {
			var tagContentRange = editorUtils.narrowToNonSpace(info.content, pair[0].end, pair[1].start);
			var startLineBounds = actionUtils.getLineBounds(info.content, tagContentRange[0]);
			var startLinePad = utils.getLinePadding(info.content.substring(startLineBounds.start, startLineBounds.end));
			var tagContent = info.content.substring(tagContentRange[0], tagContentRange[1]);
				
			tagContent = utils.unindentString(tagContent, startLinePad);
			editor.replaceContent(utils.getCaretPlaceholder() + tagContent, pair[0].start, pair[1].end);
		}
		
		return true;
	}
	
	return false;
});
/**
 * Actions that use stream parsers and tokenizers for traversing:
 * -- Search for next/previous items in HTML
 * -- Search for next/previous items in CSS
 * @constructor
 * @memberOf __zenSelectItemAction
 */
(function(){
	var startTag = /^<([\w\:\-]+)((?:\s+[\w\-:]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/;
	var knownXMLTypes = {
		'xml-tagname': 1,
		'xml-attname': 1,
		'xml-attribute': 1
	};
	var knownCSSTypes = {
		'selector': 1,
		'identifier': 1,
		'value': 1
	};
	
	/**
	 * Find next HTML item
	 * @param {zen_editor} editor
	 */
	function findNextHTMLItem(editor) {
		var isFirst = true;
		return findItem(editor, false, function(content, search_pos){
			if (isFirst) {
				isFirst = false;
				return findOpeningTagFromPosition(content, search_pos);
			} else {
				return getOpeningTagFromPosition(content, search_pos);
			}
		}, getRangeForNextItemInHTML);
	}
	
	/**
	 * Find previous HTML item
	 * @param {zen_editor} editor
	 */
	function findPrevHTMLItem(editor) {
		return findItem(editor, true, getOpeningTagFromPosition, getRangeForPrevItemInHTML);
	}
	
	/**
	 * Returns range for item to be selected in tag after current caret position
	 * @param {String} tag Tag declaration
	 * @param {Number} offset Tag's position index inside content
	 * @param {Number} sel_start Start index of user selection
	 * @param {Number} sel_end End index of user selection
	 * @return {Array} Returns array with two indexes if next item was found, 
	 * <code>null</code> otherwise
	 */
	function getRangeForNextItemInHTML(tag, offset, sel_start, sel_end) {
		var parserUtils = zen_coding.require('parserUtils');
		var tokens = parserUtils.parseHTML(tag, offset);
		var next = [];
				
		// search for token that is right to selection
		for (var i = 0, il = tokens.length; i < il; i++) {
			/** @type {syntaxToken} */
			var token = tokens[i], pos_test;
			if (token.type in knownXMLTypes) {
				// check token position
				pos_test = token.start >= sel_start;
				if (token.type == 'xml-attribute' && isQuote(token.content.charAt(0)))
					pos_test = token.start + 1 >= sel_start && token.end -1 != sel_end;
				
				if (!pos_test && !(sel_start == sel_end && token.end > sel_start)) continue;
				
				// found token that should be selected
				if (token.type == 'xml-attname') {
					next = handleFullAttributeHTML(tokens, i, sel_end <= token.end ? token.start : -1);
					if (next) return next;
				} else if (token.end > sel_end) {
					next = [token.start, token.end];
					
					if (token.type == 'xml-attribute')
						next = handleQuotesHTML(token.content, next);
						
					if (sel_start == next[0] && sel_end == next[1])
						// in case of empty attribute
						continue;
					
					return next;
				}
			}
		}
		
		return null;
	}
	
	/**
	 * Returns range for item to be selected in tag before current caret position
	 * @param {String} tag Tag declaration
	 * @param {Number} offset Tag's position index inside content
	 * @param {Number} sel_start Start index of user selection
	 * @param {Number} sel_end End index of user selection
	 * @return {Array} Returns array with two indexes if next item was found, 
	 * <code>null</code> otherwise
	 */
	function getRangeForPrevItemInHTML(tag, offset, sel_start, sel_end) {
		var parserUtils = zen_coding.require('parserUtils');
		var tokens = parserUtils.parseHTML(tag, offset);
		var next;
				
		// search for token that is left to the selection
		for (var i = tokens.length - 1, il = tokens.length; i >= 0; i--) {
			/** @type {syntaxToken} */
			var token = tokens[i], pos_test;
			if (token.type in knownXMLTypes) {
				// check token position
				pos_test = token.start < sel_start;
				if (token.type == 'xml-attribute' && isQuote(token.content.charAt(0))) {
					pos_test = token.start + 1 < sel_start;
				}
				
				if (!pos_test) continue;
				
				// found token that should be selected
				if (token.type == 'xml-attname') {
					next = handleFullAttributeHTML(tokens, i, token.start);
					if (next) return next;
				} else {
					next = [token.start, token.end];
					
					if (token.type == 'xml-attribute')
						next = handleQuotesHTML(token.content, next);
					
					return next;
				}
			}
		}
		
		return null;
	}
	
	/**
	 * Search for opening tag in content, starting at specified position
	 * @param {String} html Where to search tag
	 * @param {Number} pos Character index where to start searching
	 * @return {Array} Returns array with tag indexes if valid opening tag was found,
	 * <code>null</code> otherwise
	 */
	function findOpeningTagFromPosition(html, pos) {
		var tag;
		while (pos >= 0) {
			if (tag = getOpeningTagFromPosition(html, pos))
				return tag;
			pos--;
		}
		
		return null;
	}
	
	/**
	 * @param {String} html Where to search tag
	 * @param {Number} pos Character index where to start searching
	 * @return {Array} Returns array with tag indexes if valid opening tag was found,
	 * <code>null</code> otherwise
	 */
	function getOpeningTagFromPosition(html, pos) {
		var m;
		if (html.charAt(pos) == '<' && (m = html.substring(pos, html.length).match(startTag))) {
			return [pos, pos + m[0].length];
		}
	}
	
	function isQuote(ch) {
		return ch == '"' || ch == "'";
	}
	
	/**
	 * Find item
	 * @param {zen_editor} editor
	 * @param {String} is_backward Search backward (search forward otherwise)
	 * @param {Function} extract_fn Function that extracts item content
	 * @param {Function} range_rn Function that search for next token range
	 */
	function findItem(editor, is_backward, extract_fn, range_fn) {
		var content = String(editor.getContent());
		var contentLength = content.length;
		var item, itemDef, rng;
		var prev_range = [-1, -1];
		var sel = editor.getSelectionRange();
		var selStart = Math.min(sel.start, sel.end);
		var selEnd = Math.max(sel.start, sel.end);
			
		var searchPos = selStart, loop = 100000; // endless loop protection
		while (searchPos >= 0 && searchPos < contentLength && loop > 0) {
			loop--;
			if ( (item = extract_fn(content, searchPos, is_backward)) ) {
				if (prev_range[0] == item[0] && prev_range[1] == item[1]) {
					break;
				}
				
				prev_range[0] = item[0];
				prev_range[1] = item[1];
				itemDef = content.substring(item[0], item[1]);
				rng = range_fn(itemDef, item[0], selStart, selEnd);
					
				if (rng) {
					editor.createSelection(rng[0], rng[1]);
					return true;
				} else {
					searchPos = is_backward ? item[0] : item[1] - 1;
				}
			}
			
			searchPos += is_backward ? -1 : 1;
		}
		
		return false;
	}
	
	function findNextCSSItem(editor) {
		return findItem(editor, false, zen_coding.require('parserUtils').extractCSSRule, getRangeForNextItemInCSS);
	}
	
	function findPrevCSSItem(editor) {
		return findItem(editor, true, zen_coding.require('parserUtils').extractCSSRule, getRangeForPrevItemInCSS);
	}
	
	/**
	 * Returns range for item to be selected in tag after current caret position
	 * @param {String} rule CSS rule declaration
	 * @param {Number} offset Rule's position index inside content
	 * @param {Number} selStart Start index of user selection
	 * @param {Number} selEnd End index of user selection
	 * @return {Array} Returns array with two indexes if next item was found, 
	 * <code>null</code> otherwise
	 */
	function getRangeForNextItemInCSS(rule, offset, selStart, selEnd) {
		var tokens = zen_coding.require('parserUtils').parseCSS(rule, offset); 
		var next = [];
			
		/**
		 * Same range is used inside complex value processor
		 * @return {Boolean}
		 */
		function checkSameRange(r) {
			return r[0] == selStart && r[1] == selEnd;
		}
				
		// search for token that is right to selection
		for (var i = 0, il = tokens.length; i < il; i++) {
			/** @type {syntaxToken} */
			var token = tokens[i], posTest;
			if (token.type in knownCSSTypes) {
				// check token position
				if (selStart == selEnd)
					posTest = token.end > selStart;
				else {
					posTest = token.start >= selStart;
					if (token.type == 'value') // respect complex values
						posTest = posTest || selStart >= token.start && token.end >= selEnd;
				}
				
				if (!posTest) continue;
				
				// found token that should be selected
				if (token.type == 'identifier') {
					var rule_sel = handleFullRuleCSS(tokens, i, selEnd <= token.end ? token.start : -1);
					if (rule_sel) return rule_sel;
					
				} else if (token.type == 'value' && selEnd > token.start && token.children) {
					// looks like a complex value
					var children = token.children;
					for (var j = 0, jl = children.length; j < jl; j++) {
						if (children[j][0] >= selStart || (selStart == selEnd && children[j][1] > selStart)) {
							next = [children[j][0], children[j][1]];
							if (checkSameRange(next)) {
								var rule_sel = handleCSSSpecialCase(rule, next[0], next[1], offset);
								if (!checkSameRange(rule_sel))
									return rule_sel;
								else
									continue;
							}
							
							return next;
						}
					}
				} else if (token.end > selEnd) {
					return [token.start, token.end];
				}
			}
		}
		
		return null;
	}
	
	/**
	 * Returns range for item to be selected in CSS rule before current caret position
	 * @param {String} rule CSS rule declaration
	 * @param {Number} offset Rule's position index inside content
	 * @param {Number} selStart Start index of user selection
	 * @param {Number} selEnd End index of user selection
	 * @return {Array} Returns array with two indexes if next item was found, 
	 * <code>null</code> otherwise
	 */
	function getRangeForPrevItemInCSS(rule, offset, selStart, selEnd) {
		var tokens = zen_coding.require('parserUtils').parseCSS(rule, offset);
		var next = [];
				
		/**
		 * Same range is used inside complex value processor
		 * @return {Boolean}
		 */
		function checkSameRange(r) {
			return r[0] == selStart && r[1] == selEnd;
		}
			
		// search for token that is left to the selection
		for (var i = tokens.length - 1, il = tokens.length; i >= 0; i--) {
			/** @type {syntaxToken} */
			var token = tokens[i], pos_test;
			if (token.type in knownCSSTypes) {
				// check token position
				pos_test = token.start < selStart;
				if (token.type == 'value' && token.ref_start_ix != token.ref_end_ix) // respect complex values
					pos_test = token.start <= selStart;
				
				if (!pos_test) continue;
				
				// found token that should be selected
				if (token.type == 'identifier') {
					var rule_sel = handleFullRuleCSS(tokens, i, token.start);
					if (rule_sel) return rule_sel;
				} else if (token.type == 'value' && token.ref_start_ix != token.ref_end_ix) {
					// looks like a complex value
					var children = token.children;
					for (var j = children.length - 1; j >= 0; j--) {
						if (children[j][0] < selStart) {
							// create array copy
							next = [children[j][0], children[j][1]]; 
							
							var rule_sel = handleCSSSpecialCase(rule, next[0], next[1], offset);
							return !checkSameRange(rule_sel) ? rule_sel : next;
						}
					}
					
					// if we are here than we already traversed trough all
					// child tokens, select full value
					next = [token.start, token.end];
					if (!checkSameRange(next)) 
						return next;
				} else {
					return [token.start, token.end];
				}
			}
		}
		
		return null;
	}
	
	function handleFullRuleCSS(tokens, i, start) {
		for (var j = i + 1, il = tokens.length; j < il; j++) {
			/** @type {ParserUtils.token} */
			var _t = tokens[j];
			if ((_t.type == 'value' && start == -1) || _t.type == 'identifier') {
				return [_t.start, _t.end];
			} else if (_t.type == ';') {
				return [start == -1 ? _t.start : start, _t.end];
			} else if (_t.type == '}') {
				return [start == -1 ? _t.start : start, _t.start - 1];
			}
		}
		
		return null;
	}
	
	function handleFullAttributeHTML(tokens, i, start) {
		for (var j = i + 1, il = tokens.length; j < il; j++) {
			/** @type {ParserUtils.token} */
			var _t = tokens[j];
			if (_t.type == 'xml-attribute') {
				if (start == -1)
					return handleQuotesHTML(_t.content, [_t.start, _t.end]);
				else
					return [start, _t.end];
			} else if (_t.type == 'xml-attname') {
				// moved to next attribute, adjust selection
				return [_t.start, tokens[i].end];
			}
		}
			
		return null;
	}
	
	function handleQuotesHTML(attr, r) {
		if (isQuote(attr.charAt(0)))
			r[0]++;
		if (isQuote(attr.charAt(attr.length - 1)))
			r[1]--;
			
		return r;
	}
	
	function handleCSSSpecialCase(text, start, end, offset) {
		text = text.substring(start - offset, end - offset);
		var m;
		if (m = text.match(/^[\w\-]+\(['"]?/)) {
			start += m[0].length;
			if (m = text.match(/['"]?\)$/))
				end -= m[0].length;
		}
		
		return [start, end];
	}
	
	// XXX register actions
	var actions = zen_coding.require('actions');
	actions.add('select_next_item', function(editor){
		if (editor.getSyntax() == 'css')
			return findNextCSSItem(editor);
		else
			return findNextHTMLItem(editor);
	});
	
	actions.add('select_previous_item', function(editor){
		if (editor.getSyntax() == 'css')
			return findPrevCSSItem(editor);
		else
			return findPrevHTMLItem(editor);
	});
})();/**
 * Select current line (for simple editors like browser's &lt;textarea&gt;)
 */
zen_coding.require('actions').add('select_line', function(editor) {
	var range = editor.getCurrentLineRange();
	editor.createSelection(range.start, range.end);
	return true;
});/**
 * Splits or joins tag, e.g. transforms it into a short notation and vice versa:<br>
 * &lt;div&gt;&lt;/div&gt; → &lt;div /&gt; : join<br>
 * &lt;div /&gt; → &lt;div&gt;&lt;/div&gt; : split
 * @param {IZenEditor} editor Editor instance
 * @param {String} profileName Profile name
 */
zen_coding.require('actions').add('split_join_tag', function(editor, profileName) {
	/** @type zen_coding.profile */
	var profiles = zen_coding.require('profile');
	var matcher = zen_coding.require('html_matcher');
	var utils = zen_coding.require('utils');
	var editorUtils = zen_coding.require('editorUtils');
	
	var info = editorUtils.outputInfo(editor, null, profileName);
	var caretPos = editor.getCaretPos();
	var profile = profiles.get(info.profile);
	var caret = utils.getCaretPlaceholder();
	
	// find tag at current position
	var pair = matcher.getTags(info.content, caretPos, info.profile);
	if (pair && pair[0]) {
		var newContent = pair[0].full_tag;
		
		if (pair[1]) { // join tag
			var closingSlash = ' /';
			if (profile.self_closing_tag === true)
				closingSlash = '/';
				
			newContent = newContent.replace(/\s*>$/, closingSlash + '>');
			
			// add caret placeholder
			if (newContent.length + pair[0].start < caretPos)
				newContent += caret;
			else {
				var d = caretPos - pair[0].start;
				newContent = newContent.substring(0, d) + caret + newContent.substring(d);
			}
			
			editor.replaceContent(newContent, pair[0].start, pair[1].end);
		} else { // split tag
			var nl = utils.getNewline();
			var pad = zen_coding.require('resources').getVariable('indentation');
			
			// define tag content depending on profile
			var tagContent = (profile.tag_nl === true) ? nl + pad + caret + nl : caret;
					
			newContent = newContent.replace(/\s*\/>$/, '>') + tagContent + '</' + pair[0].name + '>';
			editor.replaceContent(newContent, pair[0].start, pair[0].end);
		}
		
		return true;
	}
	
	return false;
});/**
 * Toggles HTML and CSS comments depending on current caret context
 */
(function() {
	var actions = zen_coding.require('actions');
	var matcher = zen_coding.require('html_matcher');
	var utils = zen_coding.require('utils');
	var editorUtils = zen_coding.require('editorUtils');
	
	/**
	 * Toggle comment on current editor's selection or HTML tag/CSS rule
	 * @param {IZenEditor} editor
	 */
	actions.add('toggle_comment', function(editor) {
		var info = editorUtils.outputInfo(editor);
		if (info.syntax == 'css') {
			// in case out editor is good enough and can recognize syntax from 
			// current token, we have to make sure that cursor is not inside
			// 'style' attribute of html element
			var caretPos = editor.getCaretPos();
			var pair = matcher.getTags(info.content, caretPos);
			if (pair && pair[0] && pair[0].type == 'tag' && 
					pair[0].start <= caretPos && pair[0].end >= caretPos) {
				info.syntax = 'html';
			}
		}
		
		if (info.syntax == 'css')
			return toggleCSSComment(editor);
		
		return toggleHTMLComment(editor);
	});

	/**
	 * Toggle HTML comment on current selection or tag
	 * @param {zen_editor} editor
	 * @return {Boolean} Returns <code>true</code> if comment was toggled
	 */
	function toggleHTMLComment(editor) {
		var rng = editor.getSelectionRange();
		var info = editorUtils.outputInfo(editor);
			
		if (rng.start == rng.end) {
			// no selection, find matching tag
			var pair = matcher.getTags(info.content, editor.getCaretPos(), info.profile);
			if (pair && pair[0]) { // found pair
				rng.start = pair[0].start;
				rng.end = pair[1] ? pair[1].end : pair[0].end;
			}
		}
		
		return genericCommentToggle(editor, '<!--', '-->', rng.start, rng.end);
	}

	/**
	 * Simple CSS commenting
	 * @param {zen_editor} editor
	 * @return {Boolean} Returns <code>true</code> if comment was toggled
	 */
	function toggleCSSComment(editor) {
		var rng = editor.getSelectionRange();
			
		if (rng.start == rng.end) {
			// no selection, get current line
			rng = editor.getCurrentLineRange();

			// adjust start index till first non-space character
			var _r = editorUtils.narrowToNonSpace(String(editor.getContent()), rng.start, rng.end);
			rng.start = _r[0];
			rng.end = _r[1];
		}
		
		return genericCommentToggle(editor, '/*', '*/', rng.start, rng.end);
	}

	/**
	 * Search for nearest comment in <code>str</code>, starting from index <code>from</code>
	 * @param {String} text Where to search
	 * @param {Number} from Search start index
	 * @param {String} start_token Comment start string
	 * @param {String} end_token Comment end string
	 * @return {Array|null} Returns null if comment wasn't found
	 */
	function searchComment(text, from, start_token, end_token) {
		var start_ch = start_token.charAt(0);
		var end_ch = end_token.charAt(0);
		var commentStart = -1;
		var commentEnd = -1;
		
		function hasMatch(str, start) {
			return text.substr(start, str.length) == str;
		}
			
		// search for comment start
		while (from--) {
			if (text.charAt(from) == start_ch && hasMatch(start_token, from)) {
				commentStart = from;
				break;
			}
		}
		
		if (commentStart != -1) {
			// search for comment end
			from = commentStart;
			var contentLen = text.length;
			while (contentLen >= from++) {
				if (text.charAt(from) == end_ch && hasMatch(end_token, from)) {
					commentEnd = from + end_token.length;
					break;
				}
			}
		}
		
		return (commentStart != -1 && commentEnd != -1) 
			? [commentStart, commentEnd] 
			: null;
	}

	/**
	 * Generic comment toggling routine
	 * @param {zen_editor} editor
	 * @param {String} commentStart Comment start token
	 * @param {String} commentEnd Comment end token
	 * @param {Number} rangeStart Start selection range
	 * @param {Number} rangeEnd End selection range
	 * @return {Boolean}
	 */
	function genericCommentToggle(editor, commentStart, commentEnd, rangeStart, rangeEnd) {
		var content = String(editor.getContent());
		var caretPos = editor.getCaretPos();
		var newContent = null;
			
		/**
		 * Remove comment markers from string
		 * @param {Sting} str
		 * @return {String}
		 */
		function removeComment(str) {
			return str
				.replace(new RegExp('^' + utils.escapeForRegexp(commentStart) + '\\s*'), function(str){
					caretPos -= str.length;
					return '';
				}).replace(new RegExp('\\s*' + utils.escapeForRegexp(commentEnd) + '$'), '');
		}
		
		function hasMatch(str, start) {
			return content.substr(start, str.length) == str;
		}
			
		// first, we need to make sure that this substring is not inside 
		// comment
		var commentRange = searchComment(content, caretPos, commentStart, commentEnd);
		
		if (commentRange && commentRange[0] <= rangeStart && commentRange[1] >= rangeEnd) {
			// we're inside comment, remove it
			rangeStart = commentRange[0];
			rangeEnd = commentRange[1];
			
			newContent = removeComment(content.substring(rangeStart, rangeEnd));
		} else {
			// should add comment
			// make sure that there's no comment inside selection
			newContent = commentStart + ' ' + 
				content.substring(rangeStart, rangeEnd)
					.replace(new RegExp(utils.escapeForRegexp(commentStart) + '\\s*|\\s*' + utils.escapeForRegexp(commentEnd), 'g'), '') +
				' ' + commentEnd;
				
			// adjust caret position
			caretPos += commentStart.length + 1;
		}

		// replace editor content
		if (newContent !== null) {
			editor.setCaretPos(rangeStart);
			editor.replaceContent(editorUtils.unindent(editor, newContent), rangeStart, rangeEnd);
			editor.setCaretPos(caretPos);
			return true;
		}
		
		return false;
	}
})();/**
 * Automatically updates image size attributes in HTML's &lt;img&gt; element or
 * CSS rule
 * @constructor
 * @memberOf __zenUpdateImageSizeAction
 */
(function() {
	zen_coding.require('actions').add('update_image_size', function(editor) {
		var result;
		if (String(editor.getSyntax()) == 'css') {
			result = updateImageSizeCSS(editor);
		} else {
			result = updateImageSizeHTML(editor);
		}
		
		return zen_coding.require('actionUtils').compoundUpdate(editor, result);
	});
	
	/**
	 * Updates image size of &lt;img src=""&gt; tag
	 * @param {IZenEditor} editor
	 */
	function updateImageSizeHTML(editor) {
		var offset = editor.getCaretPos();
		/** @type zen_coding.actionUtils */
		var actionUtils = zen_coding.require('actionUtils');
			
		var image = findImage(editor);
		if (image) {
			var re = /\bsrc=(["'])(.+?)\1/i, m, src;
			if (m = re.exec(image.tag))
				src = m[2];
			
			if (src) {
				var size = getImageSizeForSource(editor, src);
				if (size) {
					var newTag = actionUtils.replaceOrAppendHTMLAttribute(image.tag, 'width', size.width);
					newTag = actionUtils.replaceOrAppendHTMLAttribute(newTag, 'height', size.height);
					
					return {
						'data': newTag,
						'start': image.start,
						'end': image.end,
						'caret': offset
					};
				}
			}
		}
		
		return null;
	}
	
	/**
	 * Find image tag under caret
	 * @param {IZenEditor} editor
	 * @return Image tag and its indexes inside editor source
	 */
	function findImage(editor) {
		var caretPos = editor.getCaretPos();
		var content = String(editor.getContent());
		var contentLen = content.length;
		var startIx = -1;
		var endIx = -1;
		
		// find the beginning of the tag
		do {
			if (caretPos < 0)
				break;
			if (content.charAt(caretPos) == '<') {
				if (content.substring(caretPos, caretPos + 4).toLowerCase() == '<img') {
					// found the beginning of the image tag
					startIx = caretPos;
					break;
				} else {
					// found some other tag
					return null;
				}
			}
		} while(caretPos--);
		
		// find the end of the tag 
		caretPos = editor.getCaretPos();
		do {
			if (caretPos >= contentLen)
				break;
				
			if (content.charAt(caretPos) == '>') {
				endIx = caretPos + 1;
				break;
			}
		} while(caretPos++);
		
		if (startIx != -1 && endIx != -1)
			
			return {
				start: startIx,
				end: endIx,
				tag: content.substring(startIx, endIx)
			};
		
		return null;
	}
	
	/**
	 * Returns image dimensions for source
	 * @param {IZenEditor} editor
	 * @param {String} src Image source (path or data:url)
	 */
	function getImageSizeForSource(editor, src) {
		var fileContent;
		var file = zen_coding.require('file');
		if (src) {
			// check if it is data:url
			if (startsWith('data:', src)) {
				fileContent = zen_coding.require('base64').decode( src.replace(/^data\:.+?;.+?,/, '') );
			} else {
				var abs_path = file.locateFile(editor.getFilePath(), src);
				if (abs_path === null) {
					throw "Can't find " + src + ' file';
				}
				
				fileContent = String(file.read(abs_path));
			}
			
			return zen_coding.require('actionUtils').getImageSize(fileContent);
		}
	}
	
	/**
	 * Test if <code>text</code> starts with <code>token</code> at <code>pos</code>
	 * position. If <code>pos</code> is ommited, search from beginning of text 
	 * @param {String} token Token to test
	 * @param {String} text Where to search
	 * @param {Number} pos Position where to start search
	 * @return {Boolean}
	 * @since 0.65
	 */
	function startsWith(token, text, pos) {
		pos = pos || 0;
		return text.charAt(pos) == token.charAt(0) && text.substr(pos, token.length) == token;
	}
	
	/**
	 * Replace substring of <code>text</code>, defined by <code>start</code> and 
	 * <code>end</code> indexes with <code>new_value</code>
	 * @param {String} text
	 * @param {Number} start
	 * @param {Number} end
	 * @param {String} new_value
	 * @return {String}
	 */
	function replaceSubstring(text, start, end, new_value) {
		return text.substring(0, start) + new_value + text.substring(end);
	}
	
	/**
	 * Updates image size of CSS rule
	 * @param {IZenEditor} editor
	 */
	function updateImageSizeCSS(editor) {
		var parserUtils = zen_coding.require('parserUtils');
		
		var caretPos = editor.getCaretPos();
		var content = String(editor.getContent());
		var rule = parserUtils.extractCSSRule(content, caretPos, true);
			
		
		if (rule) {
			var css = parserUtils.parseCSS(content.substring(rule[0], rule[1]), rule[0]);
			var curToken = parserUtils.findTokenFromPosition(css, caretPos, 'identifier');
			var value = parserUtils.findValueToken(css, curToken + 1);
				
			if (!value) return false;
			
			// find insertion point
			var insPoint = parserUtils.findCSSInsertionPoint(css, curToken);
				
			var m;
			if (m = /url\((["']?)(.+?)\1\)/i.exec(value.content)) {
				var size = getImageSizeForSource(editor, m[2]);
				if (size) {
					var wh = {width: null, height: null};
					var updates = [];
					var styler = parserUtils.learnCSSStyle(css, curToken);
						
					for (var i = 0, il = css.length; i < il; i++) {
						if (css[i].type == 'identifier' && css[i].content in wh)
							wh[css[i].content] = i;
					}
					
					function update(name, val) {
						var v;
						if (wh[name] !== null && (v = parserUtils.findValueToken(css, wh[name] + 1))) {
							updates.push([v.start, v.end, val + 'px']);
						} else {
							updates.push([insPoint.token.end, insPoint.token.end, styler(name, val + 'px')]);
						}
					}
					
					update('width', size.width);
					update('height', size.height);
					
					if (updates.length) {
						updates.sort(function(a, b){return a[0] - b[0];});
						
						// some editors do not provide easy way to replace multiple code 
						// fragments so we have to squash all replace operations into one
						var data = content.substring(updates[0][0], updates[updates.length - 1][1]),
							offset = updates[0][0];
							
						for (var i = updates.length - 1; i >= 0; i--) {
							var u = updates[i];
							data = replaceSubstring(data, u[0] - offset, u[1] - offset, u[2]);
								
							// also calculate new caret position
							if (u[0] < caretPos)
								caretPos += u[2].length - u[1] + u[0];
						}
						
						if (insPoint.need_col)
							data = replaceSubstring(data, insPoint.token.end - offset, insPoint.token.end - offset, ';');
						
						return {
							'data': data,
							'start': offset,
							'end': updates[updates.length - 1][1],
							'caret': caretPos
						};
						
					}
				}
			}
		}
			
		return false;
	}
})();/**
 * 
 */
(function() {
	
	/**
	 * Wraps passed text with abbreviation. Text will be placed inside last
	 * expanded element
	 * @param {String} abbr Abbreviation
	 * @param {String} text Text to wrap
	 * @param {String} syntax Document type (html, xml, etc.). Default is 'html'
	 * @param {String} profile Output profile's name. Default is 'plain'
	 * @return {String}
	 */
	function wrap(abbr, text, syntax, profile) {
		/** @type zen_coding.filters */
		var filters = zen_coding.require('filters');
		/** @type zen_coding.utils */
		var utils = zen_coding.require('utils');
		/** @type zen_coding.transform */
		var transform = zen_coding.require('transform');
		
		var pasted = false;
		
//		try {
			var data = filters.extractFromAbbreviation(abbr);
			var parsedTree = transform.createParsedTree(data[0], syntax);
			if (parsedTree) {
				if (parsedTree.multiply_elem) {
					// we have a repeating element, put content in
					parsedTree.multiply_elem.setPasteContent(text);
					parsedTree.multiply_elem.repeat_by_lines = pasted = true;
				}
				
				var outputTree = transform.rolloutTree(parsedTree);
				if (!pasted) 
					outputTree.pasteContent(text);
				
				var filtersList = filters.composeList(syntax, profile, data[1]);
				filters.apply(outputTree, filtersList, profile);
				return utils.replaceVariables(outputTree.toString());
			}
//		} catch(e) {
//			zen_coding.log(e);
//		}
		
		return null;
	}
	
	/**
	 * Wraps content with abbreviation
	 * @param {IZenEditor} Editor instance
	 * @param {String} abbr Abbreviation to wrap with
	 * @param {String} syntax Syntax type (html, css, etc.)
	 * @param {String} profile Output profile name (html, xml, xhtml)
	 */
	function wrapWithAbbreviaton(editor, abbr, syntax, profile) {
		var info = zen_coding.require('editorUtils').outputInfo(editor, syntax, profile);
		var utils = zen_coding.require('utils');
		/** @type zen_coding.editorUtils */
		var editorUtils = zen_coding.require('editorUtils');
		var matcher = zen_coding.require('html_matcher');
		
		abbr = abbr || editor.prompt("Enter abbreviation");
		
		var range = editor.getSelectionRange();
		var startOffset = range.start;
		var endOffset = range.end;
			
		if (!abbr || typeof abbr == 'undefined')
			return null; 
			
		abbr = String(abbr);
		
		if (startOffset == endOffset) {
			// no selection, find tag pair
			range = matcher(info.content, startOffset, info.profile);
			
			if (!range || range[0] == -1) // nothing to wrap
				return false;
			
			var narrowedSel = editorUtils.narrowToNonSpace(info.content, range[0], range[1]);
			startOffset = narrowedSel[0];
			endOffset = narrowedSel[1];
		}
		
		var newContent = utils.escapeText(info.content.substring(startOffset, endOffset));
		var result = wrap(abbr, editorUtils.unindent(editor, newContent), info.syntax, info.profile);
		
		if (result) {
			editor.setCaretPos(endOffset);
			editor.replaceContent(result, startOffset, endOffset);
			return true;
		}
		
		return false;
	}
	
	// add back-reference to "wrap" utility function for use in external modules
	wrapWithAbbreviaton.wrap = wrap;
	
	zen_coding.require('actions').add('wrap_with_abbreviation', wrapWithAbbreviaton);
})();/**
 * Updates CSS abbreviations like 'd:n!' with <i>!important</i> modifier.
 * @author Sergey Chikuyonok (serge.che@gmail.com) <http://chikuyonok.ru>
 * @param {Array} match Regexp match object
 * @param {TreeNode} node Matched abbreviation node
 * @param {String} syntax Current syntax
 */
zen_coding.require('resources').addGenerator(/^(.+)\!$/, function(match, node, syntax) {
	if (syntax != 'css')
		return null;
	
	var res = zen_coding.require('resources');
	var elems = zen_coding.require('elements');
	
	// generate parsed snippet
	var source = res.getSnippet(syntax, match[1]);
	if (source) {
		var parsedSnippet = elems.create('parsedSnippet', node, syntax, source);
		if (~parsedSnippet.value.indexOf(';')) {
			parsedSnippet.value = parsedSnippet.value.split(';').join(' !important;');
		} else {
			parsedSnippet.value += ' !important';
		}
		
		return parsedSnippet;
	}
	
	return null;
});
/**
 * "Lorem ipsum" text generator. Matches lipsum(num)(elem_name) abbreviation.
 * This code is based on Django's contribution: 
 * https://code.djangoproject.com/browser/django/trunk/django/contrib/webdesign/lorem_ipsum.py
 * <br><br>
 * Examples to test:<br>
 * <code>lipsum</code> – generates 30 words text.<br>
 * <code>lipsum*6</code> – generates 6 paragraphs (autowrapped with &lt;p&gt; element) of text.<br>
 * <code>ol>lipsum10*5</code> — generates ordered list with 5 list items (autowrapped with &lt;li&gt; tag)
 * with text of 10 words on each line<br>
 * <code>lipsum20span*3</code> – generates 3 paragraphs of 20-words text, each wrapped with &lt;span&gt; element    
 */
(function() {
	/**
	 * @param {Array} match
	 * @param {TreeNode} node
	 * @param {String} syntax
	 */
	zen_coding.require('resources').addGenerator(/^lipsum(\d*)([a-z]*)$/i, function(match, node, syntax) {
		var wordCound = match[1] || 30;
		var elemName = match[2] || '';
		var outputCount = node.count || 1;
		
		if (!elemName && node.parent.name) {
			// guess element name from TreeNode
			switch (node.parent.name.toLowerCase()) {
				case 'ul':
				case 'ol':
					elemName = 'li';
					break;
				// TODO add more auto names 
			}
		}
		
		// if output tag name is undefined and user wants to output more than one
		// block, assume the element name is "P"
		if (!elemName && outputCount > 1) {
			elemName = 'p';
		}
		
		var result = [], text;
		/** @type zen_coding.transform */
		var transform = zen_coding.require('transform');
		while (outputCount-- > 0) {
			// to automatically handle element references from zen_setting
			// (and because I'm lazy) we will generate a new abbreviation and
			// let Zen Coding correctly expand it
			text = elemName + '{' + paragraph(wordCound, result.length == 0) + '}';
			result.push(transform.createParsedTree(text, syntax, node.parent).children[0]);
		}
		
		return result;
	});
	
	
	var COMMON_P = 'lorem ipsum dolor sit amet consectetur adipisicing elit'.split(' ');
	
	var WORDS = ['exercitationem', 'perferendis', 'perspiciatis', 'laborum', 'eveniet',
	             'sunt', 'iure', 'nam', 'nobis', 'eum', 'cum', 'officiis', 'excepturi',
	             'odio', 'consectetur', 'quasi', 'aut', 'quisquam', 'vel', 'eligendi',
	             'itaque', 'non', 'odit', 'tempore', 'quaerat', 'dignissimos',
	             'facilis', 'neque', 'nihil', 'expedita', 'vitae', 'vero', 'ipsum',
	             'nisi', 'animi', 'cumque', 'pariatur', 'velit', 'modi', 'natus',
	             'iusto', 'eaque', 'sequi', 'illo', 'sed', 'ex', 'et', 'voluptatibus',
	             'tempora', 'veritatis', 'ratione', 'assumenda', 'incidunt', 'nostrum',
	             'placeat', 'aliquid', 'fuga', 'provident', 'praesentium', 'rem',
	             'necessitatibus', 'suscipit', 'adipisci', 'quidem', 'possimus',
	             'voluptas', 'debitis', 'sint', 'accusantium', 'unde', 'sapiente',
	             'voluptate', 'qui', 'aspernatur', 'laudantium', 'soluta', 'amet',
	             'quo', 'aliquam', 'saepe', 'culpa', 'libero', 'ipsa', 'dicta',
	             'reiciendis', 'nesciunt', 'doloribus', 'autem', 'impedit', 'minima',
	             'maiores', 'repudiandae', 'ipsam', 'obcaecati', 'ullam', 'enim',
	             'totam', 'delectus', 'ducimus', 'quis', 'voluptates', 'dolores',
	             'molestiae', 'harum', 'dolorem', 'quia', 'voluptatem', 'molestias',
	             'magni', 'distinctio', 'omnis', 'illum', 'dolorum', 'voluptatum', 'ea',
	             'quas', 'quam', 'corporis', 'quae', 'blanditiis', 'atque', 'deserunt',
	             'laboriosam', 'earum', 'consequuntur', 'hic', 'cupiditate',
	             'quibusdam', 'accusamus', 'ut', 'rerum', 'error', 'minus', 'eius',
	             'ab', 'ad', 'nemo', 'fugit', 'officia', 'at', 'in', 'id', 'quos',
	             'reprehenderit', 'numquam', 'iste', 'fugiat', 'sit', 'inventore',
	             'beatae', 'repellendus', 'magnam', 'recusandae', 'quod', 'explicabo',
	             'doloremque', 'aperiam', 'consequatur', 'asperiores', 'commodi',
	             'optio', 'dolor', 'labore', 'temporibus', 'repellat', 'veniam',
	             'architecto', 'est', 'esse', 'mollitia', 'nulla', 'a', 'similique',
	             'eos', 'alias', 'dolore', 'tenetur', 'deleniti', 'porro', 'facere',
	             'maxime', 'corrupti'];
	
	/**
	 * Returns random integer between <code>from</code> and <code>to</code> values
	 * @param {Number} from
	 * @param {Number} to
	 * @returns {String}
	 */
	function randint(from, to) {
		return Math.round(Math.random() * (to - from) + from);
	}
	
	/**
	 * @param {Array} arr
	 * @param {Number} count
	 * @returns {Array}
	 */
	function sample(arr, count) {
		/** @type Underscore */
		var _ = zen_coding.require('_');
		
		var len = arr.length;
		var iterations = Math.min(len, count);
		var result = [];
		while (result.length < iterations) {
			var randIx = randint(0, len);
			if (!_.include(result, randIx))
				result.push(randIx);
		}
		
		return _.map(result, function(ix) {
			return arr[ix];
		});
	}
	
	function choice(val) {
		var _ = zen_coding.require('_');
		if (_.isString(val))
			return val.charAt(randint(0, val.length - 1));
		
		return val[randint(0, val.length - 1)];
	}
	
	function sentence(words, end) {
		if (words.length) {
			words[0] = words[0].charAt(0).toUpperCase() + words[0].substring(1);
		}
		
		return words.join(' ') + (end || choice('?!...')); // more dots that question marks
	}
	
	/**
	 * Insert commas at randomly selected words. This function modifies values
	 * inside <code>words</code> array 
	 * @param {Array} words
	 */
	function insertCommas(words) {
		var len = words.length;
		var totalCommas = 0;
		/** @type Underscore */
		var _ = zen_coding.require('_');
		
		if (len > 3 && len <= 6) {
			totalCommas = randint(0, 1);
		} else if (len > 6 && len <= 12) {
			totalCommas = randint(0, 2);
		} else {
			totalCommas = randint(1, 4);
		}
		
		_.each(sample(_.range(totalCommas)), function(ix) {
			words[ix] += ',';
		});
	}
	
	/**
	 * Generate a paragraph of "Lorem ipsum" text
	 * @param {Number} wordCount Words count in paragraph
	 * @param {Boolean} startWithCommon Should paragraph start with common 
	 * "lorem ipsum" sentence.
	 * @returns {String}
	 */
	function paragraph(wordCount, startWithCommon) {
		var result = [];
		var totalWords = 0;
		var words;
		
		if (startWithCommon) {
			words = COMMON_P.slice(0, wordCount);
			if (words.length > 5)
				words[4] += ',';
			totalWords += words.length;
			result.push(sentence(words, '.'));
		}
		
		while (totalWords < wordCount) {
			words = sample(WORDS, Math.min(randint(3, 12) * randint(1, 5), wordCount - totalWords));
			totalWords += words.length;
			insertCommas(words);
			result.push(sentence(words));
		}
		
		return result.join(' ');
	}
})();/**
 * Short-hand functions for Java wrapper
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * 
 * @include "../../javascript/zen_resources.js"
 */

/**
 * Runs Zen Coding action
 * @param {ZenEditor} editor
 * @param {String} action_name
 * @return {Boolean}
 */function runZenCodingAction(editor, action_name){
	var args = [editor];
	for (var i = 2, il = arguments.length; i < il; i++) {
		args.push(arguments[i]);
	}
	
	return zen_coding.require('actions').run(action_name, args);
}

/**
 * Removes all user defined settings
 */
function resetUserSettings() {
	zen_coding.require('resources').setVocabulary({}, 'user');
}

/**
 * Adds user defined resource (abbreviation or snippet)
 * @param {String} syntax
 * @param {String} type
 * @param {String} abbr
 * @param {String} value
 */
function addUserResource(syntax, type, abbr, value) {
	var res = zen_coding.require('resources');
	var voc = res.getVocabulary('user') || {};
	if (!(syntax in voc))
		voc[syntax] = {};
		
	if (!(type in voc[syntax]))
		voc[syntax][type] = {};
		
	voc[syntax][type][abbr] = value;
	
	res.setVocabulary(voc, 'user');
}

function hasZenCodingVariable(name) {
	return !!zen_coding.require('resources').getVariable(name);
}

function tryBoolean(val) {
	var str_val = String(val || '').toLowerCase();
	if (str_val == 'true')
		return true;
	if (str_val == 'false')
		return false;
		
	var int_val = parseInt(str_val, 10);
	if (!isNaN(int_val))
		return int_val;
	
	return str_val;
}

function setupOutputProfile(name, profile_obj, editor) {
	var map = {
		tag_case: 'getTagCase',
		attr_case: 'getAttrCase',
		attr_quotes: 'getAttrQuotes',
		tag_nl: 'getTagNewline',
		place_cursor: 'isPlaceCaret',
		indent: 'isIndentTags',
		inline_break: 'getInlineBreak',
		self_closing_tag: 'getSelfClosing',
		filters: 'getFilters'
	};
	
	name = String(name);
	
	var profile = {};
		
	for (var p in map) if (map.hasOwnProperty(p)) {
		profile[p] = tryBoolean(profile_obj[map[p]]());
	}
	
	zen_coding.require('profile').create(name, profile);
}

function addUserVariable(name, value) {
	zen_coding.require('resources').setVariable(name, value);
}

function previewWrapWithAbbreviation(editor, abbr) {
	var syntax = String(editor.getSyntax());
	var profileName = String(editor.getProfileName());
	abbr = String(abbr);
	
	var range = editor.getSelectionRange(),
		startOffset = range.start,
		endOffset = range.end,
		content = String(editor.getContent());
		
		
	if (!abbr)
		return null;
	
	var editorUtils = zen_coding.require('editorUtils');
	var utils = zen_coding.require('utils');
	
	if (startOffset == endOffset) {
		// no selection, find tag pair
		range = zen_coding.require('html_matcher')(content, startOffset, profileName);
		
		if (!range || range[0] == -1) // nothing to wrap
			return null;
		
		var narrowedSel = editorUtils.narrowToNonSpace(content, range[0], range[1]);
		startOffset = narrowedSel[0];
		endOffset = narrowedSel[1];
	}
	
	var wrapAction = zen_coding.require('actions').get('wrap_with_abbreviation');
	var result = null;
	if (wrapAction) {
		
		var newContent = utils.escapeText(content.substring(startOffset, endOffset));
		result = wrapAction.fn.wrap(abbr, editorUtils.unindent(editor, newContent), syntax, profileName);
	}
	
	return result || null;
}
/**
 * Zen Coding file I/O interface implementation using Java classes 
 * (for Mozilla Rhino)
 *
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * @version 0.65
 */
zen_coding.define('file', function(require, _) {
	return {
		/**
		 * Read file content and return it
		 * @param {String} path File's relative or absolute path
		 * @return {String}
		 * @memberOf __zenFileJava
		 */
		read: function(path) {
			var File = Packages.java.io.File;
			var f = new File(path),
				input_stream, c, content = [];
				
			if (f.exists() && f.isFile() && f.canRead()) {
				input_stream = new Packages.java.io.FileInputStream(f);
				while ((c = input_stream.read()) != -1) {
					content.push(String.fromCharCode(c));
				}
				
				input_stream.close();
			}

			return content.join('');
		},

		/**
		 * Locate <code>file_name</code> file that relates to <code>editor_file</code>.
		 * File name may be absolute or relative path
		 *
		 * <b>Dealing with absolute path.</b>
		 * Many modern editors has a "project" support as information unit, but you
		 * should not rely on project path to find file with absolute path. First,
		 * it requires user to create a project before using this method (and this
		 * is not acutually Zen). Second, project path doesn't always points to
		 * to website's document root folder: it may point, for example, to an
		 * upper folder which contains server-side scripts.
		 *
		 * For better result, you should use the following algorithm in locating
		 * absolute resources:
		 * 1) Get parent folder for <code>editor_file</code> as a start point
		 * 2) Append required <code>file_name</code> to start point and test if
		 * file exists
		 * 3) If it doesn't exists, move start point one level up (to parent folder)
		 * and repeat step 2.
		 *
		 * @param {String} editor_file
		 * @param {String} file_name
		 * @return {String|null} Returns null if <code>file_name</code> cannot be located
		 */
		locateFile: function(editor_file, file_name) {
			var File = Packages.java.io.File;
			var f = new File(editor_file),
				result = '',
				tmp;
				
			// traverse upwards to find image uri
			while (f.getParent()) {
				tmp = new File(this.createPath(f.getParent(), file_name));
				if (tmp.exists()) {
					result = tmp.getCanonicalPath();
					break;
				}
				
				f = new File(f.getParent());
			}
			
			return result;
		},

		/**
		 * Creates absolute path by concatenating <code>parent</code> and <code>file_name</code>.
		 * If <code>parent</code> points to file, its parent directory is used
		 * @param {String} parent
		 * @param {String} file_name
		 * @return {String}
		 */
		createPath: function(parent, file_name) {
			var File = Packages.java.io.File,
				f = new File(parent),
				result = '';
				
			if (f.exists()) {
				if (f.isFile()) {
					parent = f.getParent();
				}
				
				var req_file = new File(parent, file_name);
				result = req_file.getCanonicalPath();
			}
			
			return result;
		},

		/**
		 * Saves <code>content</code> as <code>file</code>
		 * @param {String} file File's asolute path
		 * @param {String} content File content
		 */
		save: function(file, content) {
			content = content || '';
			file = String(file);
			
			var File = Packages.java.io.File,
				f = new File(file);
				
			if (file.indexOf('/') != -1) {
				var f_parent = new File(f.getParent());
				f_parent.mkdirs();
			}
			
			var stream = new Packages.java.io.FileOutputStream(file);
			for (var i = 0, il = content.length; i < il; i++) {
				stream.write(content.charCodeAt(i));
			}
				
			stream.close();
		},

		/**
		 * Returns file extention in lower case
		 * @param {String} file
		 * @return {String}
		 */
		getExt: function(file) {
			var m = (file || '').match(/\.([\w\-]+)$/);
			return m ? m[1].toLowerCase() : '';
		}
	};
});
