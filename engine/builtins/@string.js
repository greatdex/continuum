import {
  $$ArgumentCount,
  $$Call,
  $$CreateInternalObject,
  $$Get,
  $$Exception,
  $$Has,
  $$Invoke,
  $$Set
} from '@@internals';

import {
  builtinClass,
  call,
  createInternal,
  define,
  extend,
  extendInternal,
  hasBrand,
  isInitializing,
  listFrom,
  listOf,
  numbers
} from '@@utilities';

import {
  OrdinaryCreateFromConstructor,
  ToInteger,
  ToString,
  ToUint32
} from '@@operations';

import {
  MAX_INTEGER
} from '@number';

import {
  RegExp
} from '@regexp';


import {
  Array
} from '@array';

import {
  dict
} from '@dict';



const trimmer = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/


function ensureCoercible(target, method){
  if (target === null || target === undefined) {
    throw $$Exception('object_not_coercible', ['String.prototype.'+method, target]);
  }
  return ToString(target);
}

internalFunction(ensureCoercible);


function ToHTML(tag, content, attrName, attrVal){
  const attr = attrName === undefined ? '' : ' '+attrName+'="'+$__StringReplace(ToString(attrVal), '"', '&quot;')+'"';

  return '<'+tag+attr+'>'+content+'</'+tag+'>';
}

internalFunction(ToHTML);


function stringIndexOf(string, search, position){
  const searchStr = ToString(search),
        pos       = ToInteger(position),
        len       = string.length,
        searchLen = searchStr.length,
        maxLen    = len - searchLen;

  let index = pos > 0 ? pos < len ? pos : len : 0;

  while (index < maxLen) {
    let offset = 0;
    while (offset < searchLen && searchStr[offset] === string[index + offset]) {
      if (offset++ === searchLen - 1) {
        return index;
      }
    }
  }

  return -1;
}

internalFunction(stringIndexOf);


function stringMatch(string, regexp){
  if (!hasBrand(regexp, 'BuiltinRegExp')) {
    regexp = new RegExp(regexp);
  }

  if (!regexp.global) {
    return $__RegExpExec(regexp, string);
  }

  const array = [];
  let previous  = 0,
      index     = 0,
      lastMatch = true;

  regexp.lastIndex = 0;

  while (lastMatch) {
    let result = $__RegExpExec(regexp, string);
    if (result === null) {
      lastMatch = false;
    } else {
      let thisIndex = regexp.lastIndex;
      if (thisIndex === lastIndex) {
        previous = regexp.lastIndex = thisIndex + 1;
      } else {
        previous = thisIndex;
      }
      array[index++] = result[0];
    }
  }

  return index === 0 ? null : array;
}

internalFunction(stringMatch);


function useHost(value, method){
  return $$Invoke(ensureCoercible(value, method), method);
}

internalFunction(useHost);



export class String {
  constructor(value){
    value = $$ArgumentCount() ? ToString(value) : '';

    if (!isInitializing(this, 'StringValue')) {
      return value;
    }

    $$Set(this, 'StringValue', value);
    define(this, 'length', value.length, 0);
  }

  anchor(name){
    return ToHTML('a', ensureCoercible(this, 'anchor'), 'name', name);
  }

  big(){
    return ToHTML('big', ensureCoercible(this, 'big'));
  }

  blink(){
    return ToHTML('blink', ensureCoercible(this, 'blink'));
  }

  bold(){
    return ToHTML('b', ensureCoercible(this, 'bold'));
  }

  fixed(){
    return ToHTML('fixed', ensureCoercible(this, 'fixed'));
  }

  fontcolor(color){
    return ToHTML('font', ensureCoercible(this, 'fontcolor'), 'color', color);
  }

  fontsize(size){
    return ToHTML('font', ensureCoercible(this, 'fontsize'), 'size', size);
  }

  italics(){
    return ToHTML('i', ensureCoercible(this, 'italics'));
  }

  link(href){
    return ToHTML('a', ensureCoercible(this, 'link'), 'href', href);
  }

  small(){
    return ToHTML('small', ensureCoercible(this, 'small'));
  }

  strike(){
    return ToHTML('s', ensureCoercible(this, 'strike'));
  }

  sub(){
    return ToHTML('sub', ensureCoercible(this, 'sub'));
  }

  sup(){
    return ToHTML('sup', ensureCoercible(this, 'sup'));
  }

  charAt(position){
    const string = ensureCoercible(this, 'charAt');

    position = ToInteger(position);

    return position < 0 || position >= string.length ? '' : string[position];
  }

  charCodeAt(position){
    const string = ensureCoercible(this, 'charCodeAt');

    position = ToInteger(position);

    return position < 0 || position >= string.length ? NaN : $__CodeUnit(string[position]);
  }

  concat(...args){
    let string = ensureCoercible(this, 'concat');

    for (var i=0; i < args.length; i++) {
      string += ToString(args[i]);
    }

    return string;
  }

  indexOf(searchString, position = 0){
    return stringIndexOf(ensureCoercible(this, 'indexOf'), searchString, position);
  }

  lastIndexOf(searchString, position = Infinity){
    const string    = ensureCoercible(this, 'lastIndexOf'),
          search    = ToString(searchString),
          len       = string.length,
          searchLen = searchString.length,
          pos       = ToInteger(position) - searchLen;

    let index = pos > 0 ? pos < len ? pos : len : 0;

    while (index--) {
      let offset = 0;
      while (offset < searchLen && searchString[offset] === string[index + offset]) {
        if (++offset === searchLen) {
          return index;
        }
      }
    }

    return -1;
  }

  localeCompare(){
    // TODO
  }

  match(regexp){
    return stringMatch(ensureCoercible(this, 'match'), regexp);
  }

  repeat(count){
    let string = ensureCoercible(this, 'repeat'),
        factor = ToInteger(count),
        result = '';

    if (factor <= 1 || factor === Infinity || factor === -Infinity) {
      throw $$Exception('invalid_repeat_count', []);
    }

    while (factor > 0) {
      (factor & 1) && (result += string);
      factor >>= 1;
      string += string;
    }

    return result;
  }

  replace(search, replace){
    const string = ensureCoercible(this, 'replace');

    if (typeof replace === 'function') {
      let match, count;
      if (hasBrand(search, 'BuiltinRegExp')) {
        match = stringMatch(string, search);
        count = matches.length;
      } else {
        match = stringIndexOf(string, ToString(search));
        count = 1;
      }
      //TODO
    } else {
      replace = ToString(replace);
      if (!hasBrand(search, 'BuiltinRegExp')) {
        search = ToString(search);
      }

      return $__StringReplace(string, search, replace);
    }
  }

  search(regexp){
    const string = ensureCoercible(this, 'search');

    if (!hasBrand(regexp, 'BuiltinRegExp')) {
      regexp = new RegExp(regexp);
    }

    return $__StringSearch(string, regexp);
  }

  slice(start = 0, end = this.length){
    const string = ensureCoercible(this, 'slice');

    start = ToInteger(start);
    end = ToInteger(end);

    return $$Invoke(string, 'slice', start, end);
  }

  split(separator, limit = MAX_INTEGER - 1){
    const string = ensureCoercible(this, 'split');

    limit = ToInteger(limit);
    separator = hasBrand(separator, 'BuiltinRegExp') ? separator : ToString(separator);

    return $__StringSplit(string, separator, limit);
  }

  substr(start = 0, length = Infinity){
    const string = ensureCoercible(this, 'substr'),
          chars  = string.length;

    start = ToInteger(start);
    length = ToInteger(length);

    if (start < 0) {
      start += chars;
      if (start < 0) start = 0;
    }
    if (length < 0) {
      length = 0;
    }
    if (length > chars - start) {
      length = chars - start;
    }

    return length <= 0 ? '' : $$Invoke(string, 'slice', start, start + length);
  }

  substring(start = 0, end = this.length){
    const string = ensureCoercible(this, 'substring'),
          len    = string.length;

    start = ToInteger(start);
    end = ToInteger(end);

    start = start > 0 ? start < len ? start : len : 0;
    end = end > 0 ? end < len ? end : len : 0;

    const from = start < end ? start : end,
          to = start > end ? start : end;

    return $$Invoke(string, 'slice', from, to);
  }

  toLocaleLowerCase(){
    return $$Invoke(ensureCoercible(this, 'toLocaleLowerCase'), 'toLocaleLowerCase');
  }

  toLocaleUpperCase(){
    return $$Invoke(ensureCoercible(this, 'toLocaleUpperCase'), 'toLocaleUpperCase');
  }

  toLowerCase(){
    return $$Invoke(ensureCoercible(this, 'toLowerCase'), 'toLowerCase');
  }

  toString(){
    if (typeof this === 'string') {
      return this;
    } else if (hasBrand(this, 'StringWrapper')) {
      return $$Get(this, 'StringValue');
    }
    throw $$Exception('not_generic', ['String.prototype.toString']);
  }

  toUpperCase(){
    return $$Invoke(ensureCoercible(this, 'toUpperCase'), 'toUpperCase');
  }

  trim(){
    return $__StringReplace(ensureCoercible(this, 'trim'), trimmer, '');
  }

  valueOf(){
    if (typeof this === 'string') {
      return this;
    } else if (hasBrand(this, 'StringWrapper')) {
      return $$Get(this, 'StringValue');
    }
    throw $$Exception('not_generic', ['String.prototype.toString']);
  }
}

builtinClass(String);
$$Set(String.prototype, 'StringValue', '');
define(String.prototype, 'length', 0, FROZEN);


export function fromCharCode(...codeUnits){
  const length = codeUnits.length;
  let result = '';

  for (var i=0; i < length; i++) {
    result += $__FromCharCode($__ToUint16(codeUnits[i]));
  }

  return result;
}

extend(String, {
  fromCharCode,
  @@create(){
    const obj = OrdinaryCreateFromConstructor(this, '%StringPrototype%');
    $$Set(obj, 'BuiltinBrand', 'StringWrapper');
    $$Set(obj, 'StringValue', undefined);
    return extendInternal(obj, internalMethods);
  }
});




function unique(strings){
  const len    = strings.length,
        count  = 0,
        seen   = dict(),
        result = [];

  for (var i=0; i < len; i++) {
    const string = strings[i];
    if (!(string in seen)) {
      seen[string] = true;
      result[count++] = string;
    }
  }

  return result;
}

internalFunction(unique);


function getCharacter(obj, key){
  const string = $$Get(obj, 'StringValue'),
        index  = ToUint32(key);

  if (ToString(index) === key && index < $$Get(string, 'length')) {
    return $$Get(string, key);
  }
}

internalFunction(getCharacter);


const StringIndexDescriptor = createInternal(null, {
  Value: undefined,
  Writable: false,
  Enumerable: true,
  Configurable: false,
  attrs: 1
});

const GetOwnProperty = $$Get(String.prototype, 'GetOwnProperty'),
      Enumerate      = $$Get(String.prototype, 'Enumerate'),
      describe       = $$Get(String.prototype, 'describe'),
      get            = $$Get(String.prototype, 'get'),
      has            = $$Get(String.prototype, 'has'),
      query          = $$Get(String.prototype, 'query'),
      each           = $$Get(String.prototype, 'each');

const internalMethods = {
  GetOwnProperty(P){
    const char = getCharacter(this, P);

    if (char) {
      const Desc = $$CreateInternalObject(StringIndexDescriptor);
      $$Set(Desc, 'Value', char);
      return Desc;
    }

    return $$Call(GetOwnProperty, this, P);
  },
  Get(P){
    const char = getCharacter(this, P);

    if (char) {
      return char;
    }

    return $$Invoke(this, 'GetP', this, P);
  },
  Enumerate(includePrototype, onlyEnumerable){
    const length = this.length,
          props  = $$Call(Enumerate, this, includePrototype, onlyEnumerable);

    if (!length) {
      return props;
    }

    const array = [];
    $$Set(array, 'array', props);
    return listFrom(unique(numbers($$Get(props, 'length')).concat(array)));
  },
  each(callback){
    const string = $$Get(this, 'StringValue'),
          length = $$Get(string, 'length');

    for (var i=0; i < length; i++) {
      $$Call(callback, this, listOf(ToString(i), $$Get(string, i), 1));
    }

    return $$Call(each, this, callback);
  },
  has(key){
    if (getCharacter(this, key)) {
      return true;
    }

    return $$Call(has, this, key);
  },
  get(key){
    const char = getCharacter(this, key);

    if (char) {
      return char;
    }

    return $$Call(get, this, key);
  },
  query(key){
    const char = getCharacter(this, key);

    if (char) {
      return 1;
    }

    return $$Call(query, this, key);
  },
  describe(key){
    const char = getCharacter(this, key);

    if (char) {
      return listOf(key, char, 1);
    }

    return $$Call(describe, this, key);
  }
}
