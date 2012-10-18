var continuum = (function(GLOBAL, exports){
  var errors  = require('./errors'),
      utility = require('./utility'),
      compile = require('./compiler');

  var Hash = utility.Hash,
      Emitter = utility.Emitter,
      PropertyList = utility.PropertyList,
      create = utility.create,
      isObject = utility.isObject,
      nextTick = utility.nextTick,
      enumerate = utility.enumerate,
      ownKeys = utility.ownKeys,
      define = utility.define,
      inherit = utility.inherit,
      decompile = utility.decompile,
      parse = utility.parse;

  var BOOLEAN   = 'boolean',
      FUNCTION  = 'function',
      NUMBER    = 'number',
      OBJECT    = 'object',
      STRING    = 'string',
      UNDEFINED = 'undefined';

  var ENUMERABLE   = 0x1,
      CONFIGURABLE = 0x2,
      WRITABLE     = 0x4,
      ACCESSOR   = 0x8;

  var ___ =  0,
      E__ =  1,
      _C_ =  2,
      EC_ =  3,
      __W =  4,
      E_W =  5,
      _CW =  6,
      ECW =  7,
      __A =  8,
      E_A =  9,
      _CA = 10,
      ECA = 11;


  var Empty = {};


  function Symbol(name){
    this.name = name;
  }

  define(Symbol.prototype, [
    function toString(){
      return this.name;
    },
    function inspect(){
      return '[Symbol '+this.name+']';
    }
  ]);


  var BreakSigil            = new Symbol('Break'),
      ThrowSigil            = new Symbol('Throw'),
      ReturnSigil           = new Symbol('Return'),
      NativeSigil           = new Symbol('Native'),
      ContinueSigil         = new Symbol('Continue'),
      ReferenceSigil        = new Symbol('Reference'),
      CompletionSigil       = new Symbol('Completion'),
      AbruptCompletionSigil = new Symbol('AbruptCompletion');

  var LexicalScope          = 'Lexical',
      StrictScope           = 'Strict',
      GlobalScope           = 'Global';

  var GlobalCode            = 'Global',
      EvalCode              = 'Eval',
      FuntionCode           = 'Function';

  var ArrowFunction         = 'Arrow',
      NormalFunction        = 'Normal',
      MethodFunction        = 'Method',
      GeneratorFunction     = 'Generator';


  // ##################################################
  // ### Internal Utilities not from specification ####
  // ##################################################

  function noop(){}

  // ###############################
  // ###############################
  // ### Specification Functions ###
  // ###############################
  // ###############################

  function ThrowException(error, args){
    return new AbruptCompletion(ThrowSigil, errors[error].apply(null, args));
  }

  // ## FromPropertyDescriptor

  function FromPropertyDescriptor(desc){
    var obj = new $Object;
    if (IsDataDescriptor(desc)) {
      setDirect(obj, 'value', desc.value);
      setDirect(obj, 'writable', desc.writable);
    } else if (IsAccessorDescriptor(desc))  {
      setDirect(obj, 'get', desc.get);
      setDirect(obj, 'set', desc.set);
    }
    setDirect(obj, 'enumerable', desc.enumerable);
    setDirect(obj, 'configurable', desc.configurable);
    return obj;
  }


  // ## ToPropertyDescriptor

  var descFields = ['value', 'writable', 'enumerable', 'configurable', 'get', 'set'];
  var descProps = ['Value', 'Writable', 'Enumerable', 'Configurable', 'Get', 'Set'];

  function ToPropertyDescriptor(obj) {
    if (obj.IsCompletion) { if (obj.IsAbruptCompletion) return obj; else obj = obj.value; }

    if (typeof obj !== OBJECT)
      return ThrowException('property_desc_object', [typeof obj]);

    var desc = create(null);

    for (var i=0, v; i < 6; i++) {
      if (obj.HasProperty(descFields[i])) {
        v = obj.Get(descFields[i]);
        if (v.IsCompletion) { if (v.IsAbruptCompletion) return v; else v = v.value; }
        desc[descProps[i]] = v;
      }
    }

    if ('Get' in desc) {
      if (desc.Get !== undefined && !desc.Get || !desc.Get.Call)
        return ThrowException('getter_must_be_callable', [typeof desc.Get]);
    }

    if ('Set' in desc) {
      if (desc.Set !== undefined && !desc.Set ||  !desc.Set.Call)
        return ThrowException('setter_must_be_callable', [typeof desc.Set]);
    }

    if (('Get' in desc || 'Set' in desc) && ('Value' in desc || 'Writable' in desc))
      return ThrowException('value_and_accessor', [desc]);

    return desc;
  }

  // ## IsAccessorDescriptor

  function IsAccessorDescriptor(desc) {
    return desc === undefined ? false : 'Get' in desc || 'Set' in desc;
  }

  // ## IsDataDescriptor

  function IsDataDescriptor(desc) {
    return desc === undefined ? false : 'Value' in desc || 'Writable' in desc;
  }

  // ## IsGenericDescriptor

  function IsGenericDescriptor(desc) {
    return desc === undefined ? false : !(IsAccessorDescriptor(desc) || IsDataDescriptor(desc));
  }

  // ## ToCompletePropertyDescriptor

  function ToCompletePropertyDescriptor(obj) {
    var desc = ToPropertyDescriptor(obj);
    if (desc.IsCompletion) { if (desc.IsAbruptCompletion) return desc; else desc = desc.value; }

    if (IsGenericDescriptor(desc) || IsDataDescriptor(desc)) {
      'Value' in desc    || (desc.Value = undefined);
      'Writable' in desc || (desc.Writable = false);
    } else {
      'Get' in desc || (desc.Get = undefined);
      'Set' in desc || (desc.Set = undefined);
    }
    'Enumerable' in desc   || (desc.Enumerable = false);
    'Configurable' in desc || (desc.Configurable = false);
    return desc;
  }

  // ## IsEmptyDescriptor

  function IsEmptyDescriptor(desc) {
    return !('Get' in desc
          || 'Set' in desc
          || 'Value' in desc
          || 'Writable' in desc
          || 'Enumerable' in desc
          || 'Configurable' in desc);
  }

  // ## IsEquivalentDescriptor

  function IsEquivalentDescriptor(a, b) {
    if (a && a.IsCompletion) { if (a.IsAbruptCompletion) return a; else a = a.value; }
    if (b && b.IsCompletion) { if (b.IsAbruptCompletion) return b; else b = b.value; }
    return SameValue(a.Get, b.Get) &&
           SameValue(a.Set, b.Set) &&
           SameValue(a.Value, b.Value) &&
           SameValue(a.Writable, b.Writable) &&
           SameValue(a.Enumerable, b.Enumerable) &&
           SameValue(a.Configurable, b.Configurable);
  }

  // ## GetIdentifierReference

  function GetIdentifierReference(lex, name, strict){
    if (lex === null) {
      return new Reference(undefined, name, strict);
    } else if (lex.HasBinding(name)) {
      return new Reference(lex.bindings, name, strict);
    } else {
      return GetIdentifierReference(lex.outer, name, strict);
    }
  }

  // ## HasPrimitiveBase

  function HasPrimitiveBase(v){
    var type = typeof v.base;
    return type === STRING || type === NUMBER || type === BOOLEAN;
  }

  // ## IsPropertyReference

  function IsPropertyReference(v){
    return HasPrimitiveBase(v) || v.base instanceof $Object;
  }

  // ## IsUnresolvableReference

  function IsUnresolvableReference(v){
    return v.base === undefined;
  }

  // ## IsSuperReference

  function IsSuperReference(v){
    return 'thisValue' in v;
  }


  // ## GetValue

  function GetValue(v){
    if (!v || !v.IsReference) {
      return v;
    } else if (IsUnresolvableReference(v)) {
      return ThrowException('non_object_property_load', [v.name, v.base]);
    } else {
      var base = v.base;

      if (HasPrimitiveBase(v)) {
        base = new $PrimitiveBase(base);
      }

      if (base instanceof $Object) {
        if (IsSuperReference(v)) {
          return base.GetP(GetThisValue(v), v.name);
        } else {
          return base.Get(v.name);
        }
      } else if (base && base.GetBindingValue) {
        return base.GetBindingValue(v.name, v.strict);
      } else {
        return base;
      }
    }
  }

  // ## PutValue

  function PutValue(v, w){
    if (!v || !v.IsReference) {
      return ThrowException('non_object_property_store', [v.name, v.base]);
    } else if (IsUnresolvableReference(v)) {
      if (v.strict) {
        return ThrowException('not_defined', [v.name, v.base]);
      } else {
        return global.Put(v.name, w, false);
      }
    } else {
      var base = v.base;

      if (HasPrimitiveBase(v)) {
        base = new $PrimitiveBase(base);
      }

      if (base instanceof $Object) {
        if (IsSuperReference(v)) {
          return base.SetP(GetThisValue(v), v.name, w);
        } else {
          return base.Put(v.name, w, v.strict);
        }
      } else {
        return base.SetMutableBinding(v.name, w, v.strict);
      }
    }
  }

  // ## GetThisValue

  function GetThisValue(v){
    if (!v || !v.IsReference) {
      return v;
    } else if (IsUnresolvableReference(v)) {
      return ThrowException('non_object_property_load', [v.name, v.base]);
    } else if ('thisValue' in v) {
      return v.thisValue;
    } else if (v.bindings === global) {
      return v.bindings;
    } else {
      return v.base;
    }
  }


  // ## GetThisEnvironment

  function GetThisEnvironment(){
    var env = context.LexicalEnvironment;
    while (env) {
      if (env.HasThisBinding())
        return env;
      env = env.outer;
    }
  }

  function ThisResolution() {
    return GetThisEnvironment().GetThisBinding();
  }

  // ## NewObjectEnvironment

  function NewObjectEnvironment(outer, object){
    var lex = new ObjectEnvironmentRecord(object);
    lex.outer = outer;
    return lex;
  }

  // ## NewDeclarativeEnvironment

  function NewDeclarativeEnvironment(outer){
    var lex = new DeclarativeEnvironmentRecord;
    lex.outer = outer;
    return lex;
  }

  // ## NewMethodEnvironment

  function NewMethodEnvironment(method, receiver){
    var lex = new MethodEnvironmentRecord(receiver, method.Home, method.MethodName);
    lex.outer = method.Scope;
    return lex;
  }


  function ToPrimitive(argument, hint){
    if (typeof argument === OBJECT) {
      if (argument === null) {
        return argument;
      } else if (argument.IsCompletion) {
        if (argument.IsAbruptCompletion) {
          return argument;
        }
        return ToPrimitive(argument.value, hint);
      }
      return ToPrimitive(argument.DefaultValue(hint), hint);
    } else {
      return argument;
    }
  }

  function ToBoolean(argument){
    if (!argument) {
      return false;
    } else if (typeof argument === OBJECT && argument.IsCompletion) {
      if (argument.IsAbruptCompletion) {
        return argument;
      } else {
        return !!argument.value;
      }
    } else {
      return !!argument;
    }
  }

  function ToNumber(argument){
    if (argument !== null && typeof argument === OBJECT) {
      if (argument.IsCompletion) {
        if (argument.IsAbruptCompletion) {
          return argument;
        }
        return ToNumber(argument.value);
      }
      return ToNumber(ToPrimitive(argument, 'Number'));
    } else {
      return +argument;
    }
  }

  function ToInteger(argument){
    if (argument && typeof argument === OBJECT && argument.IsCompletion) {
      if (argument.IsAbruptCompletion) {
        return argument;
      }
      argument = argument.value;
    }
    return ToNumber(argument) | 0;
  }

  function ToUint32(argument){
    if (argument && typeof argument === OBJECT && argument.IsCompletion) {
      if (argument.IsAbruptCompletion) {
        return argument;
      }
      argument = argument.value;
    }
    return ToNumber(argument) >>> 0;
  }

  function ToInt32(argument){
    if (argument && typeof argument === OBJECT && argument.IsCompletion) {
      if (argument.IsAbruptCompletion) {
        return argument;
      }
      argument = argument.value;
    }
    return ToNumber(argument) >> 0;
  }

  function ToUint32(argument){
    if (argument && typeof argument === OBJECT && argument.IsCompletion) {
      if (argument.IsAbruptCompletion) {
        return argument;
      }
      argument = argument.value;
    }
    return (ToNumber(argument) >>> 0) % (1 << 16);
  }

  function ToObject(argument){
    switch (typeof argument) {
      case BOOLEAN:
        return new $Boolean(argument);
      case NUMBER:
        return new $Number(argument);
      case STRING:
        return new $String(argument);
      case UNDEFINED:
        return ThrowException('undefined_to_object', []);
      case OBJECT:
        if (argument === null) {
          return ThrowException('null_to_object', []);
        } else if (argument.IsCompletion) {
          if (argument.IsAbruptCompletion) {
            return argument;
          }
          return ToObject(argument.value);
        }
        return argument;
    }
  }

  function ToPropertyKey(argument){
    if (argument && typeof argument === OBJECT && argument.NativeBrand === NativePrivateName) {
      return argument;
    } else {
      return ToString(argument);
    }
  }

  function ToString(argument){
    switch (typeof argument) {
      case STRING: return argument;
      case UNDEFINED:
      case NUMBER:
      case BOOLEAN: return ''+argument;
      case OBJECT:
        if (argument === null) {
          return 'null';
        } else if (argument.IsCompletion) {
          if (argument.IsAbruptCompletion) {
            return argument;
          }
          return ToString(argument.value);
        }
        return ToString(ToPrimitive(argument, 'String'));
    }
  }

  // ## CheckObjectCoercible

  function CheckObjectCoercible(argument){
    if (argument === null) {
      return ThrowException('null_to_object');
    } else if (argument === undefined) {
      return ThrowException('undefined_to_object');
    } else if (typeof argument === OBJECT && argument.IsCompletion) {
      if (argument.IsAbruptCompletion) {
        return argument;
      }
      return CheckObjectCoercible(argument.value);
    } else {
      return argument;
    }
  }

  // ## IsCallable

  function IsCallable(argument){
    if (argument && typeof argument === OBJECT) {
      if (argument.IsCompletion) {
        if (argument.IsAbruptCompletion) {
          return argument;
        }
        return IsCallable(argument.value);
      }
      return 'Call' in argument;
    } else {
      return false;
    }
  }


  // ## IsArrayIndex

  function IsArrayIndex(argument) {
    var n = +argument >>> 0;
    if ('' + n === argument && n !== 0xffffffff) {
      return true;
    }
    return false;
  }


  // ## SameValue

  function SameValue(x, y) {
    if (x && x.IsCompletion) { if (x.IsAbruptCompletion) return x; else x = x.value; }
    if (y && y.IsCompletion) { if (y.IsAbruptCompletion) return y; else y = y.value; }
    return x === y ? (x !== 0 || 1 / x === 1 / y) : (x !== x && y !== y);
  }

  // ## StrictEqual

  function StrictEqual(x, y) {
    if (x && x.IsCompletion) { if (x.IsAbruptCompletion) return x; else x = x.value; }
    if (y && y.IsCompletion) { if (y.IsAbruptCompletion) return y; else y = y.value; }
    return x === y;
  }

  // ## Equal

  function Equal(left, right){
    var leftType = typeof left,
        rightType = typeof right;

    if (leftType === rightType) {
      return StrictEqual(left, right);
    } else if (left == null && left == right) {
      return true;
    } else if (leftType === NUMBER && rightType === STRING) {
      return Equal(left, ToNumber(right));
    } else if (leftType === STRING && rightType === NUMBER) {
      return Equal(ToNumber(left), right);
    } else if (rightType === OBJECT && leftType === STRING || leftType === OBJECT) {
      return Equal(left, ToPrimitive(right));
    } else if (leftType === OBJECT && rightType === STRING || rightType === OBJECT) {
      return Equal(ToPrimitive(left), right);
    } else {
      return false;
    }
  }

  // ## Invoke

  function Invoke(key, receiver, args){
    var obj = ToObject(receiver);
    if (obj && obj.IsCompletion) { if (obj.IsAbruptCompletion) return obj; else obj = obj.value; }

    var func = obj.Get(key);
    if (func && func.IsCompletion) { if (func.IsAbruptCompletion) return func; else func = func.value; }

    if (!IsCallable(func))
      return ThrowException('called_non_callable', key);

    return func.Call(receiver, args);
  }


  function MakeConstructor(func, writablePrototype, prototype){
    var install = prototype === undefined;
    if (install)
      prototype = new $Object;
    if (writablePrototype === undefined)
      writablePrototype = true;
    if (install)
      prototype.defineDirect('constructor', func, writablePrototype ? _CW : ___);
    defineDirect(func, 'prototype', prototype, writablePrototype ? __W : ___);
  }

  // ## CreateStrictArgumentsObject


  // 10.6
  function CreateStrictArgumentsObject(args) {
    var obj = new $Arguments(args.length);

    for (var i=0; i < args.length; i++)
      defineDirect(obj, i, args[i], ECW);

    //defineDirect(obj, 'caller', intrinsics.ThrowTypeError, __A);
    //defineDirect(obj, 'arguments', intrinsics.ThrowTypeError, __A);
    return obj;
  }

  // ## CreateMappedArgumentsObject

  function CreateMappedArgumentsObject(func, names, env, args){
    var obj = new $Arguments(args.length),
        map = new $Object,
        mapped = create(null),
        count = 0;

    for (var i=0; i < args.length; i++) {
      defineDirect(obj, i, args[i], ECW);
      var name = names[i];
      if (i < names.length && !(name in mapped)) {
        count++;
        mapped[name] = true;
        defineDirect(map, names[i], new ArgAccessor(name, env), _CA);
      }
    }

    if (count) {
      obj.ParameterMap = map;
    }
    defineDirect(obj, 'callee', func, _CW);
    return obj;
  }


  // ## EvaluateCall

  function EvaluateCall(ref, args, tail){
    var func = GetValue(ref);
    if (!IsCallable(func))
      return ThrowException('called_non_callable', key);

    if (ref !== func) {
      var thisValue = IsPropertyReference(ref) ? GetThisValue(ref) : ref.base.WithBaseObject();
    }

    return func.Call(thisValue, args);
  }

  // ## FunctionDeclarationInstantiation


  function FunctionDeclarationInstantiation(func, args, env) {
    var params = func.FormalParameters,
        names = params.BoundNames,
        status;

    for (var i=0; i < names.length; i++) {
      if (!env.HasBinding(names[i])) {
        status = env.CreateMutableBinding(names[i]);
        if (status.IsAbruptCompletion) {
          return status;
        }

        if (!func.Strict) {
          env.InitializeBinding(names[i], undefined);
        }
      }
    }

    if (func.Strict) {
      var ao = CreateStrictArgumentsObject(args);
      status = BindingInitialisation(params, ao, env);
    } else {
      var ao = CreateMappedArgumentsObject(names, env, args, func);
      status = BindingInitialisation(params, CreateStrictArgumentsObject(args), undefined);
    }

    if (status && status.IsCompletion) {
      if (status.IsAbruptCompletion) {
        return status;
      } else {
        status = status.value;
      }
    }

    var declarations = func.Code.LexicalDeclarations;
    for (var i=0; i < declarations.length; i++) {
      var decl = declarations[i];
      for (var j=0; j < decl.BoundNames.length; j++) {
        var name = decl.BoundNames[j];
        if (!env.HasBinding(name)) {
          if (decl.IsConstantDeclaration) {
            env.CreateImmutableBinding(name);
          } else {
            env.CreateMutableBinding(name, false);
          }
        }
      }
    }

    if (!env.HasBinding('arguments')) {
      if (func.Strict) {
        env.CreateImmutableBinding('arguments');
      } else {
        env.CreateMutableBinding('arguments');
      }
      env.InitializeBinding('arguments', ao);
    }

    var vardecls = func.Code.VarDeclaredNames;

    for (i=0; i < vardecls.length; i++) {
      if (!env.HasBinding(vardecls[i])) {
        env.CreateMutableBinding(vardecls[i]);
        env.InitializeBinding(vardecls[i], undefined);
      }
    }

    var funcs = create(null);

    for (i=0; i < declarations.length; i++) {
      if (declarations[i].type === 'FunctionDeclaration') {
        decl = declarations[i];
        name = decl.BoundNames[0];

        if (!(name in funcs)) {
          funcs[name] = true;
          env.InitializeBinding(name, InstantiateFunctionDeclaration(decl));
        }
      }
    }
  }

  function InstantiateFunctionDeclaration(decl) {
    var func = new $Function('Normal', decl.BoundNames[0], decl.Code.params, decl.Code, context.LexicalEnvironment, code.Strict);
    MakeConstructor(func);
    return func;
  }

  function IdentifierResolution(name) {
    return GetIdentifierReference(context.LexicalEnvironment, name, context.strict);
  }

  function BindingInitialisation(pattern, value, env) {
    if (pattern.type === 'Identifier') {
      if (env !== undefined) {
        return env.InitializeBinding(pattern.name, value);
      } else {
        return PutValue(IdentifierResolution(pattern.name), value);
      }
    } else if (pattern.type === 'ArrayPattern') {
      return IndexedBindingInitialisation(pattern, value, 0, env);
    } else if (pattern.type === 'ObjectPattern') {
    }
  }

  function IndexedBindingInitialisation(pattern, array, i, env) {
    for (var element; element = pattern.elements[i]; i++) {
      BindingInitialisation(element, array.Get(i), env);
    }
  }

  // function ArgumentListEvaluation(args){
  //   if (!args || args instanceof Array && !args.length) {
  //     Ω([]);
  //   } else if (args.type === 'AssignmentExpression') {
  //     evaluate(args, function(ref){
  //       GetValue(ref, function(arg){
  //         Ω([arg]);
  //       }, ƒ);
  //     }, ƒ);
  //   } else if (args instanceof Array) {
  //     var last = args[args.length - 1];
  //     if (last && last.type === 'AssignmentExpression')
  //   }
  //}




  function DefineProperty(obj, key, val) {
    if (val && val.IsCompletion) {
      if (val.IsAbruptCompletion) {
        return val;
      } else {
        val = val.value;
      }
    }
    return obj.DefineOwnProperty(key, new NormalDescriptor(val), false);
  }

  function PropertyDefinitionEvaluation(kind, obj, key, code) {
    if (kind === 'get') {
      return DefineGetter(obj, key, code);
    } else if (kind === 'set') {
      return DefineSetter(obj, key, code);
    } else if (kind === 'method') {
      return DefineMethod(obj, key, code);
    }
  }

  var DefineMethod, DefineGetter, DefineSetter;

  void function(){
    function makeDefiner(constructs, field, desc){
      return function(obj, key, code) {
        var sup = code.NeedsSuperBinding,
            home = sup ? obj : undefined,
            func = new $Function('Method', key, code.params, code, context.LexicalEnvironment, code.Strict, undefined, home, sup);

        constructs && MakeConstructor(func);
        desc[field] = func;
        var result = obj.DefineOwnProperty(key, desc, false);
        desc[field] = undefined;

        return result && result.IsAbruptCompletion ? result : func;
      };
    }

    DefineMethod = makeDefiner(false, 'Value', {
      Value: undefined,
      Writable: true,
      Enumerable: true,
      Configurable: true
    });

    DefineGetter = makeDefiner(true, 'Get', {
      Get: undefined,
      Enumerable: true,
      Configurable: true
    });

    DefineSetter = makeDefiner(true, 'Set', {
      Set: undefined,
      Enumerable: true,
      Configurable: true
    });
  }();



  function DefineOwn(obj, key, desc) {
    if (val && val.IsCompletion) {
      if (val.IsAbruptCompletion) {
        return val;
      } else {
        val = val.value;
      }
    }
    return DefineOwnProperty.call(obj, key, desc, false);
  }

  // ###########################
  // ###########################
  // ### Specification Types ###
  // ###########################
  // ###########################


  // #################
  // ### Reference ###
  // #################

  function Reference(base, name, strict){
    this.base = base;
    this.name = name;
    this.strict = strict;
  }

  define(Reference.prototype, {
    IsReference: ReferenceSigil
  });



  // ##################
  // ### Completion ###
  // ##################

  function Completion(type, value, target){
    this.type = type;
    this.value = value;
    this.target = target;
  }

  define(Completion.prototype, {
    IsCompletion: CompletionSigil
  }, [
    function toString(){
      return this.value;
    },
    function valueOf(){
      return this.value;
    }
  ]);

  function AbruptCompletion(type, value, target){
    this.type = type;
    this.value = value;
    this.target = target;
  }

  inherit(AbruptCompletion, Completion, {
    IsAbruptCompletion: AbruptCompletionSigil
  });



  // ##########################
  // ### PropertyDescriptor ###
  // ##########################

  function PropertyDescriptor(attributes){
    this.Enumerable = (attributes & ENUMERABLE) > 0;
    this.Configurable = (attributes & CONFIGURABLE) > 0;
  }

  define(PropertyDescriptor.prototype, {
    Enumerable: undefined,
    Configurable: undefined
  });

  function DataDescriptor(value, attributes){
    this.Value = value;
    this.Writable = (attributes & WRITABLE) > 0;
    this.Enumerable = (attributes & ENUMERABLE) > 0;
    this.Configurable = (attributes & CONFIGURABLE) > 0;
  }

  inherit(DataDescriptor, PropertyDescriptor, {
    Writable: undefined,
    Value: undefined
  });

  function AccessorDescriptor(accessors, attributes){
    this.Get = accessors.Get;
    this.Set = accessors.Set;
    this.Enumerable = (attributes & ENUMERABLE) > 0;
    this.Configurable = (attributes & CONFIGURABLE) > 0;
  }

  inherit(AccessorDescriptor, PropertyDescriptor, {
    Get: undefined,
    Set: undefined
  });

  function NormalDescriptor(value){
    this.Value = value;
  }

  var emptyValue = NormalDescriptor.prototype = new DataDescriptor(undefined, ECW);

  function StringIndice(value){
    this.Value = value;
  }

  StringIndice.prototype = new DataDescriptor(undefined, E__);

  function Accessor(get, set){
    this.Get = get;
    this.Set = set;
  }

  define(Accessor.prototype, {
    Get: undefined,
    Set: undefined
  });


  // #########################
  // ### EnvironmentRecord ###
  // #########################

  function EnvironmentRecord(bindings){
    this.bindings = bindings;
  }

  define(EnvironmentRecord.prototype, {
    bindings: null,
    thisValue: null,
    withBase: undefined
  });

  define(EnvironmentRecord.prototype, [
    function HasBinding(name){},
    function GetBindingValue(name, strict){},
    function SetMutableBinding(name, value, strict){},
    function DeleteBinding(name){},
    function CreateVarBinding(name, deletable){
      this.CreateMutableBinding(name, deletable);
    },
    function WithBaseObject(){
      return this.withBase;
    },
    function HasThisBinding(){
      return false;
    },
    function HasSuperBinding(){
      return false;
    },
    function GetThisBinding(){},
    function GetSuperBase(){}
  ]);


  function DeclarativeEnvironmentRecord(){
    EnvironmentRecord.call(this, new Hash);
    this.consts = new Hash;
    this.deletables = new Hash;
  }

  inherit(DeclarativeEnvironmentRecord, EnvironmentRecord, [
    function HasBinding(name){
      return name in this.bindings;
    },
    function CreateMutableBinding(name, deletable){
      this.bindings[name] = undefined;
      if (deletable)
        this.deletables[name] = true;
    },
    function InitializeBinding(name, value){
      this.bindings[name] = value;
    },
    function GetBindingValue(name, strict){
      if (name in this.bindings) {
        var value = this.bindings[name];
        if (value === UNINITIALIZED)
          return ThrowException('uninitialized_const', name);
        else
          return value;
      } else if (strict) {
        return ThrowException('not_defined', name);
      } else {
        return false;
      }
    },
    function SetMutableBinding(name, value, strict){
      if (name in this.consts) {
        if (this.bindings[name] === UNINITIALIZED)
          return ThrowException('uninitialized_const', name);
        else if (strict)
          return ThrowException('const_assign', name);
      } else {
        this.bindings[name] = value;
      }
    },
    function CreateImmutableBinding(name){
      this.bindings[name] = UNINITIALIZED;
      this.consts[name] = true;
    },
    function DeleteBinding(name){
      if (name in this.bindings) {
        if (name in this.deletables) {
          delete this.bindings[name];
          delete this.deletables[names];
          return true;
        } else {
          return false;
        }
      } else {
        return true;
      }
    }
  ]);


  function ObjectEnvironmentRecord(object){
    EnvironmentRecord.call(this, object);
  }

  inherit(ObjectEnvironmentRecord, EnvironmentRecord, [
    function HasBinding(name){
      return this.bindings.HasProperty(name);
    },
    function CreateMutableBinding(name, deletable){
      return this.bindings.DefineOwnProperty(name, emptyValue, true);
    },
    function InitializeBinding(name, value){
      return this.bindings.DefineOwnProperty(name, new DataDescriptor(value, ECW), true);
    },
    function GetBindingValue(name, strict){
      if (this.bindings.HasProperty(name)) {
        return this.bindings.Get(name);
      } else if (strict) {
        ThrowException('not_defined', name);
      }
    },
    function SetMutableBinding(name, value, strict){
      return this.bindings.Put(name, value, strict);
    },
    function DeleteBinding(name){
     return this.bindings.Delete(name, false);
    }
  ]);


  function MethodEnvironmentRecord(receiver, holder, name){
    DeclarativeEnvironmentRecord.call(this);
    this.thisValue = receiver;
    this.HomeObject = holder;
    this.MethodName = name;
  }

  inherit(MethodEnvironmentRecord, DeclarativeEnvironmentRecord, {
    HomeObject: undefined,
    MethodName: undefined,
    thisValue: undefined,
  }, [
    function HasThisBinding(){
      return true;
    },
    function HasSuperBinding(){
      return this.HomeObject !== undefined;
    },
    function GetThisBinding(){
      return this.thisValue;
    },
    function GetSuperBase(){
      return this.HomeObject ? this.HomeObject.Prototype : undefined;
    },
    function GetMethodName() {
      return this.MethodName;
    }
  ]);


  function GlobalEnvironmentRecord(global){
    ObjectEnvironmentRecord.call(this, global);
  }

  inherit(GlobalEnvironmentRecord, ObjectEnvironmentRecord, {
    outer: null
  }, [
    function GetThisBinding(){
      return this.bindings;
    },
    function HasThisBinding(){
      return true;
    },
    function GetSuperBase(){
      return this.bindings;
    }
  ]);



  function defineDirect(o, key, value, attrs){
    o.properties[key] = value;
    o.attributes[key] = attrs;
    o.keys.add(key);
  }
  function hasDirect(o, key){
    return key in o.properties;
  }
  function hasOwnDirect(o, key){
    return o.keys.has(key);
  }
  function setDirect(o, key, value){
    o.properties[key] = value;
    if (!(key in o.attributes))
      o.attributes[key] = ECW;
    o.keys.add(key);
  }
  function getDirect(o, key){
    return o.properties[key];
  }

  // ###################
  // ### NativeBrand ###
  // ##################

  function NativeBrand(name){
    this.name = name;
  }

  define(NativeBrand.prototype, [
    function toString(){
      return this.name;
    },
    function inspect(){
      return this.name;
    }
  ]);

  var NativeArguments   = new NativeBrand('Arguments'),
      NativeArray       = new NativeBrand('Array'),
      NativeDate        = new NativeBrand('Date'),
      NativeFunction    = new NativeBrand('Function'),
      NativeMap         = new NativeBrand('Map'),
      NativeObject      = new NativeBrand('Object'),
      NativePrivateName = new NativeBrand('PrivateName'),
      NativeRegExp      = new NativeBrand('RegExp'),
      NativeSet         = new NativeBrand('Set'),
      NativeWeakMap     = new NativeBrand('WeakMap'),
      BooleanWrapper    = new NativeBrand('Boolean'),
      NumberWrapper     = new NativeBrand('Number'),
      StringWrapper     = new NativeBrand('String');


  // ###############
  // ### $Object ###
  // ###############

  function $Object(proto){
    if (proto === null) {
      this.Prototype = null;
      this.properties = create(null);
      this.attributes = new Hash;
    } else {
      if (proto === undefined)
        proto = intrinsics.ObjectProto;
      this.Prototype = proto;
      this.properties = create(proto.properties);
      this.attributes = create(proto.attributes);
    }
    define(this, 'keys', new PropertyList)
  }

  define($Object.prototype, {
    Extensible: true,
    NativeBrand: NativeObject
  });

  define($Object.prototype, [
    function GetOwnProperty(key){
      if (this.keys.has(key)) {
        var attrs = this.attributes[key];
        var Descriptor = attrs & ACCESSOR ? AccessorDescriptor : DataDescriptor;
        return new Descriptor(this.properties[key], attrs);
      }
    },
    function GetProperty(key){
      var desc = this.GetOwnProperty(key);
      if (desc)
        return desc
      else if (this.Prototype)
        return proto.GetProperty(key);
    },
    function Get(key){
      return this.GetP(this, key);
    },
    function Put(key, value, strict){
      if (!this.SetP(this, key, value) && strict)
        return ThrowException('strict_cannot_assign', [key]);
    },
    function GetP(receiver, key){
      if (!this.keys.has(key)) {
        if (this.Prototype) {
          return this.Prototype.GetP(receiver, key);
        }
      } else {
        var attrs = this.attributes[key];
        if (attrs & ACCESSOR) {
          var getter = this.properties[key].get;
          if (IsCallable(getter))
            return getter.Call(receiver, []);
        } else {
          return this.properties[key];
        }
      }
    },
    function SetP(receiver, key, value) {
      if (this.keys.has(key)) {
        var attrs = this.attributes[key];
        if (attrs & ACCESSOR) {
          var setter = this.properties[key].set;
          if (IsCallable(setter)) {
            setter.Call(receiver, [value]);
            return true;
          } else {
            return false;
          }
        } else if (attrs & WRITABLE) {
          if (this === receiver) {
            return this.DefineOwnProperty(key, { value: value }, false);
          } else if (!receiver.Extensible) {
            return false;
          } else {
            return receiver.DefineOwnProperty(key, new DataDescriptor(value, ECW), false);
          }
        } else {
          return false;
        }
      } else {
        if (!this.Prototype) {
          if (!receiver.Extensible) {
            return false;
          } else {
            return receiver.DefineOwnProperty(key, new DataDescriptor(value, ECW), false);
          }
        } else {
          return this.Prototype.SetP(receiver, key, value);
        }
      }
    },
    function DefineOwnProperty(key, desc, strict){
      var reject = strict
          ? function(e, a){ return ThrowException(e, a) }
          : function(e, a){ return false };

      var current = this.GetOwnProperty(key);

      if (current === undefined) {
        if (!this.Extensible) {
          return reject('define_disallowed', []);
        } else {
          if (IsGenericDescriptor(desc) || IsDataDescriptor(desc)) {
            this.attributes[key] = desc.Writable | (desc.Enumerable << 1) | (desc.Configurable << 2);
            this.properties[key] = desc.Value;
          } else {
            this.attributes[key] = ACCESSOR | (desc.Enumerable << 1) | (desc.Configurable << 2);
            this.properties[key] = new Accessor(desc.Get, desc.Set);
          }
          this.keys.add(key);
          return true;
        }
      } else {
        var rejected = false;

        if (IsEmptyDescriptor(desc) || IsEquivalentDescriptor(desc, current)) {
          return;
        }

        if (!current.Configurable) {
          if (desc.Configurable || desc.Enumerable === !current.Configurable) {
            return reject('redefine_disallowed', []);
          } else {
            var currentIsData = IsDataDescriptor(current),
                descIsData = IsDataDescriptor(desc);

            if (currentIsData !== descIsData)
              return reject('redefine_disallowed', []);
            else if (currentIsData && descIsData)
              if (!current.Writable && 'Value' in desc && desc.Value !== current.Value)
                return reject('redefine_disallowed', []);
            else if ('Set' in desc && desc.Set !== current.Set)
              return reject('redefine_disallowed', []);
            else if ('Get' in desc && desc.Get !== current.Get)
              return reject('redefine_disallowed', []);
          }
        }

        'Configurable' in desc || (desc.Configurable = current.Configurable);
        'Enumerable' in desc || (desc.Enumerable = current.Enumerable);

        if (IsAccessorDescriptor(desc)) {
          this.attributes[key] = ACCESSOR | (desc.Enumerable << 1) | (desc.Configurable << 2);
          if (IsDataDescriptor(current)) {
            this.properties[key] = new Accessor(desc.Get, desc.Set);
          } else {
            if ('Set' in desc)
              this.properties[key].Set = desc.Set;
            if ('Get' in desc)
              this.properties[key].Get = desc.Get;
          }
        } else {
          if (IsAccessorDescriptor(current)) {
            current.Writable = true;
          }
          'Writable' in desc || (desc.Writable = current.Writable)
          this.properties[key] = desc.Value;
          this.attributes[key] = desc.Writable | (desc.Enumerable << 1) | (desc.Configurable << 2);
        }

        this.keys.add(key);
        return true;
      }
    },
    function HasOwnProperty(key){
      return this.keys.has(key);
    },
    function HasProperty(key){
      if (this.keys.has(key)) {
        return true;
      } else if (this.Prototype) {
        return this.Prototype.HasProperty(key);
      } else {
        return false;
      }
    },
    function Delete(key, strict){
      if (!this.keys.has(key)) {
        return true;
      } else if (this.attributes[key] & CONFIGURABLE) {
        delete this.properties[key];
        delete this.attributes[key];
        this.keys.remove(key);
        return true;
      } else if (strict) {
        return ThrowException('strict_delete', []);
      } else {
        return false;
      }
    },
    function Enumerate(){
      var props = this.keys.filter(function(key){
        return this.attributes[key] & ENUMERABLE;
      }, this);

      if (this.Prototype) {
        props.add(this.Prototype.Enumerate());
      }

      return props.toArray();
    },
    function GetOwnPropertyNames(){
      return this.keys.toArray();
    },
    function GetPropertyNames(){
      var props = this.keys.clone();

      if (this.Prototype) {
        props.add(this.Prototype.GetPropertyNames());
      }

      return props.toArray();
    },
    function DefaultValue(hint){
      var order = hint === 'String' ? ['toString', 'valueOf'] : ['valueOf', 'toString'];

      for (var i=0; i < 2; i++) {
        var method = this.Get(order[i]);
        if (method && method.IsCompletion) {
          if (method.IsAbruptCompletion) {
            return method;
          } else {
            method = method.value;
          }
        }

        if (IsCallable(method)) {
          var val = method.Call(this, []);
          if (val && val.IsCompletion) {
            if (val.IsAbruptCompletion) {
              return val;
            } else {
              val = val.value;
            }
          }
          if (!isObject(val)) {
            return val;
          }
        }
      }

      return ThrowError('cannot_convert_to_primitive', []);
    },
  ]);

  var DefineOwnProperty = $Object.prototype.DefineOwnProperty;

  // #################
  // ### $Function ###
  // #################

  function $Function(kind, name, params, code, scope, strict, proto, holder, method){
    if (proto === undefined)
      proto = intrinsics.FunctionProto;

    $Object.call(this, proto);
    this.FormalParameters = params;
    this.ThisMode = kind === 'Arrow' ? 'lexical' : strict ? 'strict' : 'global';
    this.Strict = strict;
    this.Realm = realm;
    this.Scope = scope;
    this.Code = code;
    if (holder !== undefined)
      this.Home = holder;
    if (method) {
      this.MethodName = name;
    } else if (typeof name === 'string') {
      defineDirect(this, 'name', name, ___);
    }

    defineDirect(this, 'length', params.ExpectedArgumentCount, ___);
    if (kind === 'Normal' && strict) {
      defineDirect(this, 'caller', intrinsics.ThrowTypeError, __A);
      defineDirect(this, 'arguments', intrinsics.ThrowTypeError, __A);
    }
  }

  inherit($Function, $Object, {
    NativeBrand: NativeFunction,
    FormalParameters: null,
    Code: null,
    Scope: null,
    TargetFunction: null,
    BoundThis: null,
    BoundArguments: null,
    Strict: false,
    ThisMode: 'global',
    Realm: null,
  }, [
    function Call(receiver, args){
      if (this.ThisMode === 'lexical') {
        var local = NewDeclarativeEnvironment(this.Scope);
      } else {
        if (this.ThisMode !== 'strict') {
          if (receiver == null) {
            receiver = this.Realm.global;
          } else if (typeof receiver !== 'object') {
            receiver = ToObject(receiver);
            if (receiver.IsCompletion) {
              if (receiver.IsAbruptCompletion) {
                return receiver;
              } else {
                receiver = receiver.value;
              }
            }
          }
        }
        var local = NewMethodEnvironment(this, receiver);
      }

      ExecutionContext.push(new ExecutionContext(context, local, this.Realm, this.Code));

      var status = FunctionDeclarationInstantiation(this, args, local);
      if (status && status.IsAbruptCompletion) {
        ExecutionContext.pop();
        return status;
      }

      if (!this.thunk) {
        this.thunk = createThunk(this.code);
      }
      var result = this.thunk(context);
      ExecutionContext.pop();
      if (result.type === ReturnSigil) {
        return result.Value
      }
      return result;
    },
    function Construct(args){
      var prototype = this.Get('prototype');
      if (prototype.IsCompletion) {
        if (prototype.IsAbruptCompletion) {
          return prototype;
        } else {
          prototype = prototype.value;
        }
      }
      var instance = typeof prototype === 'object' ? new $Object(prototype) : new $Object;
      var result = this.Call(obj, argumentsList);
      if (result.IsCompletion) {
        if (result.IsAbruptCompletion) {
          return result;
        } else {
          result = result.value;
        }
      }
      return typeof result === OBJECT ? result : instance;
    },
    function HasInstance(arg){
      if (typeof arg !== 'object' || arg === null) {
        return false;
      }

      var prototype = this.Get('prototype');
      if (prototype.IsCompletion) {
        if (prototype.IsAbruptCompletion) {
          return prototype;
        } else {
          prototype = prototype.value;
        }
      }

      if (typeof prototype !== 'object') {
        return ThrowError('instanceof_nonobject_proto');
      }

      arg = arg.Prototype;
      while (arg) {
        if (prototype === arg) {
          return true;
        }
      }
      return false;
    }
  ]);


  function $NativeFunction(code, name, length){
    $Function.call(this, 'Normal', name, [], code, realm.globalEnv, false);
    defineDirect(this, 'length', length, ___);
  }

  inherit($NativeFunction, $Function, {
    Native: true,
  }, [
    function Call(receiver, args){
      this.Code(receiver, args);
    },
    function Construct(args){
      if (hasDirect(this, 'prototype')) {
        var instance = new $Object(getDirect(this, 'prototype'));
      }
      this.Code(instance, args);
    }
  ]);


  // #############
  // ### $Date ###
  // #############

  function $Date(value){
    $Object.call(this, intrinsics.DateProto);
    this.PrimitiveValue = value;
  }

  inherit($Date, $Object, {
    NativeBrand: NativeDate,
    PrimitiveValue: undefined,
  });

  // ###############
  // ### $String ###
  // ###############

  function $String(value){
    $Object.call(this, intrinsics.StringProto);
    this.PrimitiveValue = value;
    defineDirect(this, 'length', value.length, ___);
  }

  inherit($String, $Object, {
    NativeBrand: StringWrapper,
    PrimitiveValue: undefined,
    GetOwnProperty: function GetOwnProperty(key){
      var desc = $Object.prototype.GetOwnProperty.call(this, key);
      if (desc) {
        return desc;
      }

      var index = ToInteger(key);
      if (index.IsCompletion) {
        if (index.IsAbruptCompletion) {
          return index;
        } else {
          index = index.value;
        }
      }

      if (index === +key && this.PrimitiveValue.length > index) {
        return new StringIndice(this.PrimitiveValue[index]);
      }
    }
  });


  // ###############
  // ### $Number ###
  // ###############

  function $Number(value){
    $Object.call(this, intrinsics.NumberProto);
    this.PrimitiveValue = value;
  }

  inherit($Number, $Object, {
    NativeBrand: NumberWrapper,
    PrimitiveValue: undefined,
  });


  // ################
  // ### $Boolean ###
  // ################

  function $Boolean(value){
    $Object.call(this, intrinsics.BooleanProto);
    this.PrimitiveValue = value;
  }

  inherit($Boolean, $Object, {
    NativeBrand: BooleanWrapper,
    PrimitiveValue: undefined,
  });



  // ############
  // ### $Map ###
  // ############

  function $Map(){
    $Object.call(this, intrinsics.MapProto);
  }

  inherit($Map, $Object, {
    NativeBrand: NativeMap,
  });

  // ############
  // ### $Set ###
  // ############

  function $Set(){
    $Object.call(this, intrinsics.SetProto);
  }

  inherit($Set, $Object, {
    NativeBrand: NativeSet,
  });


  // ################
  // ### $WeakMap ###
  // ################

  function $WeakMap(){
    $Object.call(this, intrinsics.WeakMapProto);
  }

  inherit($WeakMap, $Object, {
    NativeBrand: NativeWeakMap,
  });

  // ##############
  // ### $Array ###
  // ##############


  function $Array(items){
    $Object.call(this, intrinsics.ArrayProto);
    if (items instanceof Array) {
      var len = items.length;
      for (var i=0; i < len; i++)
        setDirect(this, i, items[i]);
    } else {
      var len = 0;
    }
    defineDirect(this, 'length', len, _CW);
  }

  inherit($Array, $Object, {
    NativeBrand: NativeArray,
    DefineOwnProperty: function DefineOwnProperty(key, desc, strict){
      var len = this.properties.length,
          writable = this.attributes.length & WRITABLE,
          result;

      var reject = strict
          ? function(){ return ThrowError('strict_read_only_property') }
          : function(){ return false };

      if (key === 'length') {
        if (!('Value' in desc)) {
          return DefineOwn(this, key, desc, strict);
        }

        var newLen = desc.Value >> 0,
            newDesc = { Value: newLen };

        if (desc.Value !== newDesc.Value) {
          return ThrowException('invalid_array_length', [], ƒ);
        } else if (newDesc.Value > len) {
          return DefineOwn(this, 'length', newDesc, strict);
        } else if (!writable) {
          return reject();
        }


        newDesc.Writable = true;
        if (desc.Writable === false) {
          var deferNonWrite = true;
        }

        result = DefineOwn(this, 'length', newDesc, strict);
        if (result.IsCompletion) {
          if (result.IsAbruptCompletion) {
            return result;
          } else {
            result = result.Value;
          }
        }

        if (result === false) {
          return false;
        }

        while (newLen < len--) {
          result = this.Delete(''+len, false);
          if (result.IsCompletion) {
            if (result.IsAbruptCompletion) {
              return result;
            } else {
              result = result.Value;
            }
          }

          if (result === false) {
            newDesc.Value = len + 1;
            result = DefineOwn(this, 'length', newDesc, false);
            if (result.IsAbruptCompletion) {
              return result;
            }
            return reject();
          }
        }

        if (deferNonWrite) {
          DefineOwn(this, 'length', { Writable: false }, false);
        }

        return true;
      } else if ((+key === key | 0) && key > -1) {
        var index = ToUint32(key);
        if (index.IsCompletion) {
          if (index.IsAbruptCompletion) {
            return index;
          } else {
            index = index.Value;
          }
        }

        if (index > len && !writable) {
          return reject();
        }

        result = DefineOwn(this, ''+index, desc, false);
        if (result.IsCompletion) {
          if (result.IsAbruptCompletion) {
            return result;
          } else {
            result = result.Value;
          }
        }

        if (!result) {
          return reject();
        } else {
          if (index > len) {
            this.properties.length = index + 1;
          }
          return true;
        }
      } else {
        return DefineOwn(this, key, desc, strict);
      }
    }
  });


  // ###############
  // ### $RegExp ###
  // ###############

  function $RegExp(native){
    $Object.call(this, intrinsics.RegExpProto);
    this.Source = native;
  }

  inherit($RegExp, $Object, {
    NativeBrand: NativeRegExp,
    Match: null,
  });


  // ####################
  // ### $PrivateName ###
  // ####################

  function $PrivateName(proto){
    $Object.call(this, intrinsics.PrivateNameProto);
  }

  inherit($PrivateName, $Object, {
    NativeBrand: NativePrivateName,
    Match: null,
  });



  // ##################
  // ### $Arguments ###
  // ##################

  function $Arguments(length){
    $Object.call(this);
    defineDirect(this, 'length', length, _CW);
  }

  inherit($Arguments, $Object, {
    NativeBrand: NativeArguments,
    ParameterMap: null,
  }, [
    function Get(key){
      var map = this.ParameterMap;
      if (map.keys.has(key)) {
        return map.properties[key];
      } else {
        return this.GetP(this, key);
      }
    },
    function GetOwnProperty(key){
      var map = this.ParameterMap;
      var desc = $Object.prototype.GetOwnProperty.call(this, key);
      if (desc) {
        if (map.keys.has(key)) {
          return map.properties[key];
        } else {
          return desc;
        }
      }
    }
  ]);


  // ######################
  // ### $PrimitiveBase ###
  // ######################

  function $PrimitiveBase(value, proto){
    this.base = base;
    var type = typeof base;
    if (type === STRING) {
      $Object.call(this, intrinsics.StringProto);
      this.NativeBrand = StringWrapper;
    } else if (type === NUMBER) {
      $Object.call(this, intrinsics.NumberProto);
      this.NativeBrand = NumberWrapper;
    } else if (type === BOOLEAN) {
      $Object.call(this, intrinsics.BooleanProto);
      this.NativeBrand = BooleanWrapper;
    }
  }

  inherit($PrimitiveBase, $Object, [
    function GetProperty(key, receiver){
      var base = this.base;
      var desc = $Object.prototype.GetProperty.call(this, key);
      if (desc === undefined) {
       return desc;
      } else if (desc instanceof $DataDescriptor) {
        return desc.properties.value;
      } else {
        var getter = desc.properties.get;
        if (getter === undefined) {
          return getter;
        } else {
          return getter.Call(receiver || base, []);
        }
      }
    },
    // function Put(key, value, strict){
    //   var base = this.base;
    //   this.SetP(this, key, value, function(desc){
    //   }, ƒ);
    // },
  ]);




  var $builtins = {
    Array   : $Array,
    Boolean : $Boolean,
    Date    : $Date,
    Function: $Function,
    Map     : $Map,
    Number  : $Number,
    RegExp  : $RegExp,
    Set     : $Set,
    String  : $String,
    WeakMap : $WeakMap
  };

  var primitives = {
    Date: Date.prototype,
    String: '',
    Number: 0,
    Boolean: false
  };

  var atoms = {
    NaN: NaN,
    Infinity: Infinity,
    undefined: undefined
  };

  function Realm(){
    var intrinsics = this.intrinsics = create(null);

    intrinsics.ObjectProto = new $Object(null);
    this.global = new $Object(intrinsics.ObjectProto);
    this.globalEnv = new GlobalEnvironmentRecord(this.global);

    for (var k in $builtins) {
      var prototype = intrinsics[k + 'Proto'] = create($builtins[k].prototype);
      $Object.call(prototype, intrinsics.ObjectProto);
      if (k in primitives)
        prototype.PrimitiveValue = primitives[k];
    }

    intrinsics.FunctionProto.Realm = this;
    intrinsics.FunctionProto.Scope = this.globalEnv;
    intrinsics.FunctionProto.FormalParameters = [];
    defineDirect(intrinsics.ArrayProto, 'length', 0, __W);
    for (var k in atoms)
      defineDirect(this.global, k, atoms[k], ___);

    Emitter.call(this);
  }

  inherit(Realm, Emitter, [

  ]);


  function ExecutionContext(caller, local, realm){
    this.caller = caller;
    this.realm = realm;
    this.LexicalEnvironment = local;
    this.VariableEnvironment = local;
  }

  var realm = ExecutionContext.realm = null,
      global = ExecutionContext.global = null,
      context = ExecutionContext.context = null,
      intrinsics = ExecutionContext.intrinsics = null;

  define(ExecutionContext, [
    function update(){
      if (!context) {
        realm = ExecutionContext.realm = null;
        global = ExecutionContext.global = null;
        intrinsics = ExecutionContext.intrinsics = null;
      } else if (context.realm !== realm) {
        realm = ExecutionContext.realm = context.realm;
        if (realm) {
          global = ExecutionContext.global = realm.global;
          intrinsics = ExecutionContext.intrinsics = realm.intrinsics;
        }
      }
    },
    function push(newContext){
      context = ExecutionContext.context = newContext;
      ExecutionContext.update();
    },
    function pop(){
      if (context) {
        var oldContext = context;
        context = context.caller;
        ExecutionContext.update();
        return oldContext;
      }
    },
    function reset(){
      var stack = [];
      while (context)
        stack.push(ExecutionContext.pop());
      return stack;
    }
  ]);

  define(ExecutionContext.prototype, {
    isGlobal: false,
    strict: false,
    isEval: false,
  });


  function instructions(ops, opcodes){
    var out = [];
    for (var i=0; i < ops.length; i++) {
      out[i] = opcodes[+ops[i].op];
    }
    return out;
  }

  function createThunk(code){
    var opcodes = [
      ARRAY, ARRAY_DONE, BINARY, BLOCK, BLOCK_EXIT, CALL, CASE, CLASS_DECL,
      CLASS_EXPR, CONST, CONSTRUCT, DEBUGGER, DEFAULT, DUP, ELEMENT,
      FUNCTION, GET, IFEQ, IFNE, INDEX, JSR, JUMP, LET, LITERAL,
      MEMBER, METHOD, OBJECT, POP, POP_EVAL, POPN, PROPERTY, PUT,
      REGEXP, RESOLVE, RETURN, RETURN_EVAL, ROTATE, SUPER_CALL, SUPER_ELEMENT,
      SUPER_GUARD, SUPER_MEMBER, THIS, THROW, UNARY, UNDEFINED, UPDATE, VAR, WITH
    ];

    var ops = code.ops,
        cmds = instructions(ops, opcodes);

    function LITERAL(op){
      stack[sp++] = op.value;
      return cmds[ip++];
    }
    function REGEXP(op){
      stack[sp++] = new $RegExp(op.value);
      return cmds[ip++];
    }
    function RESOLVE(op){
      stack[sp++] = IdentifierResolution(op.name);
      return cmds[ip++];
    }
    function THIS(op){
      A = ThisResolution();
      if (A && A.IsCompletion) {
        if (A.IsAbruptCompletion) {
          error = A.value;
          return ƒ;
        } else {
          A = A.value;
        }
      }
      stack[sp++] = A;
      return cmds[ip++];
    }
    function UNDEFINED(op){
      stack[sp++] = undefined;
      return cmds[ip++];
    }
    function GET(op){
      A = GetValue(stack[--sp]);
      if (A && A.IsCompletion) {
        if (A.IsAbruptCompletion) {
          error = A.value;
          return ƒ;
        } else {
          A = A.value;
        }
      }
      stack[sp++] = A;
      return cmds[ip++];
    }
    function PUT(op){
      A = stack[--sp];
      B = stack[--sp];
      C = PutValue(A, B);
      if (C && C.IsAbruptCompletion) {
        error = C.value;
        return ƒ;
      }
      stack[sp++] = A;
      return cmds[ip++];
    }
    function DUP(op){
      A = stack[sp++];
      stack[sp] = A;
      return cmds[ip++];
    }
    function POP(op){
      sp--;
      return cmds[ip++];
    }
    function POPN(op){
      sp -= op.number;
      return cmds[ip++];
    }
    function BLOCK_EXIT(op){
      context.LexicalEnvironment = context.LexicalEnvironment.outer;
      return cmds[ip++];
    }
    function FUNCTION(op){
      A = NewDeclarativeEnvironment(context.LexicalEnvironment),
      B = op.code;
      A.CreateImmutableBinding(B.name);
      C = new $Function(B.type, B.name, B.params, B.body, A, B.Strict);
      C.MakeConstructor();
      stack[sp++] = C;
      return cmds[ip++];
    }
    function CLASS_DECL(op){
      A = op.superClass ? stack[--sp] : undefined;
      B = ClassDefinitionEvaluation(op, A);
      if (B && B.IsCompletion) {
        if (B.IsAbruptCompletion) {
          error = B.value;
          return ƒ;
        } else {
          B = B.value;
        }
      }

      C = BindingInitialisation(op.name, B, context.LexicalEnvironment);
      if (C && C.IsAbruptCompletion) {
        error = C.value;
        return ƒ;
      }
      return cmds[ip++];
    }
    function CLASS_EXPR(op){
      A = op.superClass ? stack[--sp] : undefined;
      B = ClassDefinitionEvaluation(op, A);
      if (B && B.IsCompletion) {
        if (B.IsAbruptCompletion) {
          error = B.value;
          return ƒ;
        } else {
          B = B.value;
        }
      }
      stack[sp++] = B;
      return cmds[ip++];
    }
    function ARRAY(op){
      stack[sp++] = new $Array(0);
      stack[sp++] = 0;
      return cmds[ip++];
    }
    function INDEX(op){
      if (op.empty) {
        stack[sp]++;
      } else {
        A = stack[--sp];
        B = stack[--sp];
        C = GetValue(A);
        if (C && C.IsCompletion) {
          if (C.IsAbruptCompletion) {
            error = C.value;
            return ƒ;
          } else {
            C = C.value;
          }
        }
        stack[sp - 1].DefineOwnProperty(B,  {
          Value: C,
          Writable: true,
          Enumerable: true,
          Configurable: true
        })
        stack[sp++] = B;
      }
      return cmds[ip++];
    }
    function ARRAY_DONE(op){
      A = stack[--sp];
      stack[sp].Put('length', A);
      return cmds[ip++];
    }
    function BLOCK(op){
      var env = NewDeclarativeEnvironment(context.LexicalEnvironment);
      context.LexicalEnvironment = emv;
      BlockDeclarationInstantiation(op, context.LexicalEnvironment);
      return cmds[ip++];
    }
    function WITH(op){
      A = ToObject(GetValue(stack[--sp]));
      if (A && A.IsCompletion) {
        if (A.IsAbruptCompletion) {
          error = A.value;
          return ƒ;
        } else {
          A = A.value;
        }
      }
      B = context.LexicalEnvironment;
      C = context.LexicalEnvironment = NewObjectEnvironment(A, B);
      C.withEnvironment = true;
      C.outer = B;
      return cmds[ip++];
    }
    function UPDATE(op){
      if (op.prefix) {
        if (op.increment) {
          A = PrefixIncrement(stack[--sp]);
        } else {
          A = PrefixDecrement(stack[--sp]);
        }
      } else {
        if (op.increment) {
          A = PostfixIncrement(stack[--sp]);
        } else {
          A = PostfixDecrement(stack[--sp]);
        }
      }
      if (A && A.IsCompletion) {
        if (A.IsAbruptCompletion) {
          error = A.value;
          return ƒ;
        } else {
          A = A.value;
        }
      }
      stack[sp++] = A;
      return cmds[ip++];
    }
    function UNARY(op){
      A = stack[--sp];
      B = UnaryOperation(op.operator, A);
      if (A && A.IsCompletion) {
        if (A.IsAbruptCompletion) {
          error = A.value;
          return ƒ;
        } else {
          A = A.value;
        }
      }
      stack[sp++] = A;
      return cmds[ip++];
    }
    function BINARY(op){
      A = stack[--sp];
      B = stack[--sp];
      res = BinaryOperation(op.operator, A, B);
      if (A && A.IsCompletion) {
        if (A.IsAbruptCompletion) {
          error = A.value;
          return ƒ;
        } else {
          A = A.value;
        }
      }
      stack[sp++] = A;
      return cmds[ip++];
    }
    function CASE(op){
      A = stack[--sp];
      B = stack[sp - 1];
      C = StrictEqualityComparison(A, B);
      if (C && C.IsCompletion) {
        if (C.IsAbruptCompletion) {
          error = C.value;
          return ƒ;
        } else {
          C = C.value;
        }
      }
      if (C) {
        sp--;
        ip = op.position;
      }
      return cmds[ip++];
    }
    function DEFAULT(op){
      sp--;
      ip = op.position;
      return cmds[ip++];
    }
    function THROW(op){
      error = stack[--sp];
      return ƒ;
    }
    function JUMP(op){
      ip = op.position;
      return cmds[ip++];
    }
    function IFEQ(op){
      if (op.test === !!stack[--sp]) {
        ip = instr.position;
      }
      return cmds[ip++];
    }
    function IFNE(op){
      if (op.test === !!stack[sp - 1]) {
        ip = instr.position;
      } else {
        sp--;
      }
      return cmds[ip++];
    }
    function POP_EVAL(op){
      completion = stack[--sp];
      return cmds[ip++];
    }
    function RETURN_EVAL(op){
      return Ω;
    }
    function RETURN(op){
      completion = stack[--sp];
      return Ω;
    }
    function JSR(op){

      return cmds[ip++];
    }
    function ROTATE(op){
      A = [];
      B = stack[--sp];
      for (C = 0; C < op.number; C++) {
        A[C] = stack[--sp];
      }
      A[C++] = B;
      while (C--) {
        stack[sp++] = A[C];
      }
      return cmds[ip++];
    }
    function DEBUGGER(op){
      completion = {
        op: op,
        sp: sp,
        ip: ip
      };
      return false;
    }
    function CALL(op){
      sp -= op.args;
      A = stack.slice(sp, sp + op.args);
      B = stack[--sp];
      C = stack[--sp];
      D = EvaluateCall(C, B, A);
      if (D && D.IsCompletion) {
        if (D.IsAbruptCompletion) {
          error = D.value;
          return ƒ;
        } else {
          D = D.value;
        }
      }
      stack[sp++] = D;
      return cmds[ip++];
    }
    function CONSTRUCT(op){
      sp -= op.args;
      A = stack.slice(sp, sp + op.args);
      B = stack[--sp];
      C = EvaluateConstruct(B, A);
      if (C && C.IsCompletion) {
        if (C.IsAbruptCompletion) {
          error = C.value;
          return ƒ;
        } else {
          C = C.value;
        }
      }
      stack[sp++] = C;
      return cmds[ip++];
    }
    function SUPER_CALL(op){
      A = CallSuperSetup();
      if (A && A.IsCompletion) {
        if (A.IsAbruptCompletion) {
          error = A.value;
          return ƒ;
        } else {
          A = A.value;
        }
      }
      stack[sp++] = A;
      return cmds[ip++];
    }
    function SUPER_ELEMENT(op){
      A = ElementSuper(stack[--sp]);
      if (A && A.IsCompletion) {
        if (A.IsAbruptCompletion) {
          error = A.value;
          return ƒ;
        } else {
          A = A.value;
        }
      }
      stack[sp++] = A;
      return cmds[ip++];
    }
    function SUPER_MEMBER(op){
      A = ElementSuper(op.name);
      if (A && A.IsCompletion) {
        if (A.IsAbruptCompletion) {
          error = A.value;
          return ƒ;
        } else {
          A = A.value;
        }
      }
      stack[sp++] = A;
      return cmds[ip++];
    }
    function SUPER_GUARD(op){
      A = SuperGuard();
      if (A && A.IsAbruptCompletion) {
        error = A.value;
        return ƒ;
      }
      return cmds[ip++];
    }
    function OBJECT(op){
      stack[sp++] = new $Object;
      return cmds[ip++];
    }
    function MEMBER(op){
      A = stack[--sp];
      B = DefineProperty(stack[sp - 1], op.name, A);
      if (A && A.IsAbruptCompletion) {
        error = A.value;
        return ƒ;
      }
      return cmds[ip++];
    }
    function ELEMENT(op){
      A = Element(stack[--sp], stack[--sp]);
      if (A && A.IsCompletion) {
        if (A.IsAbruptCompletion) {
          error = A.value;
          return ƒ;
        } else {
          A = A.value;
        }
      }
      stack[sp++] = A;
      return cmds[ip++];
    }
    function PROPERTY(op){
      A = Element(op.name, stack[--sp]);
      if (A && A.IsCompletion) {
        if (A.IsAbruptCompletion) {
          error = A.value;
          return ƒ;
        } else {
          A = A.value;
        }
      }
      stack[sp++] = A;
      return cmds[ip++];
    }
    function METHOD(op){

      return cmds[ip++];
    }
    function VAR(op){
      BindingInitialisation(op.pattern, stack[--sp]);
      return cmds[ip++];
    }
    function LET(op){
      BindingInitialisation(op.pattern, stack[--sp], context.LexicalEnvironment);
      return cmds[ip++];
    }
    function CONST(op){
      BindingInitialisation(op.pattern, stack[--sp], context.LexicalEnvironment);
      return cmds[ip++];
    }

    function ƒ(){
      for (var i = 0, handler; handler = code.handlers[i]; i++) {
        if (handler.begin < ip && ip <= handler.end) {
          if (handler.type === ENV) {
            context.LexicalEnvironment = context.LexicalEnvironment.outer;
          } else {
            sp = handler.unwindStack(this);
            if (handler.type === FINALLY) {
              stack[sp++] = Empty;
              stack[sp++] = error;
              stack[sp++] = FINALLY;
            } else {
              stack[sp++] = error;
            }
            ip = handler.end;
            return cmds[ip++];
          }
        }
      }
      completion = error;
      return Ω;
    }

    function Ω(){
      return false;
    }

    var completion, stack, ip, sp, error, A, B, C, D;

    function execute(){
      stack = [];
      ip = 0;
      sp = 0;
      completion = error = A = B = C = D = undefined;

      var F = cmds[0];

      while (F) F = F(ops[ip]);
      return completion;
    }

    return execute;
  }


  function Script(ast, code, name){
    if (ast instanceof Script)
      return ast;

    if (typeof ast === FUNCTION) {
      this.type = 'recompiled function';
      if (!ast.name) {
        name || (name = 'unnamed');
        code = '('+ast+')()';
      } else {
        name || (name = ast.name);
        code = ast+'';
      }
      ast = null
    } else if (typeof ast === STRING) {
      code = ast;
      ast = null;
    }

    if (!isObject(ast) && typeof code === STRING) {
      ast = parse(code);
    }

    if (!code && isObject(ast)) {
      code = decompile(ast);
    }

    this.code = compile(code);
    this.thunk = createThunk(this.code);
    define(this, {
      source: code,
      ast: ast
    });
    this.name = name || '';
  }

  function ScriptFile(location){
    var code = ScriptFile.load(location);
    Script.call(this, null, code, location);
  }

  ScriptFile.load = function load(location){
    return require('fs').readFileSync(location, 'utf8');
  };

  inherit(ScriptFile, Script);


  // ###################
  // ### Interpreter ###
  // ###################

  function Continuum(listener){
    var self = this;
    Emitter.call(this);
    listener && this.on('*', listener);

    define(this, {
      scripts: [],
      realm: new Realm
    });
  }

  inherit(Continuum, Emitter, [
    function pause(){
      this.realm.pause();
      return this;
    },
    function resume(){
      this.realm.resume();
      return this;
    },
    function run(subject){
      var script = this.executing = new Script(subject);
      this.scripts.push(script);
      interpreter = this;
      ExecutionContext.push(new ExecutionContext(null, this.realm.globalEnv, this.realm));
      var result = script.thunk();
      ExecutionContext.pop();
      return result;
    }
  ]);


  function inspect(o){
    console.log(require('util').inspect(o, null, 10));
  }

  exports.Continuum = Continuum;

  var x = new Continuum;

  inspect(x.run('var z = 20'))
  inspect(x.realm);

  return exports;
})((0,eval)('this'), typeof exports === 'undefined' ? {} : exports);
