var runtime = (function(GLOBAL, exports, undefined){
  "use strict";
  var esprima          = require('../third_party/esprima'),
      objects          = require('./lib/objects'),
      functions        = require('./lib/functions'),
      iteration        = require('./lib/iteration'),
      utility          = require('./lib/utility'),
      errors           = require('./errors'),
      assemble         = require('./assembler').assemble,
      constants        = require('./constants'),
      collections      = require('./object-model/collections'),
      operators        = require('./object-model/operators'),
      environments     = require('./object-model/environments'),
      operations       = require('./object-model/operations'),
      descriptors      = require('./object-model/descriptors'),
      $Symbol          = require('./object-model/$Symbol').$Symbol,
      $WellKnownSymbol = require('./object-model/$Symbol').$WellKnownSymbol,
      $Object          = require('./object-model/$Object').$Object,
      $StrictArguments = require('./object-model/$Arguments').$StrictArguments,
      $MappedArguments = require('./object-model/$Arguments').$MappedArguments,
      $Array           = require('./object-model/$Array').$Array,
      $Proxy           = require('./object-model/$Proxy'),
      $TypedArray      = require('./object-model/$TypedArray'),
      natives          = require('./natives'),
      Emitter          = require('./lib/Emitter'),
      PropertyList     = require('./lib/PropertyList'),
      thunk            = require('./thunk'),
      Stack            = require('./lib/Stack');


  var Hash           = objects.Hash,
      create         = objects.create,
      hasOwn         = objects.hasOwn,
      isObject       = objects.isObject,
      assign         = objects.assign,
      define         = objects.define,
      inherit        = objects.inherit,
      hide           = objects.hide,
      ownKeys        = objects.keys,
      properties     = objects.properties,
      getPrototypeOf = objects.getPrototypeOf,
      fname          = functions.fname,
      applyNew       = functions.applyNew,
      iterate        = iteration.iterate,
      each           = iteration.each,
      map            = iteration.map,
      uid            = utility.uid,
      nextTick       = utility.nextTick,
      tag            = utility.tag,
      MapData        = collections.MapData,
      WeakMapData    = collections.WeakMapData;

  var $$ThrowException = errors.$$ThrowException,
      $$MakeException  = errors.$$MakeException,
      Completion       = errors.Completion,
      AbruptCompletion = errors.AbruptCompletion;

  var $$GetValue     = operators.$$GetValue,
      $$ToObject     = operators.$$ToObject,
      $$Type         = operators.$$Type,
      $$GetThisValue = operators.$$GetThisValue;

  var Reference                 = operations.Reference,
      $$IsCallable              = operations.$$IsCallable,
      $$Invoke                  = operations.$$Invoke,
      $$EnqueueChangeRecord     = operations.$$EnqueueChangeRecord,
      $$DeliverAllChangeRecords = operations.$$DeliverAllChangeRecords,
      $$CreateListFromArray     = operations.$$CreateListFromArray,
      $$IsStopIteration         = operations.$$IsStopIteration,
      $$IsStopIteration         = operations.$$IsStopIteration,
      $$IsPropertyReference     = operations.$$IsPropertyReference,
      $$OrdinaryCreateFromConstructor = operations.$$OrdinaryCreateFromConstructor;

  var Value                    = descriptors.Value,
      Accessor                 = descriptors.Accessor,
      DataDescriptor           = descriptors.DataDescriptor,
      $$IsAccessorDescriptor   = descriptors.$$IsAccessorDescriptor,
      $$FromPropertyDescriptor = descriptors.$$FromPropertyDescriptor,
      $$ToPropertyDescriptor   = descriptors.$$ToPropertyDescriptor;

  var DeclarativeEnv = environments.DeclarativeEnvironmentRecord,
      ObjectEnv      = environments.ObjectEnvironmentRecord,
      FunctionEnv    = environments.FunctionEnvironmentRecord,
      GlobalEnv      = environments.GlobalEnvironmentRecord;

  var SYMBOLS = constants.SYMBOLS,
      Break   = SYMBOLS.Break,
      Pause   = SYMBOLS.Pause,
      Throw   = SYMBOLS.Throw,
      Return  = SYMBOLS.Return,
      Normal  = SYMBOLS.Normal;

  var symbols            = require('./object-model/$Symbol').wellKnownSymbols,
      toStringTagSymbol  = symbols.toStringTag,
      iteratorSymbol     = symbols.iterator,
      hasInstanceSymbol  = symbols.hasInstance,
      createSymbol       = symbols.create,
      BooleanValueSymbol = symbols.BooleanValue,
      NumberValueSymbol  = symbols.NumberValue,
      DateValueSymbol    = symbols.DateValue,
      ToPrimitiveSymbol  = symbols.ToPrimitive;

  AbruptCompletion.prototype.Abrupt = SYMBOLS.Abrupt;
  Completion.prototype.Completion   = SYMBOLS.Completion;


  var E = 0x1,
      C = 0x2,
      W = 0x4,
      A = 0x8,
      ___ = 0,
      E__ = 1,
      _C_ = 2,
      EC_ = 3,
      __W = 4,
      E_W = 5,
      _CW = 6,
      ECW = 7,
      __A = 8,
      E_A = 9,
      _CA = 10,
      ECA = 11;


  errors.createError = function(name, type, message){
    return new $Error(name, type, message);
  };


  function noop(){}


  // ###############################
  // ### Specification Functions ###
  // ###############################

  function $$MakeConstructor(func, writable, prototype){
    var install = prototype === undefined;
    if (install) {
      prototype = new $Object;
    }
    prototype.IsProto = true;
    if (writable === undefined) {
      writable = true;
    }
    if (install) {
      prototype.define('constructor', func, writable ? _CW : ___);
    }
    func.define('prototype', prototype, writable ? __W : ___);
  }

  var $$PropertyDefinitionEvaluation = (function(){
    function makeDefiner(constructs, field, desc){
      return function(obj, key, code) {

        var sup = code.flags.usesSuper,
            lex = context.LexicalEnvironment,
            home = sup ? obj : undefined,
            $F = code.flags.generator ? $GeneratorFunction : $Function,
            func = new $F('method', key, code.params, code, lex, code.flags.strict, undefined, home, sup);

        constructs && $$MakeConstructor(func);
        desc[field] = func;
        var result = obj.DefineOwnProperty(key, desc, false);
        desc[field] = undefined;

        return result && result.Abrupt ? result : func;
      };
    }

    var DefineMethod = makeDefiner(false, 'Value', {
      Value: undefined,
      Writable: true,
      Enumerable: true,
      Configurable: true
    });

    var DefineGetter = makeDefiner(true, 'Get', {
      Get: undefined,
      Enumerable: true,
      Configurable: true
    });

    var DefineSetter = makeDefiner(true, 'Set', {
      Set: undefined,
      Enumerable: true,
      Configurable: true
    });

    return function $$PropertyDefinitionEvaluation(kind, obj, key, code){
      if (key && key.Abrupt) return key;

      if (kind === 'get') {
        return DefineGetter(obj, key, code);
      } else if (kind === 'set') {
        return DefineSetter(obj, key, code);
      } else if (kind === 'method') {
        return DefineMethod(obj, key, code);
      }
    };
  })();


  var mutable = { Value: undefined,
                  Writable: true,
                  Enumerable: true,
                  Configurable: true };

  var immutable = { Value: undefined,
                    Writable: true,
                    Enumerable: true,
                    Configurable: false };

  function $$TopLevelDeclarationInstantiation(code){
    var env = context.VariableEnvironment,
        configurable = code.scopeType === 'eval',
        decls = code.LexicalDeclarations;

    var desc = configurable ? mutable : immutable;

    for (var i=0, decl; decl = decls[i]; i++) {
      if (decl.type === 'FunctionDeclaration') {
        var name = decl.id.name;
        if (env.HasBinding(name)) {
          env.CreateMutableBinding(name, configurable);
        } else if (env === realm.globalEnv) {
          var existing = global.GetOwnProperty(name);
          if (!existing) {
            global.DefineOwnProperty(name, desc, true);
          } else if ($$IsAccessorDescriptor(existing) || !existing.Writable && !existing.Enumerable) {
            return $$ThrowException('global invalid define');
          }
        }

        env.SetMutableBinding(name, $$InstantiateFunctionDeclaration(decl, context.LexicalEnvironment), code.flags.strict);
      }
    }

    for (var i=0; i < code.VarDeclaredNames.length; i++) {
      var name = code.VarDeclaredNames[i];
      if (!env.HasBinding(name)) {
        env.CreateMutableBinding(name, configurable);
        env.SetMutableBinding(name, undefined, code.flags.strict);
      } else if (env === realm.globalEnv) {
        var existing = global.GetOwnProperty(name);
        if (!existing) {
          global.DefineOwnProperty(name, desc, true);
        }
      }
    }
  }


  function getKey(v){
    if (!v || typeof v === 'string') {
      return v;
    }
    if (v[0] !== '@') {
      return v[1];
    }

    return context.getSymbol(v[1]);
  }
  // ## $$ClassDefinitionEvaluation

  function $$ClassDefinitionEvaluation(name, superclass, constructorCode, methods, symbols){
    if (superclass === undefined) {
      var superproto = intrinsics.ObjectProto,
          superctor = intrinsics.FunctionProto;
    } else {
      if (superclass && superclass.Abrupt) return superclass;

      if (superclass === null) {
        superproto = null;
        superctor = intrinsics.FunctionProto;
      } else if (typeof superclass !== 'object') {
        return $$ThrowException('non_object_superclass');
      } else if (!('Construct' in superclass)) {
        superproto = superclass;
        superctor = intrinsics.FunctionProto;
      } else {
        superproto = superclass.Get('prototype');
        if (superproto && superproto.Abrupt) return superproto;

        if (typeof superproto !== 'object') {
          return $$ThrowException('non_object_superproto');
        }
        superctor = superclass;
      }
    }

    var proto = new $Object(superproto),
        brand = name || '';

    for (var i=0; i < symbols[0].length; i++) {
      var symbol   = symbols[0][i],
          isPublic = symbols[1][i],
          result   = context.initializeSymbolBinding(symbol, context.createSymbol(symbol, isPublic));

      if (result && result.Abrupt) return result;
    }


    if (name) {
      context.LexicalEnvironment.CreateImmutableBinding(name);
    }

    var ctor = $$PropertyDefinitionEvaluation('method', proto, 'constructor', constructorCode);
    if (ctor && ctor.Abrupt) return ctor;

    if (name) {
      context.initializeBinding(name, ctor);
      proto.define(toStringTagSymbol, brand);
    }

    $$MakeConstructor(ctor, false, proto);
    ctor.IsClass = true;
    ctor.IsConstructor = true;
    ctor.SetInheritance(superctor);
    ctor.set('name', brand);
    ctor.define('prototype', proto, ___);
    proto.define('constructor', ctor, _CW);
    proto.IsClassProto = true;

    each(methods, function(method){
      $$PropertyDefinitionEvaluation(method.kind, proto, getKey(method.name), method.code);
    });

    return ctor;
  }

  // ## $$InstantiateFunctionDeclaration

  function $$InstantiateFunctionDeclaration(decl, env){
    var code = decl.code,
        $F = code.flags.generator ? $GeneratorFunction : $Function,
        func = new $F('normal', decl.id.name, code.params, code, env, code.flags.strict);

    $$MakeConstructor(func);
    return func;
  }




  function createBoolean(value){
    return runtime.intrinsics['%Boolean%'].Construct([value]);
  }

  function createNumber(value){
    return runtime.intrinsics['%Number%'].Construct([value]);
  }

  function createString(value){
    return runtime.intrinsics['%String%'].Construct([value]);
  }

  function fromInternal(object){
    if (typeof object === 'function') {
      return new $InternalFunction(object);
    } else if (object === null || typeof object !== 'object') {
      return object;
    } else if (object instanceof RegExp) {
      return new $RegExp(object);
    } else if (object instanceof Number) {
      return createNumber(object);
    } else if (object instanceof String) {
      return createString(object);
    } else if (object instanceof Boolean) {
      return createBoolean(object);
    } else if (object instanceof Array) {
      var out = new $Array;
      each(object, function(item, index){
        out.set(index, fromInternal(item));
      });
      return out;
    }

    var out = new $Object;
    each(object, function(val, key){
      out.set(key, fromInternal(val));
    });
    return out;
  }

  function CollectionInitializer(Data, name){
    var data = name + 'Data';
    return function(_, args){
      var object = args[0],
          iterable = args[1];

      object[data] = new Data;

      if (iterable === undefined) {
        return object;
      }

      iterable = $$ToObject(iterable);
      if (iterable && iterable.Abrupt) return iterable;

      var iter = $$Invoke(iterable, iteratorSymbol);
      if (iter && iter.Abrupt) return iter;

      var adder = object.Get('set');
      if (adder && adder.Abrupt) return adder;

      if (!$$IsCallable(adder)) {
        return $$ThrowException('called_on_incompatible_object', [name + '.prototype.set']);
      }

      var next;
      while (next = $$ToObject($$Invoke(iter, 'next'))) {
        if ($$IsStopIteration(next)) {
          return object;
        }

        if (next && next.Abrupt) return next;

        var key = next.Get(0);
        if (key && key.Abrupt) return key;

        var value = next.Get(1);
        if (value && value.Abrupt) return value;

        var status = adder.Call(object, [key, value]);
        if (status && status.Abrupt) return status;
      }
      return object;
    };
  }



  var DefineOwn = $Object.prototype.DefineOwnProperty;

  // #################
  // ### $Function ###
  // #################

  var $Function = (function(){
    function $Function(kind, name, params, code, scope, strict, proto, holder, method){
      if (proto === undefined) {
        proto = intrinsics.FunctionProto;
      }

      $Object.call(this, proto);
      this.FormalParameters = params;
      this.ThisMode = kind === 'arrow' ? 'lexical' : strict ? 'strict' : 'global';
      this.Strict = !!strict;
      this.Realm = realm;
      this.Scope = scope;
      this.code = code;
      tag(code);
      if (holder !== undefined) {
        this.HomeObject = holder;
      }
      if (method) {
        this.MethodName = getKey(name);
      }

      if (strict) {
        this.define('arguments', intrinsics.ThrowTypeError, __A);
        this.define('caller', intrinsics.ThrowTypeError, __A);
      } else {
        this.define('arguments', null, ___);
        this.define('caller', null, ___);
      }

      this.define('length', params ? params.ExpectedArgumentCount : 0, ___);
      this.define('name', getKey(code.name), code.name && !code.flags.writableName ? ___ : __W);
    }

    inherit($Function, $Object, {
      BuiltinBrand: 'BuiltinFunction',
      FormalParameters: null,
      code: null,
      Scope: null,
      strict: false,
      ThisMode: 'global',
      Realm: null,
      type: '$Function'
    }, [
      function prepare(receiver, args, ctx, isConstruct){
        if (realm !== this.Realm) {
          activate(this.Realm);
        }

        if (this.ThisMode === 'lexical') {
          var local = new DeclarativeEnv(this.Scope);
        } else {
          if (this.ThisMode !== 'strict') {
            if (receiver == null) {
              receiver = this.Realm.global;
            } else if (typeof receiver !== 'object') {
              receiver = $$ToObject(receiver);
              if (receiver.Abrupt) return receiver;
            }
          }
          var local = new FunctionEnv(receiver, this);
        }

        var caller = context ? context.callee : null;

        if (ctx) {
          ExecutionContext.call(ctx, ctx.caller, local, realm, this.code, this, args, isConstruct);
        } else {
          ctx = new ExecutionContext(context, local, realm, this.code, this, args, isConstruct);
        }

        if (this.define && !this.Strict) {
          this.define('arguments', local.arguments, ___);
          this.define('caller', caller, ___);
          local.arguments = null;
        }

        return ctx;
      },
      function cleanup(){
        if (this.define && !this.Strict) {
          this.define('arguments', null, ___);
          this.define('caller', null, ___);
        }
      },
      function Call(receiver, args, isConstruct){
        var ctx = this.prepare(receiver, args, null, isConstruct);
        ExecutionContext.push(ctx);
        var result = context.run();
        ctx === context && ExecutionContext.pop();
        this.cleanup();
        return result && result.type === Return ? result.value : result;
      },
      function Construct(args){
        return $$OrdinaryConstruct(this, args);
      },
      function HasInstance(arg){
        if (typeof arg !== 'object' || arg === null) {
          return false;
        }

        var prototype = this.Get('prototype');
        if (prototype.Abrupt) return prototype;

        if (typeof prototype !== 'object') {
          return $$ThrowException('instanceof_nonobject_proto');
        }

        while (arg) {
          arg = arg.GetInheritance();
          if (prototype === arg) {
            return true;
          }
        }
        return false;
      }
    ]);

    function $$OrdinaryConstruct(F, argumentsList, fallBackProto){
      var creator = F.Get(createSymbol);
      if (creator && creator.Abrupt) return creator;

      var obj = creator ? creator.Call(F, argumentsList) : $$OrdinaryCreateFromConstructor(F, '%ObjectPrototype%');
      if (obj && obj.Abrupt) return obj;

      var result = F.Call(obj, argumentsList, true);
      if (result && result.Abrupt) return result;

      return $$Type(result) === 'Object' ? result : obj;
    }

    return $Function;
  })();


  var $BoundFunction = (function(){
    function $BoundFunction(target, boundThis, boundArgs){
      $Object.call(this, intrinsics.FunctionProto);
      this.BoundTargetFunction = target;
      this.BoundThis = boundThis;
      this.BoundArgs = boundArgs;
      this.define('arguments', intrinsics.ThrowTypeError, __A);
      this.define('caller', intrinsics.ThrowTypeError, __A);
      this.define('length', target.get('length'), ___);
    }

    inherit($BoundFunction, $Function, {
      TargetFunction: null,
      BoundThis: null,
      BoundArgs: null,
      type: '$BoundFunction'
    }, [
      function Call(_, newArgs){
        return this.BoundTargetFunction.Call(this.BoundThis, this.BoundArgs.concat(newArgs));
      },
      function Construct(newArgs){
        var target = this.BoundTargetFunction;
        if (!target.Construct) {
          return $$ThrowException('not_constructor', target.name);
        }
        target.constructCount = (target.constructCount || 0) + 1;
        return target.Construct(this.BoundArgs.concat(newArgs));
      },
      function HasInstance(arg){
        var target = this.BoundTargetFunction;
        if (!target.HasInstance) {
          return $$ThrowException('instanceof_function_expected', target.name);
        }
        return target.HasInstance(arg);
      }
    ]);

    return $BoundFunction;
  })();

  var $GeneratorFunction = (function(){
    function $GeneratorFunction(){
      $Function.apply(this, arguments);
    }

    inherit($GeneratorFunction, $Function, {
      generator: true
    }, [
      function Call(receiver, args, isConstruct){
        if (realm !== this.Realm) {
          activate(this.Realm);
        }
        if (this.ThisMode === 'lexical') {
          var local = new DeclarativeEnv(this.Scope);
        } else {
          if (this.ThisMode !== 'strict') {
            if (receiver == null) {
              receiver = this.Realm.global;
            } else if (typeof receiver !== 'object') {
              receiver = $$ToObject(receiver);
              if (receiver.Abrupt) return receiver;
            }
          }
          var local = new FunctionEnv(receiver, this);
        }

        var ctx = new ExecutionContext(context, local, this.Realm, this.code, this, args, isConstruct);
        return new $Generator(this.Realm, local, ctx);
      }
    ]);

    return $GeneratorFunction;
  })();

  var $Generator = (function(){
    function setFunction(obj, name, func){
      obj.set(name, new $InternalFunction({
        name: name,
        length: func.length,
        call: func
      }));
    }


    function $$Resume(ctx, completionType, value){
      ExecutionContext.push(ctx);
      if (completionType !== 'normal') {
        value = new AbruptCompletion(completionType, value);
      }
      return ctx.send(value);
    }


    function $Generator(realm, scope, ctx){
      $Object.call(this);
      this.Realm = realm;
      this.Scope = scope;
      this.code = ctx.code;
      this.ExecutionContext = ctx;
      this.State = 'newborn';

      var self = this;
      ExecutionContext.push(ctx);
      setFunction(this, iteratorSymbol, function(_, args){ return self });
      setFunction(this, 'next',         function(_, args){ return self.Send() });
      setFunction(this, 'close',        function(_, args){ return self.Close() });
      setFunction(this, 'send',         function(_, args){ return self.Send(args[0]) });
      setFunction(this, 'throw',        function(_, args){ return self.Throw(args[0]) });
      ctx.pop();
    }

    inherit($Generator, $Object, {
      Code: null,
      ExecutionContext: null,
      Scope: null,
      Handler: null,
      State: null
    }, [
      function Send(value){
        if (this.State === 'executing') {
          return $$ThrowException('generator_executing', 'send');
        } else if (this.State === 'closed') {
          return $$ThrowException('generator_closed', 'send');
        } else if (this.State === 'newborn') {
          if (value !== undefined) {
            return $$ThrowException('generator_send_newborn');
          }
          this.ExecutionContext.currentGenerator = this;
          this.State = 'executing';
          ExecutionContext.push(this.ExecutionContext);
          return this.ExecutionContext.run();
        }

        this.State = 'executing';
        return $$Resume(this.ExecutionContext, 'normal', value);
      },
      function Throw(value){
        if (this.State === 'executing') {
          return $$ThrowException('generator_executing', 'throw');
        } else if (this.State === 'closed') {
          return $$ThrowException('generator_closed', 'throw');
        } else if (this.State === 'newborn') {
          this.State = 'closed';
          this.code = null;
          return new AbruptCompletion('throw', value);
        }

        this.State = 'executing';
        return $$Resume(this.ExecutionContext, 'throw', value);
      },
      function Close(value){
        if (this.State === 'executing') {
          return $$ThrowException('generator_executing', 'close');
        } else if (this.State === 'closed') {
          return;
        } else if (state === 'newborn') {
          this.State = 'closed';
          this.code = null;
          return;
        }

        this.State = 'executing';
        var result = $$Resume(this.ExecutionContext, 'return', value);
        this.State = 'closed';

        return result;
      }
    ]);

    return $Generator;
  })();


  // ###############
  // ### $RegExp ###
  // ###############

  var $RegExp = (function(){
    function $RegExp(primitive){
      if (!this.properties) {
        $Object.call(this, intrinsics.RegExpProto);
      }
      this.PrimitiveValue = primitive;
    }

    var reflected = assign(new Hash, {
      global:     ['global', false, ___],
      ignoreCase: ['ignoreCase', false, ___],
      lastIndex:  ['lastIndex', 0, __W],
      multiline:  ['multiline', false, ___],
      source:     ['source', '', ___]
    });

    inherit($RegExp, $Object, {
      BuiltinBrand: 'BuiltinRegExp',
      Match: null
    }, [
      function describe(key){
        if (key in reflected) {
          var prop = reflected[key];
          prop[1] = this.PrimitiveValue[key];
          return prop;
        }
        return this.properties.describe(key);
      },
      function define(key, value, attr){
        if (key in reflected) {
          if (key === 'lastIndex') {
            this.PrimitiveValue.lastIndex = value;
          }
        } else {
          this.properties.define(key, value, attr);
        }
      },
      function get(key){
        if (key in reflected) {
          return this.PrimitiveValue[key];
        }
        return this.properties.get(key);
      },
      function set(key, value){
        if (key in reflected) {
          if (key === 'lastIndex') {
            this.PrimitiveValue.lastIndex = value;
          }
        } else {
          this.properties.set(key, value);
        }
      },
      function query(key){
        if (key in reflected) {
          return reflected[key][2];
        }
        return this.properties.query(key);
      },
      function update(key, attr){
        if (!(key in reflected)) {
          return this.properties.update(key, attr);
        }
      },
      function each(callback){
        for (var k in reflected) {
          var prop = reflected[k];
          prop[1] = this.PrimitiveValue[k];
          callback.call(this, prop);
        }
        this.properties.each(callback, this);
      }
    ]);

    return $RegExp;
  })();



  var $Module = (function(){
    var $Enumerator = require('./object-model/$Object').$Enumerator;

    function ModuleValue(value){
      this.Value = value;
    }

    define(ModuleValue, {
      Writable: false,
      Enumerable: true,
      Configurable: false,
      isDescriptor: true,
      isDataDescriptor: true
    });

    function $Module(object, key){
      if (object instanceof $Module) {
        return object;
      }

      this.init(object, key);
      iteration.each(this.keys, this.add, this);
      tag(this);
    }


    define($Module.prototype, {
      type: '$Module',
      BuiltinBrand: 'BuiltinModule'
    });

    define($Module.prototype, [
      function init(object, keys){
        this.props = new Hash;
        this.object = object;
        this.keys = keys;
      },
      function add(key){
        this.props[key] = new Reference(this.object, key);
      },
      function get(key){
        var ref = this.props[key];
        if (ref) {
          return $$GetValue(ref);
        }
      },
      (function(){ return function define(){} })(),
      function set(key){},
      function update(){},
      function has(key){
        return key in this.props;
      },
      function each(callback){
        iteration.each(this.keys, function(key){
          callback.call(this, this.describe(key));
        }, this);
      },
      function describe(key){
        if (this.has(key)) {
          return [key, this.get(key), E__];
        }
      },
      function query(key){
        if (this.has(key)) {
          return E__;
        }
      },
      function enumerator(){
        return new $Enumerator(this.keys);
      },
      function GetInheritance(){
        return null;
      },
      function SetInheritance(v){
        return false;
      },
      function IsExtensible(){
        return false;
      },
      function PreventExtensions(){
        return true;
      },
      function HasProperty(key){
        return this.has(key);
      },
      function HasOwnProperty(key){
        return this.has(key);
      },
      function Get(key){
        return this.get(key);
      },
      function GetP(key, receiver){
        return this.get(key);
      },
      function Put(key, value){
        return false;
      },
      function SetP(key, value, receiver){
        return false;
      },
      function GetOwnProperty(key){
        if (this.has(key)) {
          return new ModuleValue(this.get(key));
        }
        return false;
      },
      function DefineOwnProperty(key, desc, strict){
        return strict ? $$ThrowException('strict_lhs_assignment') : false;
      },
      function Delete(key){
        return false;
      },
      function DefaultValue(){
        // TODO: remove DefaultValue
        return '[object Module]';
      },
      function Keys(){
        return this.keys;
      },
      function OwnPropertyKeys(){
        return this.keys;
      },
      function Enumerate(){
        return this.keys;
      }
    ]);

    return $Module;
  })();

  var $NativeModule = (function(){
    function $NativeModule(bindings){
      $Module.call(this, bindings);
      delete this.bindings;
    }

    inherit($NativeModule, $Module, [
      function init(bindings){
        this.bindings = bindings;
        this.props = new Hash;
        this.keys = map(bindings, function(value, key){
          return key;
        });
      },
      function add(key){
        if (typeof this.bindings[key] === 'function') {
          this.props[key] = new $InternalFunction({
            name: key,
            call: this.bindings[key],
            length: this.bindings[key].length
          });
        } else {
          this.props[key] = this.bindings[key];
        }
      },
      function get(key){
        return this.props[key];
      }
    ]);

    return $NativeModule;
  })();



  var $Error = (function(){
    function $Error(name, type, message){
      $Object.call(this, intrinsics[name+'Proto']);
      this.define('message', message, ECW);
      if (type !== undefined) {
        this.define('type', type, _CW);
      }
    }

    inherit($Error, $Object, {
      BuiltinBrand: 'BuiltinError'
    }, [
      function setOrigin(filename, origin){
        filename && this.set('filename', filename);
        origin && this.set('origin', origin);
      },
      function setCode(loc, code){
        var line = code.split('\n')[loc.start.line - 1];
        var pad = new Array(loc.start.column).join('-') + '^';
        this.set('line', loc.start.line);
        this.set('column', loc.start.column);
        this.set('code', line + '\n' + pad);
      }
    ]);

    return $Error;
  })();



  var $NativeFunction = (function(){
    function $NativeFunction(options){
      if (typeof options === 'function') {
        options = {
          call: options,
          name: fname(options),
          length: options.length,
          proto: intrinsics.FunctionProto
        };
      }
      if (options.proto === undefined) {
        options.proto = intrinsics.FunctionProto;
      }
      $Object.call(this, options.proto);

      this.define('arguments', null, ___);
      this.define('caller', null, ___);
      this.define('length', options.length, ___);
      this.define('name', options.name, ___);


      if (options.unwrapped) {
        this.Call = options.call;
        if (options.construct) {
          this.Construct = options.construct;
        }
      } else {
        this.call = options.call;
        if (options.construct) {
          this.construct = options.construct;
        }
      }

      this.Realm = realm;
      hide(this, 'Realm');
    }

    inherit($NativeFunction, $Function, {
      Builtin: true,
      type: '$NativeFunction'
    }, [
      function Call(receiver, args){
        var result = this.call.apply(receiver, [].concat(args));
        return result && result.type === Return ? result.value : result;
      },
      function Construct(args){
        if (this.construct) {
          var instance = this.has('prototype') ? new $Object(this.get('prototype')) : new $Object;
          instance.ConstructorName = this.get('name');
          var result = this.construct.apply(instance, args);
        } else {
          var result = this.call.apply(undefined, args);
        }
        return result && result.type === Return ? result.value : result;
      }
    ]);

    return $NativeFunction;
  })();

  var deopt = ['define', 'describe', 'get', 'set', 'query', 'update', 'has', 'remove', 'each'];


  var $InternalFunction = (function(){
    function $InternalFunction(options){
      if (intrinsics) {
        this.Prototype = intrinsics.FunctionProto;
      } else {
        this.Prototype = null;
      }
      this.Realm = realm;
      this.Call = typeof options === 'function' ? options : options.call;
      this.storage = new Hash;
      this.name = options.name || fname(this.Call);
      this.length = options.length || this.Call.length;
    }

    var reflected = assign(new Hash, {
      caller:      ['caller', null, ___],
      'arguments': ['arguments', null, ___],
      length:      ['length', 0, ___],
      name:        ['name', '', ___]
    });

    function deoptimize(target){
      each(deopt, function(key){
        target[key] = $Function.prototype[key];
      });

      target.properties = new PropertyList;
      target.define('arguments', null, ___);
      target.define('caller', null, ___);
      target.define('length', target.length, ___);
      target.define('name', target.name, ___);
    }

    inherit($InternalFunction, $Function, [
      function has(key){
        return key in reflected;
      },
      function get(key){
        if (key === 'name') {
          return this.name;
        } else if (key === 'length') {
          return this.length;
        } else if (key in reflected) {
          return reflected[key][1];
        }
      },
      function describe(key){
        if (key === 'name' || key === 'length') {
          reflected[key][1] = this[key];
        }
        return reflected[key];
      },
      function query(key){
        return key in reflected ? reflected[key][2] : undefined;
      },
      function each(callback){
        for (var key in reflected) {
          if (key === 'name' || key === 'length') {
            reflected[key][1] = this[key];
          }
          callback(reflected[key]);
        }
      },
      function remove(key, attr){
        deoptimize(this);
        return this.remove(key);
      },
      function update(key, attr){
        deoptimize(this);
        return this.update(key, attr);
      },
      function set(key, value){
        deoptimize(this);
        return this.set(key, value);
      },
      (function(){
        return function define(key, value, attr){
          deoptimize(this);
          return this.define(key, value, attr);
        };
      })()
    ]);

    return $InternalFunction;
  })();

  var $WrappedObject = (function(){
    var keys = [],
        values = [];

    function wrap(id, o, proto){
      if (isObject(o)) {
        if (hasOwn(o, id)) {
          return o[id];
        }
        var wrapper = new $WrappedObject(id, o, proto);
        try {
          define(o, id, wrapper);
        } catch (e) {
          var index = keys.indexOf(o);
          if (~index) return values[index];
          keys.push(o);
          values.push(wrapper);
        }
        return wrapper;
      }
      return o;
    }

    natives.add(function wrapperClass(Ctor){
      var symbols = Ctor.Scope.symbols,
          proto = Ctor.get('prototype');

      var get = new $InternalFunction({
        name: symbols.get,
        call: function(obj, args){
          var wrapped = obj.wrapped,
              prop = args[0],
              result = wrap(obj.wrapid, wrapped[prop], proto);

          if (result && result.wrapped && !result.initialized) {
            Ctor.Call(result, [obj, prop], true);
            result.initialized = true;
          }
          return result;
        }
      });

      var set = new $InternalFunction({
        name: symbols.set,
        call: function(obj, args){
          var wrapped = obj.wrapped,
              prop = args[0],
              value = args[1];

          if (value && value.wrapped) {
            value = value.wrapped;
          }

          wrapped[prop] = value;
        }
      });

      proto.define(symbols.get, get);
      proto.define(symbols.set, set);
      var init = wrap(uid(), GLOBAL, proto);
      Ctor.Call(init, [], true);
      init.initialized = true;
      return init;
    });

    function $WrappedObject(id, object, prototype){
      this.Prototype = typeof prototype === 'object' ? prototype : wrap(id, getPrototypeOf(object));
      this.Realm = realm;
      this.properties = new PropertyList;
      this.storage = new Hash;
      this.wrapped = object;
      this.wrapid = id;
      tag(this);
    }

    inherit($WrappedObject, $Object);
  })();



  function Interpreter(){

  }

  define(Interpreter.prototype, [
    function run(context){
      var f = context.cmds[context.ip];

      if (!context.Realm.quiet && !context.code.natives || context.Realm.debugBuiltins) {
        context.history || (context.history = []);

        while (f) {
          context.history[context.history.length] = context.ops[context.ip];
          context.Realm.emit('op', context.ops[context.ip], context.stack[context.sp - 1]);
          f = f(context);
        }
      } else {
        while (f) f = f(context);
      }

      return context.completion;
    },
    function send(value){
      context.stack[context.sp++] = value;
      return context.run();
    }
  ]);


  var ExecutionContext = (function(){
    var $$GetSymbol           = operations.$$GetSymbol,
        $$Element             = operations.$$Element,
        $$SuperReference      = operations.$$SuperReference,
        $$GetThisEnvironment  = operations.$$GetThisEnvironment,
        $$ThisResolution      = operations.$$ThisResolution,
        $$SpreadDestructuring = operations.$$SpreadDestructuring,
        $$GetTemplateCallSite = operations.$$GetTemplateCallSite;

    var strictUnfound = new Hash,
        unfound       = new Hash,
        globalDesc    = new DataDescriptor(undefined, ECW);


    function ExecutionContext(caller, local, realm, code, func, args, isConstruct){
      this.caller = caller;
      this.Realm = realm;
      this.code = code;
      this.LexicalEnvironment = local;
      this.VariableEnvironment = local;
      this.strict = code.flags.strict;
      this.args = args || [];
      this.isConstruct = !!isConstruct;
      this.callee = func && !func.Builtin ? func : caller ? caller.callee : null;
      this.stack = [];
      this.ip = 0;
      this.sp = 0;
      this.error = undefined;
      this.completion = undefined;
      this.stacktrace = undefined;
      this.ops = code.ops;
      this.cmds = code.cmds || (code.cmds = thunk.instructions(code.ops));
    }

    define(ExecutionContext, [
      function push(newContext){
        context = newContext;
        context.Realm.active || activate(context.Realm);
      },
      function pop(){
        if (context) {
          var oldContext = context;
          context = context.caller;
          return oldContext;
        }
      },
      function reset(){
        var stack = [];
        while (context) {
          stack.push(ExecutionContext.pop());
        }
        return stack;
      }
    ]);

    define(ExecutionContext.prototype, {
      isGlobal: false,
      strict  : false,
      isEval  : false,
      constructFunction: operations.$$EvaluateConstruct,
      callFunction     : operations.$$EvaluateCall,
      spreadArguments  : operations.$$SpreadArguments,
      spreadArray      : operations.$$SpreadInitialization,
      defineMethod     : $$PropertyDefinitionEvaluation
    });

    define(ExecutionContext.prototype, [
      function run(){
        var f = this.cmds[this.ip];

        if (!this.Realm.quiet && !this.code.natives || this.Realm.debugBuiltins) {
          this.history || (this.history = []);

          while (f) {
            this.history[this.history.length] = this.ops[this.ip];
            this.Realm.emit('op', this.ops[this.ip], this.stack[this.sp - 1]);
            f = f(this);
          }
        } else {
          while (f) f = f(this);
        }

        return this.completion;
      },
      function send(value){
        this.stack[this.sp++] = value;
        return this.run();
      },
      function pop(){
        if (this === context) {
          context = this.caller;
          return this;
        }
      },
      function hasArgument(name){
        if (this.callee) {
          var params = this.callee.FormalParameters;
          if (params) {
            var index = params.getIndex(name);
            return index !== -1 && index < this.args.length;
          }
        }
        return false;
      },
      function argumentCount(){
        return this.args.length;
      },
      function resolveReceiver(ref){
        if (ref && ref.Reference) {
          return $$IsPropertyReference(ref) ? $$GetThisValue(ref) : ref.base.WithBaseObject();
        }
      },
      function callerName(){
        var caller = this.caller && this.caller.callee;
        if (caller && caller.get) {
          return caller.get('name');
        }
        return '';
      },
      function createBinding(name, immutable){
        if (immutable) {
          return this.LexicalEnvironment.CreateImmutableBinding(name);
        }
        return this.LexicalEnvironment.CreateMutableBinding(name, false);
      },
      function initializeBinding(name, value, strict){
        return this.LexicalEnvironment.InitializeBinding(name, value, strict);
      },
      function hasBinding(name){
        return this.LexicalEnvironment.HasBinding(name);
      },
      function popScope(){
        var scope = this.LexicalEnvironment;
        this.LexicalEnvironment = this.LexicalEnvironment.outer;
        return scope;
      },
      function pushScope(){
        this.LexicalEnvironment = new DeclarativeEnv(this.LexicalEnvironment);
      },
      function cloneScope(){
        var scope = this.LexicalEnvironment,
            clone = new DeclarativeEnv(scope.outer);
        for (var k in scope.bindings) {
          clone.bindings[k] = scope.bindings[k];
        }
        for (var k in scope.deletables) {
          clone.deletables[k] = scope.deletables[k];
        }
        for (var k in scope.consts) {
          clone.consts[k] = scope.consts[k];
        }
        this.LexicalEnvironment = clone;
        return scope;
      },
      function replaceScope(scope){
        var oldScope = this.LexicalEnvironment;
        this.LexicalEnvironment = scope;
        return oldScope;
      },
      function pushWith(obj){
        this.LexicalEnvironment = new DeclarativeEnv(this.LexicalEnvironment);
        this.LexicalEnvironment.withBase = obj;
        return obj;
      },
      function createClass(def, superclass){
        this.LexicalEnvironment = new DeclarativeEnv(this.LexicalEnvironment);
        var ctor = $$ClassDefinitionEvaluation(def.name, superclass, def.ctor, def.methods, def.symbols);
        this.LexicalEnvironment = this.LexicalEnvironment.outer;
        return ctor;
      },
      function createFunction(isExpression, name, code){
        var $F = code.flags.generator ? $GeneratorFunction : $Function,
            env = this.LexicalEnvironment;

        if (isExpression && name) {
          env = new DeclarativeEnv(env);
          env.CreateImmutableBinding(name);
        }

        var func = new $F(code.lexicalType, name, code.params, code, env, code.flags.strict);

        if (code.lexicalType !== 'arrow') {
          $$MakeConstructor(func);
          isExpression && name && env.InitializeBinding(name, func);
        }

        return func;
      },
      function createArguments(args, env, params, func){
        if (env === undefined) {
          return new $StrictArguments(args);
        } else {
          return new $MappedArguments(args, env, params, func);
        }
      },
      function hasOwnGlobal(name){
        return this.Realm.global.HasOwnProperty(name);
      },
      function getOwnGlobal(name){
        return this.Realm.global.GetOwnProperty(name);
      },
      function putOwnGlobal(name, value, configurable){
        globalDesc.Configurable = !!configurable;
        globalDesc.Value = value;
        var result = this.Realm.global.DefineOwnProperty(name, globalDesc, true);
        globalDesc.Value = undefined;
        return result;
      },
      function createArray(len){
        return new $Array(len);
      },
      function createObject(proto){
        return new $Object(proto);
      },
      function createRegExp(regex){
        return new $RegExp(regex);
      },
      function getPropertyReference(name, obj){
        return $$Element(this, name, obj);
      },
      function getReference(name){
        var origin = this.LexicalEnvironment || this.VariableEnvironment,
            cache = origin.cache;

        if (cache) {
          if (name in cache) {
            return cache[name];
          }
        } else {
          cache = origin.cache = new Hash;
        }


        var lex = origin,
            strict = this.callee ? this.callee.Strict : this.code.flags.strict;

        do {
          if (lex.HasBinding(name)) {
            return cache[name] = new Reference(lex, name, strict);
          }
        } while (lex = lex.outer)

        cache = strict ? strictUnfound : unfound;
        if (name in cache) {
          return cache[name];
        }
        return cache[name] = new Reference(undefined, name, strict);
      },
      function getSuperReference(name){
        return $$SuperReference(this, name);
      },
      function getThisEnvironment(){
        return $$GetThisEnvironment(this);
      },
      function getThis(){
        return $$ThisResolution(this);
      },
      function destructureSpread(target, index){
        return $$SpreadDestructuring(this, target, index);
      },
      function getTemplateCallSite(template){
        return $$GetTemplateCallSite(this, template);
      },
      function getSymbol(name){
        return $$GetSymbol(this, name) || $$ThrowException('undefined_symbol', name);
      },
      function createSymbol(name, isPublic){
        return new $Symbol(name, isPublic);
      },
      function initializeSymbolBinding(name, symbol){
        return this.LexicalEnvironment.InitializeSymbolBinding(name, symbol);
      }
    ]);


    natives.add({
      _isConstruct: function(){
        return context.isConstruct;
      },
      _argumentCount: function(){
        return context.argumentCount();
      },
      _hasArgument: function(obj, args){
        return context.hasArgument(args[0]);
      },
      _callerName: function(){
        return context.callerName();
      },
      _callerIsConstruct: function(){
        if (context.caller) {
          return context.caller.isConstruct;
        }
        return false;
      },
      _callerArgumentCount: function(){
        if (context.caller) {
          return context.argumentCount();
        }
        return null;
      },
      _callerHasArgument: function(obj, args){
        if (context.caller) {
          return context.caller.hasArgument(args[0]);
        }
        return false;
      }
    });

    return ExecutionContext;
  })();




  function notify(changeRecord){
    if (!('ChangeObservers' in this)) {
      return $$ThrowException('called_on_incompatible_object', ['Notifier.prototype.notify']);
    }

    changeRecord = $$ToObject(changeRecord);
    var type = changeRecord.Get('type');
    if (typeof type !== 'string') {
      return  $$ThrowException('changerecord_type', [typeof type]);
    }

    var changeObservers = this.ChangeObservers;
    if (changeObservers.size) {
      var target = this.Target,
          newRecord = new $Object,
          keys = changeRecord.Enumerate(true, true);

      newRecord.define('object', target, 1);
      for (var i=0; i < keys.length; i++) {
        newRecord.define(keys[i], changeRecord.Get(keys[i]), 1);
      }

      newRecord.PreventExtensions();
      $$EnqueueChangeRecord(newRecord, changeObservers);
    }
  }


  var Intrinsics = (function(){
    var $errors = ['EvalError', 'RangeError', 'ReferenceError',
                   'SyntaxError', 'TypeError', 'URIError'];

    var $builtins = {
      Array   : $Array,
      Error   : $Error,
      Function: $Function,
      RegExp  : $RegExp,
      Symbol  : $Symbol
    };

    exports.builtins = {
      $Array            : $Array,
      $BoundFunction    : $BoundFunction,
      $Error            : $Error,
      $Function         : $Function,
      $Generator        : $Generator,
      $GeneratorFunction: $GeneratorFunction,
      $InternalFunction : $InternalFunction,
      $Module           : $Module,
      $NativeFunction   : $NativeFunction,
      $Object           : $Object,
      $Proxy            : $Proxy,
      $RegExp           : $RegExp,
      $Symbol           : $Symbol,
      $TypedArray       : $TypedArray,
      MapData           : MapData,
      WeakMapData       : WeakMapData,
      DeclarativeEnv    : DeclarativeEnv,
      ObjectEnv         : ObjectEnv,
      FunctionEnv       : FunctionEnv,
      GlobalEnv         : GlobalEnv,
      ExecutionContext  : ExecutionContext
    };

    function FunctionPrototypeCall(){}
    function FunctionPrototypeHasInstance(){
      return false;
    }

    function $$CreateThrowTypeError(realm){
      var thrower = create($NativeFunction.prototype);
      $Object.call(thrower, realm.intrinsics.FunctionProto);
      thrower.call = function(){
        return $$ThrowException('strict_poison_pill');
      };
      thrower.define('length', 0, ___);
      thrower.define('name', 'ThrowTypeError', ___);
      thrower.Realm = realm;
      thrower.Extensible = false;
      thrower.IsStrictThrower = true;
      thrower.Strict = true;
      hide(thrower, 'Realm');
      return new Accessor(thrower);
    }

    var primitives = {
      RegExp: RegExp.prototype
    };

    function Intrinsics(realm){
      DeclarativeEnv.call(this, null);
      this.Realm = realm;
      realm.natives = this;
      realm.intrinsics = this.bindings;
      activate(realm);
      intrinsics.Genesis = new $Object(null);
      intrinsics.Genesis.HiddenPrototype = true;
      intrinsics.ObjectProto = new $Object(intrinsics.Genesis);
      intrinsics.global = global = operators.global = realm.global = new $Object(intrinsics.ObjectProto);
      intrinsics.global.BuiltinBrand = 'GlobalObject';
      realm.globalEnv = new GlobalEnv(intrinsics.global);
      realm.globalEnv.Realm = realm;

      for (var k in $builtins) {
        var prototype = intrinsics[k + 'Proto'] = create($builtins[k].prototype);
        $Object.call(prototype, intrinsics.ObjectProto);
        if (k in primitives) {
          prototype.PrimitiveValue = primitives[k];
        }
      }


      for (var i=0; i < 6; i++) {
        var prototype = intrinsics[$errors[i] + 'Proto'] = create($Error.prototype);
        $Object.call(prototype, intrinsics.ErrorProto);
        prototype.define('name', $errors[i], _CW);
      }

      intrinsics.StopIteration = new $Object(intrinsics.ObjectProto);
      intrinsics.StopIteration.BuiltinBrand = 'StopIteration';

      intrinsics.FunctionProto.FormalParameters = [];
      intrinsics.FunctionProto.Call = FunctionPrototypeCall;
      intrinsics.FunctionProto.HasInstance = FunctionPrototypeHasInstance;
      intrinsics.FunctionProto.BuiltinBrand = 'BuiltinFunction';
      intrinsics.FunctionProto.Scope = realm.globalEnv;
      intrinsics.FunctionProto.Realm = realm;
      intrinsics.ThrowTypeError = $$CreateThrowTypeError(realm);

      intrinsics.ArrayProto.array = [];
      intrinsics.ArrayProto.length = ['length', 0, __W];

      intrinsics.ErrorProto.define('name', 'Error', _CW);
      intrinsics.ErrorProto.define('message', '', _CW);

      intrinsics.ObserverCallbacks = new MapData;
      intrinsics.NotifierProto = new $Object(intrinsics.ObjectProto);
      intrinsics.NotifierProto.define('notify', new $NativeFunction(notify), _CW);
    }

    inherit(Intrinsics, DeclarativeEnv, {
      type: 'Intrinsics'
    }, [
      function binding(options){
        if (typeof options === 'function') {
          options = {
            call: options,
            name: options.name,
            length: options.length
          }
        }

        if (!options.name) {
          if (!options.call.name) {
            options.name = arguments[1];
          } else {
            options.name = options.call.name;
          }
        }

        if (typeof options.length !== 'number') {
          options.length = options.call.length;
        }

        if (realm !== this.Realm) {
          var activeRealm = realm;
          activate(this.Realm);
        }

        this.bindings[options.name] = new $NativeFunction(options);

        if (activeRealm) {
          activate(activeRealm);
        }
      }
    ]);

    return Intrinsics;
  })();


  var Script = (function(){
    function ParseOptions(o){
      for (var k in o) {
        if (k in this) {
          this[k] = o[k];
        }
      }
    }

    ParseOptions.prototype = {
      loc     : true,
      range   : true,
      raw     : false,
      comment : false,
      tokens  : false,
      tolerant: false
    };

    function parse(src, filename, kind, options){
      if (!options) {
        if (isObject(kind)) {
          options = kind;
          kind = '';
        } else if (isObject(filename)) {
          options = filename;
          filename = kind = '';
        } else {
          options = {};
        }
      }
      try {
        return esprima.parse(src, options ? new ParseOptions(options) : ParseOptions.prototype);
      } catch (e) {
        if (!realm || !intrinsics) return e;
        var err = new $Error('SyntaxError', undefined, e.message),
            loc = { line: e.lineNumber, column: e.column };

        err.setCode({ start: loc, end: loc }, src);
        err.setOrigin(filename, kind);
        return new AbruptCompletion('throw', err);
      }
    }

    exports.parse = parse;

    natives.add({
      parse: function(src, loc, range, raw, tokens, comment, tolerant, source){
        var ast = parse(src, source, 'script', {
          loc     : !!loc,
          range   : !!range,
          raw     : !!raw,
          tokens  : !!tokens,
          comment : !!comment,
          tolerant: !!tolerant
        });

        if (ast.Abrupt) return ast;
        return fromInternal(ast);
      }
    });

    var load = (function(){
      if (typeof process !== 'undefined') {
        var fs = require('fs');
        return function load(source){
          if (!~source.indexOf('\n') && fs.existsSync(source)) {
            return { scope: 'global', source: fs.readFileSync(source, 'utf8'), filename: source };
          } else {
            return { scope: 'global', source: source, filename: '' };
          }
        };
      }
      return function load(source){
        return { scope: 'global', source: source, filename: '' };
      };
    })();

    function Script(options){
      if (options instanceof Script)
        return options;

      this.type = 'script';

      if (typeof options === 'function') {
        this.type = 'recompiled function';
        if (!fname(options)) {
          options = {
            scope: 'function',
            filename: '',
            source: '('+options+')()'
          }
        } else {
          options = {
            scope: 'function',
            filename: fname(options),
            source: options+''
          };
        }
      } else if (typeof options === 'string') {
        options = load(options);
      }

      if (options.natives) {
        this.natives = true;
        this.type = 'native';
      }
      if (options.eval || options.scope === 'eval') {
        this.eval = true;
        this.type = 'eval';
      }
      this.scope = options.scope;

      if (!isObject(options.ast) && typeof options.source === 'string') {
        this.source = options.source;
        this.ast = parse(options.source, options.filename, this.type);
        if (this.ast.Abrupt) {
          this.error = this.ast;
          this.ast = null;
        }
      }

      this.filename = options.filename || '';
      if (this.ast) {
        this.bytecode = assemble(this);
        tag(this.bytecode);
      }
      return this;
    }

    define(Script, [parse]);

    return Script;
  })();



  var Realm = (function(){
    function wrapFunction(f){
      if (f._wrapper) {
        return f._wrapper;
      }

      f._wrapper = function(){ return f.Call(this, arguments) };
      f._wrapper._wraps = f;
      return f._wrapper;
    }

    natives.add({
      wrapper: function(_, args){
        var func = args[0];
      },
      _eval: (function(){
        function builtinEval(obj, args, direct){
          var code = args[0];
          if (typeof code !== 'string') {
            return code;
          }

          var script = new Script({
            scope: 'eval',
            natives: false,
            strict: context.callee ? context.callee.Strict : context.code.flags.strict,
            source: code
          });

          if (script.error) {
            return script.error;
          }

          if (direct) {
            return context.run();
          }

          var ctx = new ExecutionContext(context, realm.globalEnv, realm, script.bytecode);
          ExecutionContext.push(ctx);
          var result = context.run();
          ctx === context && ExecutionContext.pop();
          return result;
        }
        builtinEval.isBuiltinEval = true;
        return builtinEval;
      })(),
      _FunctionCreate: function(obj, args){
        var body = args.pop();

        var script = new Script({
          scope: 'global',
          natives: false,
          source: '(function anonymous('+args.join(', ')+') {\n'+body+'\n})'
        });

        if (script.error) {
          return script.error;
        }

        var ctx = new ExecutionContext(context, realm.globalEnv, realm, script.bytecode);
        ExecutionContext.push(ctx);
        var func = ctx.run();
        ctx === context && ExecutionContext.pop();
        return func;
      },
      _BoundFunctionCreate: function(obj, args){
        return new $BoundFunction(args[0], args[1], $$CreateListFromArray(args[2]));
      },
      _ErrorCreate: function(obj, args){
        return new $Error(args[0], undefined, args[1]);
      },
      _ObjectCreate: function(obj, args){
        return new $Object(args[0] === null ? intrinsics.Genesis : args[0]);
      },
      _ProxyCreate: function(obj, args){
        return new $Proxy(args[0], args[1]);
      },
      _SymbolCreate: function(obj, args){
        return new $Symbol(args[0], args[1]);
      },
      _RegExpCreate: function(obj, args){
        var pattern = args[0],
            flags   = args[1];

        if (typeof pattern === 'object') {
          pattern = pattern.PrimitiveValue;
        }
        try {
          var result = new RegExp(pattern, flags);
        } catch (e) {
          return $$ThrowException('invalid_regexp', [pattern+'']);
        }
        return new $RegExp(result);
      },
      _MapInitialization: CollectionInitializer(MapData, 'Map'),
      _WeakMapInitialization: CollectionInitializer(WeakMapData, 'WeakMap'),
      EvaluateModule: function(loader, source, name, callback, errback){
        if (!callback && !errback) {
          var result, thrown;

          realm.evaluateModule(loader, source, name,
            function(module){ result = module },
            function(error){ result = error; thrown = true; }
          );

          return thrown ? new AbruptCompletion('throw', result) : result;
        } else {
          realm.evaluateModule(loader, source, name, wrapFunction(callback), wrapFunction(errback));
        }
      },
      _ToModule: function(obj, args){
        if (args[0].BuiltinBrand === 'BuiltinModule') {
          return args[0];
        }
        return new $Module(args[0], args[0].Enumerate(false, false));
      },
      _Fetch: function(obj, args){
        var result = require('./builtins')[args[0]];
        if (!result) {
          result = new $Error('Error', undefined, 'Unable to locate module "'+args[0]+'"');
        }
        args[1].Call(undefined, [result]);
      }
    });

    function deliverChangeRecordsAndReportErrors(){
      var observerResults = $$DeliverAllChangeRecords();
      if (observerResults && observerResults instanceof Array) {
        each(observerResults, function(error){
          realm.emit('throw', error);
        });
      }
    }


    var internalModules = exports.internalModules = (function(modules){
      return define({}, [
        function set(name, bindings){
          modules[name] = new $NativeModule(bindings);
          modules[name].mrl = name;
        },
        function has(name){
          return name in modules;
        },
        function get(name){
          return modules[name];
        },
        function remove(name){
          if (this.has(name)) {
            delete modules[name];
            return true;
          }
          return false;
        }
      ]);
    })(new Hash);


    void function(){
      var objectTypes = {
        Array   : $Array,
        Boolean : createBoolean,
        Error   : $Error,
        Function: $Function,
        Module  : $Module,
        Number  : createNumber,
        Object  : $Object,
        Proxy   : $Proxy,
        RegExp  : $RegExp,
        Symbol  : $Symbol,
        String  : createString
      };


      internalModules.set('@@internals', {
        $$ArgumentCount: function(){
          return context.argumentCount();
        },
        $$Assert: function(_, args){
          if (args[0] === true) {
            return true;
          }
          return $$ThrowException('assertion_failed', ['$$Assert']);
        },
        $$AssertIsInternalArray: function(_, args){
          if (args[0] instanceof Array) {
            return true;
          }
          return $$ThrowException('assertion_failed', ['$$AssertIsInternalArray']);
        },
        $$AssertIsECMAScriptValue: function(_, args){
          if (typeof args[0] !== 'object' || args[0] === null && args[0].DefineOwnProperty) {
            return true;
          }
          return $$ThrowException('assertion_failed', ['$$AssertIsECMAScriptValue:']);
        },
        $$AssertWontThrow: function(_, args){
          if (!args[0] || !args[0].Abrupt) {
            return true;
          }
          return $$ThrowException('assertion_failed', ['$$AssertWontThrow']);
        },
        $$Call: function(_, args){
          var func = args[0].Call ? args[0].call : args[0];

          switch (args.length) {
            case 1: return func();
            case 2: return func.call(args[1]);
            case 3: return func.call(args[1], args[2]);
            case 4: return func.call(args[1], args[2], args[3]);
            case 5: return func.call(args[1], args[2], args[3], args[4]);
            case 6: return func.call(args[1], args[2], args[3], args[4], args[5]);
            default: return func.apply(args[1], args.slice(2));
          }
        },
        $$CallerArgumentCount: function(){
          if (context.caller) {
            return context.argumentCount();
          }
          return null;
        },
        $$CallerHasArgument: function(_, args){
          if (context.caller) {
            return context.caller.hasArgument(args[0]);
          }
          return false;
        },
        $$CallerName: function(){
          return context.callerName();
        },
        $$CallerIsConstruct: function(){
          if (context.caller) {
            return context.caller.isConstruct;
          }
          return false;
        },
        $$CreateObject: function(_, args){
          return new objectTypes[args[0]](args[1]);
        },
        $$CreateInternalObject: function(_, args){
          return create(args[0] || null);
        },
        $$CurrentRealm: function(){
          return realm;
        },
        $$Enumerate: function(_, args){
          return new $Array(properties(args[0]));
        },
        $$EnumerateAll: function(_, args){
          var obj   = args[0],
              seen  = new Hash,
              props = [];

          while (obj instanceof $Object) {
            each(properties(obj), function(prop){
              if (!(prop in seen)) {
                seen[prop] = props.push(prop);
              }
            });
            obj = getPrototypeOf(obj);
          }

          return new $Array(props);
        },
        $$Exception: function(_, args){
          return $$MakeException(args[0], args[1] ? args[1].array : []);
        },
        $$Get: function(_, args){
          var obj = args[0],
              key = args[1],
              val = obj[key];

          if (typeof val === 'function') {
            return val._wraps || (val._wraps = new $NativeFunction({
              length: val.length,
              name  : key,
              call  : val
            }));
          }

          return val;
        },
        $$GetIntrinsic: function(_, args){
          return realm.intrinsics[args[0]];
        },
        $$HasArgument: function(_, args){
          return context.hasArgument(args[0]);
        },
        $$Has: function(_, args){
          return args[1] in args[0];
        },
        $$Invoke: function(_, args){
          var obj  = args[0],
              key  = args[1];

          if (obj[key]) {
            switch (args.length) {
              case 2: return obj[key]();
              case 3: return obj[key](args[2]);
              case 4: return obj[key](args[2], args[3]);
              case 5: return obj[key](args[2], args[3], args[4]);
              case 6: return obj[key](args[2], args[3], args[4], args[5]);
              default: return obj[key].apply(obj, args.slice(2));
            }
          }
          return $$ThrowException('unknown_internal_function', [key]);
        },
        $$IsConstruct: function(){
          return context.isConstruct;
        },
        $$Now: Date.now
          ? Date.now
          : function(){ return +new Date },
        $$NumberToString: function(_, args){
          return args[0].toString(args[1] || 10);
        },
        $$ParseDate: Date.parse
          ? function(_, args){ return Date.parse(args[0]) }
          : function(_, args){ return NaN },
        $$RegExpExec: function(_, args){
          var result = args[0].PrimitiveValue.exec(args[1]);
          if (result) {
            var array = new $Array(result);
            array.set('index', result.index);
            array.set('input', args[1]);
            return array;
          }
          return null;
        },
        $$Set: function(_, args){
          var val = args[2];

          if (val && val.Call) {
            val = wrapFunction(val);
          }

          return args[0][args[1]] = val;
        },
        $$SetIntrinsic: function(_, args){
          realm.intrinsics[args[0]] = args[1];
        },
        $$StringToNumber: function(_, args){
          return +args[0];
        }
      });
    }();

    internalModules.set('@@constants', {
      DST_START_MONTH  : natives.get('DST_START_MONTH'),
      DST_START_SUNDAY : natives.get('DST_START_SUNDAY'),
      DST_START_OFFSET : natives.get('DST_START_OFFSET'),
      DST_END_MONTH    : natives.get('DST_END_MONTH'),
      DST_END_SUNDAY   : natives.get('DST_END_SUNDAY'),
      DST_END_OFFSET   : natives.get('DST_END_OFFSET'),
      LOCAL_TZ         : natives.get('LOCAL_TZ'),
      MAX_INTEGER      : 9007199254740992,
      MAX_VALUE        : 1.7976931348623157e+308,
      MIN_VALUE        : 5e-324,
      NaN              : +'NaN',
      POSITIVE_INFINITY: 1 / 0,
      NEGATIVE_INFINITY: 1 / -0
    });

    internalModules.set('@@symbols', symbols);


    var mutationScopeInit = new Script('void 0');

    function initialize(realm, Ω, ƒ){
      if (realm.initialized) Ω();
      var builtins = require('./builtins'),
          init = builtins['@@internal'] + '\n\n'+ builtins['@system'];

      var fakeLoader = {
        Get: function(key){
          if (key === 'global') return realm.global;
          if (key === 'baseURL') return '';
        }
      };


      realm.state = 'initializing';
      realm.initialized = true;
      realm.mutationScope = new ExecutionContext(null, realm.globalEnv, realm, mutationScopeInit.bytecode);
      resolveModule(fakeLoader, init, '@system', Ω, ƒ);
    }

    function prepareToRun(bytecode, scope){
      if (!scope) {
        var realm = createSandbox(realm.global);
        scope = realm.globalEnv;
      } else {
        var realm = scope.Realm;
      }
      ExecutionContext.push(new ExecutionContext(null, scope, realm, bytecode));
      var status = $$TopLevelDeclarationInstantiation(bytecode);
      if (status && status.Abrupt) {
        realm.emit(status.type, status);
        return status;
      }
    }

    function run(realm, bytecode){
      realm.executing = bytecode;
      realm.state = 'executing';
      realm.emit('executing', bytecode);

      var result = context.run();

      if (result === Pause) {
        var resume = function(){
          resume = function(){};
          delete realm.resume;
          realm.emit('resume');
          return run(realm, bytecode);
        };

        context.sp--;
        realm.resume = function(){ return resume() };
        realm.state = 'paused';
        realm.emit('pause', realm.resume);
      } else {
        deliverChangeRecordsAndReportErrors();
        realm.executing = null;
        realm.state = 'idle';
        return result;
      }
    }

    function mutationContext(realm, toggle){
      if (toggle === undefined) {
        toggle = !realm.mutating;
      } else {
        toggle = !!toggle;
      }

      if (toggle !== realm.mutating) {
        realm.mutating = toggle;
        if (toggle) {
          ExecutionContext.push(realm.mutationScope);
        } else {
          deliverChangeRecordsAndReportErrors();
          ExecutionContext.pop();
        }
      }
      return toggle;
    }

    function resolveImports(loader, code, Ω, ƒ){
      var modules = new Hash;
      if (code.imports && code.imports.length) {
        var load = loader.Get('load'),
            count = code.imports.length,
            errors = [];

        var callback = {
          Call: function(receiver, args){
            var result = args[0];

            if (result instanceof $Module) {
              modules[result.mrl] = result;
            } else {}

            if (!--count) {
              if (errors.length) {
                ƒ(errors);
              } else {
                Ω(modules);
              }
            }
          }
        };

        var errback = {
          Call: function(receiver, args){
            errors.push(args[0]);
            if (!--count) {
              ƒ(errors);
            }
          }
        };

        each(code.imports, function(imported){
          if (imported.code) {
            var sandbox = createSandbox(global, loader);

            runScript(sandbox, { bytecode: imported.code }, function(){
              var module = new $Module(sandbox.globalEnv, imported.code.exportedNames);
              module.mrl = imported.code.name;
              callback.Call(null, [module]);
            }, function(err){
              errback.Call(null, [err]);
            });
          } else if (imported.origin instanceof Array) {

          } else if (internalModules.has(imported.origin)) {
            callback.Call(null, [internalModules.get(imported.origin)]);
          } else {
            load.Call(loader, [imported.origin, callback, errback]);
          }
        });
      } else {
        Ω(modules);
      }
    }

    function createSandbox(object, loader){
      var outerRealm = object.Realm || object.Prototype.Realm,
          bindings   = new $Object,
          scope      = new GlobalEnv(bindings),
          realm      = scope.Realm = bindings.Realm = create(outerRealm);

      bindings.BuiltinBrand = 'GlobalObject';
      scope.outer = outerRealm.globalEnv;
      realm.global = bindings;
      realm.globalEnv = scope;
      if (loader) {
        realm.loader = loader;
      }
      return realm;
    }


    function runScript(realm, script, Ω, ƒ){
      var scope = realm.globalEnv,
          ctx = new ExecutionContext(context, scope, realm, script.bytecode);

      ExecutionContext.push(ctx);
      var status = $$TopLevelDeclarationInstantiation(script.bytecode);
      context === ctx && ExecutionContext.pop();

      if (status && status.Abrupt) {
        return ƒ(status);
      }

      resolveImports(realm.loader, script.bytecode, function(modules){
        each(script.bytecode.imports, function(imported){
          var module = modules[imported.origin];

          if (imported.name) {
            scope.SetMutableBinding(imported.name, module);
          } else if (imported.specifiers) {
            each(imported.specifiers, function(path, name){
              if (name === '*') {
                return module.each(function(prop){
                  scope.SetMutableBinding(prop[0], module.Get(prop[0]));
                });
              }

              var obj = module;
              each(path, function(part){
                obj = obj.Get(part);
              });

              if (name[0] !== '@') {
                return scope.SetMutableBinding(name, obj);
              }

              if (name[1] === '@' && !(obj instanceof $WellKnownSymbol)) {
                ƒ($$MakeException('unknown_wellknown_symbol', [name]));
              } else if (!(obj instanceof $Symbol)) {
                ƒ($$MakeException('import_not_symbol', [name]));
              } else {
                scope.InitializeSymbolBinding(name.slice(1), obj);
              }
            });
          }
        });

        ExecutionContext.push(ctx);
        var result = ctx.run();
        context === ctx && ExecutionContext.pop();

        if (result && result.Abrupt) {
          ƒ(result);
        } else {
          Ω(result);
        }
      }, function(errors){
        each(errors, ƒ);
      });
    }

    function resolveModule(loader, source, name, Ω, ƒ){
      var script = new Script({
        name: name,
        natives: true,
        source: source,
        scope: 'module'
      });


      if (script.error) {
        return ƒ(script.error);
      }

      realm.scripts.push(script);

      var sandbox = createSandbox(loader.Get('global'), loader);

      runScript(sandbox, script, function(){
        Ω(new $Module(sandbox.globalEnv, script.bytecode.exportedNames));
      }, ƒ);
    }


    function Realm(oncomplete){
      var self = this;

      Emitter.call(this);
      realms.push(this);
      this.active        = false;
      this.quiet         = false;
      this.initialized   = false;
      this.mutationScope = null;
      this.scripts       = [];
      this.templates     = {};
      this.state         = 'bootstrapping';

      new Intrinsics(this);

      hide(intrinsics.FunctionProto, 'Scope');
      hide(this, 'intrinsics');
      hide(this, 'natives');
      hide(this, 'templates');
      hide(this, 'scripts');
      hide(this, 'globalEnv');
      hide(this, 'initialized');
      hide(this, 'quiet');
      hide(this, 'mutationScope');

      iterate(natives, function(item){
        var key   = item[0],
            value = item[1],
            name  = key[0] === '_' ? key.slice(1) : key;

        if (typeof value === 'function') {
          intrinsics[name] = new $NativeFunction({
            unwrapped: key[0] === '_',
            length   : value.length,
            name     : name,
            call     : value
          });
        } else {
          intrinsics[name] = value;
        }
      });

      function init(){
        initialize(self, function(){
          deactivate(self);
          self.scripts = [];
          self.state = 'idle';
          self.emit('ready');
          if (typeof oncomplete === 'function') {
            oncomplete(self);
          }
        }, function(error){
          self.state = 'error';
          self.emit('throw', error);
          if (typeof oncomplete === 'function') {
            oncomplete(error);
          }
        });
      }

      this.state = 'initializing';
      if (oncomplete === true) {
        setTimeout(init, 10);
      } else {
        init();
      }
    }

    inherit(Realm, Emitter, [
      function enterMutationContext(){
        mutationContext(this, true);
      },
      function exitMutationContext(){
        mutationContext(this, false);
      },
      function evaluateModule(loader, source, name, callback, errback){
        if (typeof callback !== 'function') {
          if (typeof name === 'function') {
            callback = name;
            name = '';
          } else {
            callback = noop;
          }
        }

        if (typeof errback !== 'function') {
          errback = noop;
        }

        resolveModule(loader, source, name, callback, errback);
      },
      function evaluateAsync(subject, callback, errback){
        var script = new Script(subject),
            self = this;

        callback || (callback = noop);
        errback  || (errback = callback);

        if (script.error) {
          nextTick(function(){
            self.emit(script.error.type, script.error);
            errback(script.error);
          });
        } else {
          this.scripts.push(script);
          runScript(this, script, function(result){
            self.emit('complete', result);
            callback(result);
          }, function(error){
            self.emit('throw', error);
            errback(error);
          });
        }

        return this;
      },
      function evaluate(subject){
        activate(this);
        var script = new Script(subject);

        if (script.error) {
          this.emit('throw', script.error);
          return script.error;
        }

        this.scripts.push(script);

        var result = prepareToRun(script.bytecode, this.globalEnv) || run(this, script.bytecode);

        var completionType = result && result.Abrupt ? 'throw' : 'complete';
        this.emit(completionType, result);
        return result;
      },
      function useConsole(console){
        if (console.error) {
          this.on('throw', function(completion){
            console.error(completion.value);
          });
        }

        if (console.clear) {
          this.on('clear', function(){
            console.clear();
          });
        }

        this.on('inspect', function(values, expand){
          values = values.array;
          if (expand) {
            console.dir(values[0]);
          } else {
            console.log.apply(console, values);
          }
        });

        return this;
      }
    ]);

    return Realm;
  })();


  var realms = [],
      realmStack = [],
      realm = null,
      global = null,
      context = null,
      intrinsics = null;

  function activate(target){
    if (realm !== target) {
      if (realm) {
        realm.active = false;
        realm.emit('deactivate');
      }
      realmStack.push(realm);
      exports.realm = realm = target;
      exports.global = global = operators.global = target.global;
      exports.intrinsics = intrinsics = target.intrinsics;
      target.active = true;
      $Object.changeRealm(target);
      $Array.changeRealm(target);
      //$String.changeRealm(target);
      $StrictArguments.changeRealm(target);
      operations.changeRealm(target);
      target.emit('activate');
    }
  }

  function deactivate(target){
    if (realm === target && realmStack.length) {
      target.active = false;
      realm = realmStack.pop();
      target.emit('dectivate');
    }
  }


  exports.Realm = Realm;
  exports.Script = Script;
  exports.$NativeFunction = $NativeFunction;

  exports.activeRealm = function activeRealm(){
    if (!realm && realms.length) {
      activate(realms[realms.length - 1]);
    }
    return realm;
  };

  exports.activeContext = function activeContext(){
    return context;
  };

  return exports;
})((0,eval)('this'), typeof module !== 'undefined' ? module.exports : {});
