(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[8052],{50663:function(e,t,r){"use strict";function n(e){for(var t=arguments.length,r=Array(t>1?t-1:0),n=1;n<t;n++)r[n-1]=arguments[n];throw Error("[Immer] minified error nr: "+e+(r.length?" "+r.map(function(e){return"'"+e+"'"}).join(","):"")+". Find the full error at: https://bit.ly/3cXEKWf")}function o(e){return!!e&&!!e[N]}function i(e){var t;return!!e&&(function(e){if(!e||"object"!=typeof e)return!1;var t=Object.getPrototypeOf(e);if(null===t)return!0;var r=Object.hasOwnProperty.call(t,"constructor")&&t.constructor;return r===Object||"function"==typeof r&&Function.toString.call(r)===W}(e)||Array.isArray(e)||!!e[$]||!!(null===(t=e.constructor)||void 0===t?void 0:t[$])||f(e)||p(e))}function a(e,t,r){void 0===r&&(r=!1),0===s(e)?(r?Object.keys:H)(e).forEach(function(n){r&&"symbol"==typeof n||t(n,e[n],e)}):e.forEach(function(r,n){return t(n,r,e)})}function s(e){var t=e[N];return t?t.i>3?t.i-4:t.i:Array.isArray(e)?1:f(e)?2:p(e)?3:0}function u(e,t){return 2===s(e)?e.has(t):Object.prototype.hasOwnProperty.call(e,t)}function c(e,t,r){var n=s(e);2===n?e.set(t,r):3===n?e.add(r):e[t]=r}function l(e,t){return e===t?0!==e||1/e==1/t:e!=e&&t!=t}function f(e){return D&&e instanceof Map}function p(e){return V&&e instanceof Set}function d(e){return e.o||e.t}function h(e){if(Array.isArray(e))return Array.prototype.slice.call(e);var t=q(e);delete t[N];for(var r=H(t),n=0;n<r.length;n++){var o=r[n],i=t[o];!1===i.writable&&(i.writable=!0,i.configurable=!0),(i.get||i.set)&&(t[o]={configurable:!0,writable:!0,enumerable:i.enumerable,value:e[o]})}return Object.create(Object.getPrototypeOf(e),t)}function m(e,t){return void 0===t&&(t=!1),y(e)||o(e)||!i(e)||(s(e)>1&&(e.set=e.add=e.clear=e.delete=v),Object.freeze(e),t&&a(e,function(e,t){return m(t,!0)},!0)),e}function v(){n(2)}function y(e){return null==e||"object"!=typeof e||Object.isFrozen(e)}function g(e){var t=X[e];return t||n(18,e),t}function b(e,t){t&&(g("Patches"),e.u=[],e.s=[],e.v=t)}function x(e){_(e),e.p.forEach(S),e.p=null}function _(e){e===k&&(k=e.l)}function w(e){return k={p:[],l:k,h:e,m:!0,_:0}}function S(e){var t=e[N];0===t.i||1===t.i?t.j():t.g=!0}function O(e,t){t._=t.p.length;var r=t.p[0],o=void 0!==e&&e!==r;return t.h.O||g("ES5").S(t,e,o),o?(r[N].P&&(x(t),n(4)),i(e)&&(e=E(t,e),t.l||j(t,e)),t.u&&g("Patches").M(r[N].t,e,t.u,t.s)):e=E(t,r,[]),x(t),t.u&&t.v(t.u,t.s),e!==L?e:void 0}function E(e,t,r){if(y(t))return t;var n=t[N];if(!n)return a(t,function(o,i){return P(e,n,t,o,i,r)},!0),t;if(n.A!==e)return t;if(!n.P)return j(e,n.t,!0),n.t;if(!n.I){n.I=!0,n.A._--;var o=4===n.i||5===n.i?n.o=h(n.k):n.o,i=o,s=!1;3===n.i&&(i=new Set(o),o.clear(),s=!0),a(i,function(t,i){return P(e,n,o,t,i,r,s)}),j(e,o,!1),r&&e.u&&g("Patches").N(n,r,e.u,e.s)}return n.o}function P(e,t,r,n,a,s,l){if(o(a)){var f=E(e,a,s&&t&&3!==t.i&&!u(t.R,n)?s.concat(n):void 0);if(c(r,n,f),!o(f))return;e.m=!1}else l&&r.add(a);if(i(a)&&!y(a)){if(!e.h.D&&e._<1)return;E(e,a),t&&t.A.l||j(e,a)}}function j(e,t,r){void 0===r&&(r=!1),!e.l&&e.h.D&&e.m&&m(t,r)}function R(e,t){var r=e[N];return(r?d(r):e)[t]}function A(e,t){if(t in e)for(var r=Object.getPrototypeOf(e);r;){var n=Object.getOwnPropertyDescriptor(r,t);if(n)return n;r=Object.getPrototypeOf(r)}}function T(e){e.P||(e.P=!0,e.l&&T(e.l))}function U(e){e.o||(e.o=h(e.t))}function z(e,t,r){var n,o,i,a,s,u,c,l=f(t)?g("MapSet").F(t,r):p(t)?g("MapSet").T(t,r):e.O?(i=o={i:(n=Array.isArray(t))?1:0,A:r?r.A:k,P:!1,I:!1,R:{},l:r,t:t,k:null,o:null,j:null,C:!1},a=G,n&&(i=[o],a=Y),u=(s=Proxy.revocable(i,a)).revoke,c=s.proxy,o.k=c,o.j=u,c):g("ES5").J(t,r);return(r?r.A:k).p.push(l),l}function I(e,t){switch(t){case 2:return new Map(e);case 3:return Array.from(e)}return h(e)}r.d(t,{xC:function(){return eg},hg:function(){return eP},oM:function(){return ex}});var B,C,k,M="undefined"!=typeof Symbol&&"symbol"==typeof Symbol("x"),D="undefined"!=typeof Map,V="undefined"!=typeof Set,F="undefined"!=typeof Proxy&&void 0!==Proxy.revocable&&"undefined"!=typeof Reflect,L=M?Symbol.for("immer-nothing"):((C={})["immer-nothing"]=!0,C),$=M?Symbol.for("immer-draftable"):"__$immer_draftable",N=M?Symbol.for("immer-state"):"__$immer_state",W=""+Object.prototype.constructor,H="undefined"!=typeof Reflect&&Reflect.ownKeys?Reflect.ownKeys:void 0!==Object.getOwnPropertySymbols?function(e){return Object.getOwnPropertyNames(e).concat(Object.getOwnPropertySymbols(e))}:Object.getOwnPropertyNames,q=Object.getOwnPropertyDescriptors||function(e){var t={};return H(e).forEach(function(r){t[r]=Object.getOwnPropertyDescriptor(e,r)}),t},X={},G={get:function(e,t){if(t===N)return e;var r,n,o=d(e);if(!u(o,t))return(n=A(o,t))?"value"in n?n.value:null===(r=n.get)||void 0===r?void 0:r.call(e.k):void 0;var a=o[t];return e.I||!i(a)?a:a===R(e.t,t)?(U(e),e.o[t]=z(e.A.h,a,e)):a},has:function(e,t){return t in d(e)},ownKeys:function(e){return Reflect.ownKeys(d(e))},set:function(e,t,r){var n=A(d(e),t);if(null==n?void 0:n.set)return n.set.call(e.k,r),!0;if(!e.P){var o=R(d(e),t),i=null==o?void 0:o[N];if(i&&i.t===r)return e.o[t]=r,e.R[t]=!1,!0;if(l(r,o)&&(void 0!==r||u(e.t,t)))return!0;U(e),T(e)}return e.o[t]===r&&(void 0!==r||t in e.o)||Number.isNaN(r)&&Number.isNaN(e.o[t])||(e.o[t]=r,e.R[t]=!0),!0},deleteProperty:function(e,t){return void 0!==R(e.t,t)||t in e.t?(e.R[t]=!1,U(e),T(e)):delete e.R[t],e.o&&delete e.o[t],!0},getOwnPropertyDescriptor:function(e,t){var r=d(e),n=Reflect.getOwnPropertyDescriptor(r,t);return n?{writable:!0,configurable:1!==e.i||"length"!==t,enumerable:n.enumerable,value:r[t]}:n},defineProperty:function(){n(11)},getPrototypeOf:function(e){return Object.getPrototypeOf(e.t)},setPrototypeOf:function(){n(12)}},Y={};a(G,function(e,t){Y[e]=function(){return arguments[0]=arguments[0][0],t.apply(this,arguments)}}),Y.deleteProperty=function(e,t){return Y.set.call(this,e,t,void 0)},Y.set=function(e,t,r){return G.set.call(this,e[0],t,r,e[0])};var K=new(function(){function e(e){var t=this;this.O=F,this.D=!0,this.produce=function(e,r,o){if("function"==typeof e&&"function"!=typeof r){var a,s=r;return r=e,function(e){var n=this;void 0===e&&(e=s);for(var o=arguments.length,i=Array(o>1?o-1:0),a=1;a<o;a++)i[a-1]=arguments[a];return t.produce(e,function(e){var t;return(t=r).call.apply(t,[n,e].concat(i))})}}if("function"!=typeof r&&n(6),void 0!==o&&"function"!=typeof o&&n(7),i(e)){var u=w(t),c=z(t,e,void 0),l=!0;try{a=r(c),l=!1}finally{l?x(u):_(u)}return"undefined"!=typeof Promise&&a instanceof Promise?a.then(function(e){return b(u,o),O(e,u)},function(e){throw x(u),e}):(b(u,o),O(a,u))}if(!e||"object"!=typeof e){if(void 0===(a=r(e))&&(a=e),a===L&&(a=void 0),t.D&&m(a,!0),o){var f=[],p=[];g("Patches").M(e,a,f,p),o(f,p)}return a}n(21,e)},this.produceWithPatches=function(e,r){if("function"==typeof e)return function(r){for(var n=arguments.length,o=Array(n>1?n-1:0),i=1;i<n;i++)o[i-1]=arguments[i];return t.produceWithPatches(r,function(t){return e.apply(void 0,[t].concat(o))})};var n,o,i=t.produce(e,r,function(e,t){n=e,o=t});return"undefined"!=typeof Promise&&i instanceof Promise?i.then(function(e){return[e,n,o]}):[i,n,o]},"boolean"==typeof(null==e?void 0:e.useProxies)&&this.setUseProxies(e.useProxies),"boolean"==typeof(null==e?void 0:e.autoFreeze)&&this.setAutoFreeze(e.autoFreeze)}var t=e.prototype;return t.createDraft=function(e){i(e)||n(8),o(e)&&(o(t=e)||n(22,t),e=function e(t){if(!i(t))return t;var r,n=t[N],o=s(t);if(n){if(!n.P&&(n.i<4||!g("ES5").K(n)))return n.t;n.I=!0,r=I(t,o),n.I=!1}else r=I(t,o);return a(r,function(t,o){var i;n&&(2===s(i=n.t)?i.get(t):i[t])===o||c(r,t,e(o))}),3===o?new Set(r):r}(t));var t,r=w(this),u=z(this,e,void 0);return u[N].C=!0,_(r),u},t.finishDraft=function(e,t){var r=(e&&e[N]).A;return b(r,t),O(void 0,r)},t.setAutoFreeze=function(e){this.D=e},t.setUseProxies=function(e){e&&!F&&n(20),this.O=e},t.applyPatches=function(e,t){for(r=t.length-1;r>=0;r--){var r,n=t[r];if(0===n.path.length&&"replace"===n.op){e=n.value;break}}r>-1&&(t=t.slice(r+1));var i=g("Patches").$;return o(e)?i(e,t):this.produce(e,function(e){return i(e,t)})},e}()),Z=K.produce;K.produceWithPatches.bind(K),K.setAutoFreeze.bind(K),K.setUseProxies.bind(K),K.applyPatches.bind(K),K.createDraft.bind(K),K.finishDraft.bind(K);var J=r(80263);function Q(e){return function(t){var r=t.dispatch,n=t.getState;return function(t){return function(o){return"function"==typeof o?o(r,n,e):t(o)}}}}var ee=Q();ee.withExtraArgument=Q,r(25566);var et=(B=function(e,t){return(B=Object.setPrototypeOf||({__proto__:[]})instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var r in t)Object.prototype.hasOwnProperty.call(t,r)&&(e[r]=t[r])})(e,t)},function(e,t){if("function"!=typeof t&&null!==t)throw TypeError("Class extends value "+String(t)+" is not a constructor or null");function r(){this.constructor=e}B(e,t),e.prototype=null===t?Object.create(t):(r.prototype=t.prototype,new r)}),er=function(e,t){var r,n,o,i,a={label:0,sent:function(){if(1&o[0])throw o[1];return o[1]},trys:[],ops:[]};return i={next:s(0),throw:s(1),return:s(2)},"function"==typeof Symbol&&(i[Symbol.iterator]=function(){return this}),i;function s(i){return function(s){return function(i){if(r)throw TypeError("Generator is already executing.");for(;a;)try{if(r=1,n&&(o=2&i[0]?n.return:i[0]?n.throw||((o=n.return)&&o.call(n),0):n.next)&&!(o=o.call(n,i[1])).done)return o;switch(n=0,o&&(i=[2&i[0],o.value]),i[0]){case 0:case 1:o=i;break;case 4:return a.label++,{value:i[1],done:!1};case 5:a.label++,n=i[1],i=[0];continue;case 7:i=a.ops.pop(),a.trys.pop();continue;default:if(!(o=(o=a.trys).length>0&&o[o.length-1])&&(6===i[0]||2===i[0])){a=0;continue}if(3===i[0]&&(!o||i[1]>o[0]&&i[1]<o[3])){a.label=i[1];break}if(6===i[0]&&a.label<o[1]){a.label=o[1],o=i;break}if(o&&a.label<o[2]){a.label=o[2],a.ops.push(i);break}o[2]&&a.ops.pop(),a.trys.pop();continue}i=t.call(e,a)}catch(e){i=[6,e],n=0}finally{r=o=0}if(5&i[0])throw i[1];return{value:i[0]?i[1]:void 0,done:!0}}([i,s])}}},en=function(e,t){for(var r=0,n=t.length,o=e.length;r<n;r++,o++)e[o]=t[r];return e},eo=Object.defineProperty,ei=Object.defineProperties,ea=Object.getOwnPropertyDescriptors,es=Object.getOwnPropertySymbols,eu=Object.prototype.hasOwnProperty,ec=Object.prototype.propertyIsEnumerable,el=function(e,t,r){return t in e?eo(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r},ef=function(e,t){for(var r in t||(t={}))eu.call(t,r)&&el(e,r,t[r]);if(es)for(var n=0,o=es(t);n<o.length;n++){var r=o[n];ec.call(t,r)&&el(e,r,t[r])}return e},ep=function(e,t){return ei(e,ea(t))},ed="undefined"!=typeof window&&window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__?window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__:function(){if(0!=arguments.length)return"object"==typeof arguments[0]?J.qC:J.qC.apply(null,arguments)};function eh(e,t){function r(){for(var r=[],n=0;n<arguments.length;n++)r[n]=arguments[n];if(t){var o=t.apply(void 0,r);if(!o)throw Error("prepareAction did not return an object");return ef(ef({type:e,payload:o.payload},"meta"in o&&{meta:o.meta}),"error"in o&&{error:o.error})}return{type:e,payload:r[0]}}return r.toString=function(){return""+e},r.type=e,r.match=function(t){return t.type===e},r}"undefined"!=typeof window&&window.__REDUX_DEVTOOLS_EXTENSION__&&window.__REDUX_DEVTOOLS_EXTENSION__;var em=function(e){function t(){for(var r=[],n=0;n<arguments.length;n++)r[n]=arguments[n];var o=e.apply(this,r)||this;return Object.setPrototypeOf(o,t.prototype),o}return et(t,e),Object.defineProperty(t,Symbol.species,{get:function(){return t},enumerable:!1,configurable:!0}),t.prototype.concat=function(){for(var t=[],r=0;r<arguments.length;r++)t[r]=arguments[r];return e.prototype.concat.apply(this,t)},t.prototype.prepend=function(){for(var e=[],r=0;r<arguments.length;r++)e[r]=arguments[r];return 1===e.length&&Array.isArray(e[0])?new(t.bind.apply(t,en([void 0],e[0].concat(this)))):new(t.bind.apply(t,en([void 0],e.concat(this))))},t}(Array),ev=function(e){function t(){for(var r=[],n=0;n<arguments.length;n++)r[n]=arguments[n];var o=e.apply(this,r)||this;return Object.setPrototypeOf(o,t.prototype),o}return et(t,e),Object.defineProperty(t,Symbol.species,{get:function(){return t},enumerable:!1,configurable:!0}),t.prototype.concat=function(){for(var t=[],r=0;r<arguments.length;r++)t[r]=arguments[r];return e.prototype.concat.apply(this,t)},t.prototype.prepend=function(){for(var e=[],r=0;r<arguments.length;r++)e[r]=arguments[r];return 1===e.length&&Array.isArray(e[0])?new(t.bind.apply(t,en([void 0],e[0].concat(this)))):new(t.bind.apply(t,en([void 0],e.concat(this))))},t}(Array);function ey(e){return i(e)?Z(e,function(){}):e}function eg(e){var t,r=function(e){var t,r,n,o;return void 0===(t=e)&&(t={}),n=void 0===(r=t.thunk)||r,t.immutableCheck,t.serializableCheck,t.actionCreatorCheck,o=new em,n&&("boolean"==typeof n?o.push(ee):o.push(ee.withExtraArgument(n.extraArgument))),o},n=e||{},o=n.reducer,i=void 0===o?void 0:o,a=n.middleware,s=void 0===a?r():a,u=n.devTools,c=void 0===u||u,l=n.preloadedState,f=void 0===l?void 0:l,p=n.enhancers,d=void 0===p?void 0:p;if("function"==typeof i)t=i;else if(function(e){if("object"!=typeof e||null===e)return!1;var t=Object.getPrototypeOf(e);if(null===t)return!0;for(var r=t;null!==Object.getPrototypeOf(r);)r=Object.getPrototypeOf(r);return t===r}(i))t=(0,J.UY)(i);else throw Error('"reducer" is a required argument, and must be a function or an object of functions that can be passed to combineReducers');var h=s;"function"==typeof h&&(h=h(r));var m=J.md.apply(void 0,h),v=J.qC;c&&(v=ed(ef({trace:!1},"object"==typeof c&&c)));var y=new ev(m),g=y;Array.isArray(d)?g=en([m],d):"function"==typeof d&&(g=d(y));var b=v.apply(void 0,g);return(0,J.MT)(t,f,b)}function eb(e){var t,r={},n=[],o={addCase:function(e,t){var n="string"==typeof e?e:e.type;if(!n)throw Error("`builder.addCase` cannot be called with an empty action type");if(n in r)throw Error("`builder.addCase` cannot be called with two reducers for the same action type");return r[n]=t,o},addMatcher:function(e,t){return n.push({matcher:e,reducer:t}),o},addDefaultCase:function(e){return t=e,o}};return e(o),[r,n,t]}function ex(e){var t,r=e.name;if(!r)throw Error("`name` is a required option for createSlice");var n="function"==typeof e.initialState?e.initialState:ey(e.initialState),a=e.reducers||{},s=Object.keys(a),u={},c={},l={};function f(){var t="function"==typeof e.extraReducers?eb(e.extraReducers):[e.extraReducers],r=t[0],a=t[1],s=void 0===a?[]:a,u=t[2],l=void 0===u?void 0:u,f=ef(ef({},void 0===r?{}:r),c);return function(e,t,r,n){void 0===r&&(r=[]);var a,s="function"==typeof t?eb(t):[t,r,void 0],u=s[0],c=s[1],l=s[2];if("function"==typeof e)a=function(){return ey(e())};else{var f=ey(e);a=function(){return f}}function p(e,t){void 0===e&&(e=a());var r=en([u[t.type]],c.filter(function(e){return(0,e.matcher)(t)}).map(function(e){return e.reducer}));return 0===r.filter(function(e){return!!e}).length&&(r=[l]),r.reduce(function(e,r){if(r){if(o(e)){var n=r(e,t);return void 0===n?e:n}if(i(e))return Z(e,function(e){return r(e,t)});var n=r(e,t);if(void 0===n){if(null===e)return e;throw Error("A case reducer on a non-draftable value must not return undefined")}return n}return e},e)}return p.getInitialState=a,p}(n,function(e){for(var t in f)e.addCase(t,f[t]);for(var r=0;r<s.length;r++){var n=s[r];e.addMatcher(n.matcher,n.reducer)}l&&e.addDefaultCase(l)})}return s.forEach(function(e){var t,n,o=a[e],i=r+"/"+e;"reducer"in o?(t=o.reducer,n=o.prepare):t=o,u[e]=t,c[i]=t,l[e]=n?eh(i,n):eh(i)}),{name:r,reducer:function(e,r){return t||(t=f()),t(e,r)},actions:l,caseReducers:u,getInitialState:function(){return t||(t=f()),t.getInitialState()}}}var e_=function(e){void 0===e&&(e=21);for(var t="",r=e;r--;)t+="ModuleSymbhasOwnPr-0123456789ABCDEFGHNRVfgctiUvz_KqYTJkLxpZXIjQW"[64*Math.random()|0];return t},ew=["name","message","stack","code"],eS=function(e,t){this.payload=e,this.meta=t},eO=function(e,t){this.payload=e,this.meta=t},eE=function(e){if("object"==typeof e&&null!==e){for(var t={},r=0;r<ew.length;r++){var n=ew[r];"string"==typeof e[n]&&(t[n]=e[n])}return t}return{message:String(e)}},eP=function(){function e(e,t,r){var n=eh(e+"/fulfilled",function(e,t,r,n){return{payload:e,meta:ep(ef({},n||{}),{arg:r,requestId:t,requestStatus:"fulfilled"})}}),o=eh(e+"/pending",function(e,t,r){return{payload:void 0,meta:ep(ef({},r||{}),{arg:t,requestId:e,requestStatus:"pending"})}}),i=eh(e+"/rejected",function(e,t,n,o,i){return{payload:o,error:(r&&r.serializeError||eE)(e||"Rejected"),meta:ep(ef({},i||{}),{arg:n,requestId:t,rejectedWithValue:!!o,requestStatus:"rejected",aborted:(null==e?void 0:e.name)==="AbortError",condition:(null==e?void 0:e.name)==="ConditionError"})}}),a="undefined"!=typeof AbortController?AbortController:function(){function e(){this.signal={aborted:!1,addEventListener:function(){},dispatchEvent:function(){return!1},onabort:function(){},removeEventListener:function(){},reason:void 0,throwIfAborted:function(){}}}return e.prototype.abort=function(){},e}();return Object.assign(function(e){return function(s,u,c){var l,f=(null==r?void 0:r.idGenerator)?r.idGenerator(e):e_(),p=new a;function d(e){l=e,p.abort()}var h=function(){var a,h;return a=this,h=function(){var a,h,m,v,y,g;return er(this,function(b){switch(b.label){case 0:var x;if(b.trys.push([0,4,,5]),!(null!==(x=v=null==(a=null==r?void 0:r.condition)?void 0:a.call(r,e,{getState:u,extra:c}))&&"object"==typeof x&&"function"==typeof x.then))return[3,2];return[4,v];case 1:v=b.sent(),b.label=2;case 2:if(!1===v||p.signal.aborted)throw{name:"ConditionError",message:"Aborted due to condition callback returning false."};return y=new Promise(function(e,t){return p.signal.addEventListener("abort",function(){return t({name:"AbortError",message:l||"Aborted"})})}),s(o(f,e,null==(h=null==r?void 0:r.getPendingMeta)?void 0:h.call(r,{requestId:f,arg:e},{getState:u,extra:c}))),[4,Promise.race([y,Promise.resolve(t(e,{dispatch:s,getState:u,extra:c,requestId:f,signal:p.signal,abort:d,rejectWithValue:function(e,t){return new eS(e,t)},fulfillWithValue:function(e,t){return new eO(e,t)}})).then(function(t){if(t instanceof eS)throw t;return t instanceof eO?n(t.payload,f,e,t.meta):n(t,f,e)})])];case 3:return m=b.sent(),[3,5];case 4:return m=(g=b.sent())instanceof eS?i(null,f,e,g.payload,g.meta):i(g,f,e),[3,5];case 5:return r&&!r.dispatchConditionRejection&&i.match(m)&&m.meta.condition||s(m),[2,m]}})},new Promise(function(e,t){var r=function(e){try{o(h.next(e))}catch(e){t(e)}},n=function(e){try{o(h.throw(e))}catch(e){t(e)}},o=function(t){return t.done?e(t.value):Promise.resolve(t.value).then(r,n)};o((h=h.apply(a,null)).next())})}();return Object.assign(h,{abort:d,requestId:f,arg:e,unwrap:function(){return h.then(ej)}})}},{pending:o,rejected:i,fulfilled:n,typePrefix:e})}return e.withTypes=function(){return e},e}();function ej(e){if(e.meta&&e.meta.rejectedWithValue)throw e.payload;if(e.error)throw e.error;return e.payload}var eR="listenerMiddleware";eh(eR+"/add"),eh(eR+"/removeAll"),eh(eR+"/remove"),"function"==typeof queueMicrotask&&queueMicrotask.bind("undefined"!=typeof window?window:void 0!==r.g?r.g:globalThis),"undefined"!=typeof window&&window.requestAnimationFrame&&window.requestAnimationFrame,function(){function e(e,t){var r=i[e];return r?r.enumerable=t:i[e]=r={configurable:!0,enumerable:t,get:function(){var t=this[N];return G.get(t,e)},set:function(t){var r=this[N];G.set(r,e,t)}},r}function t(e){for(var t=e.length-1;t>=0;t--){var o=e[t][N];if(!o.P)switch(o.i){case 5:n(o)&&T(o);break;case 4:r(o)&&T(o)}}}function r(e){for(var t=e.t,r=e.k,n=H(r),o=n.length-1;o>=0;o--){var i=n[o];if(i!==N){var a=t[i];if(void 0===a&&!u(t,i))return!0;var s=r[i],c=s&&s[N];if(c?c.t!==a:!l(s,a))return!0}}var f=!!t[N];return n.length!==H(t).length+(f?0:1)}function n(e){var t=e.k;if(t.length!==e.t.length)return!0;var r=Object.getOwnPropertyDescriptor(t,t.length-1);if(r&&!r.get)return!0;for(var n=0;n<t.length;n++)if(!t.hasOwnProperty(n))return!0;return!1}var i={};X.ES5||(X.ES5={J:function(t,r){var n=Array.isArray(t),o=function(t,r){if(t){for(var n=Array(r.length),o=0;o<r.length;o++)Object.defineProperty(n,""+o,e(o,!0));return n}var i=q(r);delete i[N];for(var a=H(i),s=0;s<a.length;s++){var u=a[s];i[u]=e(u,t||!!i[u].enumerable)}return Object.create(Object.getPrototypeOf(r),i)}(n,t),i={i:n?5:4,A:r?r.A:k,P:!1,I:!1,R:{},l:r,t:t,k:o,o:null,g:!1,C:!1};return Object.defineProperty(o,N,{value:i,writable:!0}),o},S:function(e,r,i){i?o(r)&&r[N].A===e&&t(e.p):(e.u&&function e(t){if(t&&"object"==typeof t){var r=t[N];if(r){var o=r.t,i=r.k,s=r.R,c=r.i;if(4===c)a(i,function(t){t!==N&&(void 0!==o[t]||u(o,t)?s[t]||e(i[t]):(s[t]=!0,T(r)))}),a(o,function(e){void 0!==i[e]||u(i,e)||(s[e]=!1,T(r))});else if(5===c){if(n(r)&&(T(r),s.length=!0),i.length<o.length)for(var l=i.length;l<o.length;l++)s[l]=!1;else for(var f=o.length;f<i.length;f++)s[f]=!0;for(var p=Math.min(i.length,o.length),d=0;d<p;d++)i.hasOwnProperty(d)||(s[d]=!0),void 0===s[d]&&e(i[d])}}}}(e.p[0]),t(e.p))},K:function(e){return 4===e.i?r(e):n(e)}})}()},55487:function(e,t,r){"use strict";var n=r(15241),o={childContextTypes:!0,contextType:!0,contextTypes:!0,defaultProps:!0,displayName:!0,getDefaultProps:!0,getDerivedStateFromError:!0,getDerivedStateFromProps:!0,mixins:!0,propTypes:!0,type:!0},i={name:!0,length:!0,prototype:!0,caller:!0,callee:!0,arguments:!0,arity:!0},a={$$typeof:!0,compare:!0,defaultProps:!0,displayName:!0,propTypes:!0,type:!0},s={};function u(e){return n.isMemo(e)?a:s[e.$$typeof]||o}s[n.ForwardRef]={$$typeof:!0,render:!0,defaultProps:!0,displayName:!0,propTypes:!0},s[n.Memo]=a;var c=Object.defineProperty,l=Object.getOwnPropertyNames,f=Object.getOwnPropertySymbols,p=Object.getOwnPropertyDescriptor,d=Object.getPrototypeOf,h=Object.prototype;e.exports=function e(t,r,n){if("string"!=typeof r){if(h){var o=d(r);o&&o!==h&&e(t,o,n)}var a=l(r);f&&(a=a.concat(f(r)));for(var s=u(t),m=u(r),v=0;v<a.length;++v){var y=a[v];if(!i[y]&&!(n&&n[y])&&!(m&&m[y])&&!(s&&s[y])){var g=p(r,y);try{c(t,y,g)}catch(e){}}}}return t}},54150:function(e,t){"use strict";/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var r="function"==typeof Symbol&&Symbol.for,n=r?Symbol.for("react.element"):60103,o=r?Symbol.for("react.portal"):60106,i=r?Symbol.for("react.fragment"):60107,a=r?Symbol.for("react.strict_mode"):60108,s=r?Symbol.for("react.profiler"):60114,u=r?Symbol.for("react.provider"):60109,c=r?Symbol.for("react.context"):60110,l=r?Symbol.for("react.async_mode"):60111,f=r?Symbol.for("react.concurrent_mode"):60111,p=r?Symbol.for("react.forward_ref"):60112,d=r?Symbol.for("react.suspense"):60113,h=r?Symbol.for("react.suspense_list"):60120,m=r?Symbol.for("react.memo"):60115,v=r?Symbol.for("react.lazy"):60116,y=r?Symbol.for("react.block"):60121,g=r?Symbol.for("react.fundamental"):60117,b=r?Symbol.for("react.responder"):60118,x=r?Symbol.for("react.scope"):60119;function _(e){if("object"==typeof e&&null!==e){var t=e.$$typeof;switch(t){case n:switch(e=e.type){case l:case f:case i:case s:case a:case d:return e;default:switch(e=e&&e.$$typeof){case c:case p:case v:case m:case u:return e;default:return t}}case o:return t}}}function w(e){return _(e)===f}t.AsyncMode=l,t.ConcurrentMode=f,t.ContextConsumer=c,t.ContextProvider=u,t.Element=n,t.ForwardRef=p,t.Fragment=i,t.Lazy=v,t.Memo=m,t.Portal=o,t.Profiler=s,t.StrictMode=a,t.Suspense=d,t.isAsyncMode=function(e){return w(e)||_(e)===l},t.isConcurrentMode=w,t.isContextConsumer=function(e){return _(e)===c},t.isContextProvider=function(e){return _(e)===u},t.isElement=function(e){return"object"==typeof e&&null!==e&&e.$$typeof===n},t.isForwardRef=function(e){return _(e)===p},t.isFragment=function(e){return _(e)===i},t.isLazy=function(e){return _(e)===v},t.isMemo=function(e){return _(e)===m},t.isPortal=function(e){return _(e)===o},t.isProfiler=function(e){return _(e)===s},t.isStrictMode=function(e){return _(e)===a},t.isSuspense=function(e){return _(e)===d},t.isValidElementType=function(e){return"string"==typeof e||"function"==typeof e||e===i||e===f||e===s||e===a||e===d||e===h||"object"==typeof e&&null!==e&&(e.$$typeof===v||e.$$typeof===m||e.$$typeof===u||e.$$typeof===c||e.$$typeof===p||e.$$typeof===g||e.$$typeof===b||e.$$typeof===x||e.$$typeof===y)},t.typeOf=_},15241:function(e,t,r){"use strict";e.exports=r(54150)},18788:function(e){e.exports={style:{fontFamily:"'__Inter_f367f3', '__Inter_Fallback_f367f3'",fontStyle:"normal"},className:"__className_f367f3"}},24033:function(e,t,r){e.exports=r(68165)},25566:function(e){var t,r,n,o=e.exports={};function i(){throw Error("setTimeout has not been defined")}function a(){throw Error("clearTimeout has not been defined")}function s(e){if(t===setTimeout)return setTimeout(e,0);if((t===i||!t)&&setTimeout)return t=setTimeout,setTimeout(e,0);try{return t(e,0)}catch(r){try{return t.call(null,e,0)}catch(r){return t.call(this,e,0)}}}!function(){try{t="function"==typeof setTimeout?setTimeout:i}catch(e){t=i}try{r="function"==typeof clearTimeout?clearTimeout:a}catch(e){r=a}}();var u=[],c=!1,l=-1;function f(){c&&n&&(c=!1,n.length?u=n.concat(u):l=-1,u.length&&p())}function p(){if(!c){var e=s(f);c=!0;for(var t=u.length;t;){for(n=u,u=[];++l<t;)n&&n[l].run();l=-1,t=u.length}n=null,c=!1,function(e){if(r===clearTimeout)return clearTimeout(e);if((r===a||!r)&&clearTimeout)return r=clearTimeout,clearTimeout(e);try{r(e)}catch(t){try{return r.call(null,e)}catch(t){return r.call(this,e)}}}(e)}}function d(e,t){this.fun=e,this.array=t}function h(){}o.nextTick=function(e){var t=Array(arguments.length-1);if(arguments.length>1)for(var r=1;r<arguments.length;r++)t[r-1]=arguments[r];u.push(new d(e,t)),1!==u.length||c||s(p)},d.prototype.run=function(){this.fun.apply(null,this.array)},o.title="browser",o.browser=!0,o.env={},o.argv=[],o.version="",o.versions={},o.on=h,o.addListener=h,o.once=h,o.off=h,o.removeListener=h,o.removeAllListeners=h,o.emit=h,o.prependListener=h,o.prependOnceListener=h,o.listeners=function(e){return[]},o.binding=function(e){throw Error("process.binding is not supported")},o.cwd=function(){return"/"},o.chdir=function(e){throw Error("process.chdir is not supported")},o.umask=function(){return 0}},8587:function(e,t,r){"use strict";r.d(t,{zt:function(){return m}});var n=r(26272),o=r(65401),i=r(54887);let a=function(e){e()},s=()=>a;var u=r(2265);let c=Symbol.for("react-redux-context"),l="undefined"!=typeof globalThis?globalThis:{},f=function(){var e;if(!u.createContext)return{};let t=null!=(e=l[c])?e:l[c]=new Map,r=t.get(u.createContext);return r||(r=u.createContext(null),t.set(u.createContext,r)),r}();r(55487),r(648);let p={notify(){},get:()=>[]},d=!!("undefined"!=typeof window&&void 0!==window.document&&void 0!==window.document.createElement),h=d?u.useLayoutEffect:u.useEffect;var m=function({store:e,context:t,children:r,serverState:n,stabilityCheck:o="once",noopCheck:i="once"}){let a=u.useMemo(()=>{let t=function(e,t){let r;let n=p,o=0,i=!1;function a(){l.onStateChange&&l.onStateChange()}function u(){o++,r||(r=t?t.addNestedSub(a):e.subscribe(a),n=function(){let e=s(),t=null,r=null;return{clear(){t=null,r=null},notify(){e(()=>{let e=t;for(;e;)e.callback(),e=e.next})},get(){let e=[],r=t;for(;r;)e.push(r),r=r.next;return e},subscribe(e){let n=!0,o=r={callback:e,next:null,prev:r};return o.prev?o.prev.next=o:t=o,function(){n&&null!==t&&(n=!1,o.next?o.next.prev=o.prev:r=o.prev,o.prev?o.prev.next=o.next:t=o.next)}}}}())}function c(){o--,r&&0===o&&(r(),r=void 0,n.clear(),n=p)}let l={addNestedSub:function(e){u();let t=n.subscribe(e),r=!1;return()=>{r||(r=!0,t(),c())}},notifyNestedSubs:function(){n.notify()},handleChangeWrapper:a,isSubscribed:function(){return i},trySubscribe:function(){i||(i=!0,u())},tryUnsubscribe:function(){i&&(i=!1,c())},getListeners:()=>n};return l}(e);return{store:e,subscription:t,getServerState:n?()=>n:void 0,stabilityCheck:o,noopCheck:i}},[e,n,o,i]),c=u.useMemo(()=>e.getState(),[e]);return h(()=>{let{subscription:t}=a;return t.onStateChange=t.notifyNestedSubs,t.trySubscribe(),c!==e.getState()&&t.notifyNestedSubs(),()=>{t.tryUnsubscribe(),t.onStateChange=void 0}},[a,c]),u.createElement((t||f).Provider,{value:a},r)};o.useSyncExternalStoreWithSelector,n.useSyncExternalStore,a=i.unstable_batchedUpdates},24471:function(e,t){"use strict";Symbol.for("react.element"),Symbol.for("react.portal"),Symbol.for("react.fragment"),Symbol.for("react.strict_mode"),Symbol.for("react.profiler"),Symbol.for("react.provider"),Symbol.for("react.context"),Symbol.for("react.server_context"),Symbol.for("react.forward_ref"),Symbol.for("react.suspense"),Symbol.for("react.suspense_list"),Symbol.for("react.memo"),Symbol.for("react.lazy"),Symbol.for("react.offscreen"),Symbol.for("react.module.reference")},648:function(e,t,r){"use strict";r(24471)},81267:function(e,t,r){"use strict";r.d(t,{_P:function(){return o},E7:function(){return a},ex:function(){return s},e:function(){return u},Nz:function(){return c},I2:function(){return i},OJ:function(){return b},p5:function(){return P}});var n="persist:",o="persist/FLUSH",i="persist/REHYDRATE",a="persist/PAUSE",s="persist/PERSIST",u="persist/PURGE",c="persist/REGISTER";function l(e){return(l="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function f(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),r.push.apply(r,n)}return r}function p(e,t,r,n){n.debug;var o=function(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?f(r,!0).forEach(function(t){var n;n=r[t],t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):f(r).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))})}return e}({},r);return e&&"object"===l(e)&&Object.keys(e).forEach(function(n){"_persist"!==n&&t[n]===r[n]&&(o[n]=e[n])}),o}function d(e){return JSON.stringify(e)}function h(e){var t,r=e.transforms||[],o="".concat(void 0!==e.keyPrefix?e.keyPrefix:n).concat(e.key),i=e.storage;return e.debug,t=!1===e.deserialize?function(e){return e}:"function"==typeof e.deserialize?e.deserialize:m,i.getItem(o).then(function(e){if(e)try{var n={},o=t(e);return Object.keys(o).forEach(function(e){n[e]=r.reduceRight(function(t,r){return r.out(t,e,o)},t(o[e]))}),n}catch(e){throw e}})}function m(e){return JSON.parse(e)}function v(e){}function y(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),r.push.apply(r,n)}return r}function g(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?y(r,!0).forEach(function(t){var n;n=r[t],t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):y(r).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))})}return e}function b(e,t){var r=void 0!==e.version?e.version:-1;e.debug;var c=void 0===e.stateReconciler?p:e.stateReconciler,l=e.getStoredState||h,f=void 0!==e.timeout?e.timeout:5e3,m=null,y=!1,b=!0,x=function(e){return e._persist.rehydrated&&m&&!b&&m.update(e),e};return function(p,h){var _,w,S=p||{},O=S._persist,E=function(e,t){if(null==e)return{};var r,n,o=function(e,t){if(null==e)return{};var r,n,o={},i=Object.keys(e);for(n=0;n<i.length;n++)r=i[n],t.indexOf(r)>=0||(o[r]=e[r]);return o}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(n=0;n<i.length;n++)r=i[n],!(t.indexOf(r)>=0)&&Object.prototype.propertyIsEnumerable.call(e,r)&&(o[r]=e[r])}return o}(S,["_persist"]);if(h.type===s){var P=!1,j=function(t,r){P||(h.rehydrate(e.key,t,r),P=!0)};if(f&&setTimeout(function(){P||j(void 0,Error('redux-persist: persist timed out for persist key "'.concat(e.key,'"')))},f),b=!1,m||(m=function(e){var t,r=e.blacklist||null,o=e.whitelist||null,i=e.transforms||[],a=e.throttle||0,s="".concat(void 0!==e.keyPrefix?e.keyPrefix:n).concat(e.key),u=e.storage;t=!1===e.serialize?function(e){return e}:"function"==typeof e.serialize?e.serialize:d;var c=e.writeFailHandler||null,l={},f={},p=[],h=null,m=null;function v(){if(0===p.length){h&&clearInterval(h),h=null;return}var e=p.shift(),r=i.reduce(function(t,r){return r.in(t,e,l)},l[e]);if(void 0!==r)try{f[e]=t(r)}catch(e){console.error("redux-persist/createPersistoid: error serializing state",e)}else delete f[e];0===p.length&&(Object.keys(f).forEach(function(e){void 0===l[e]&&delete f[e]}),m=u.setItem(s,t(f)).catch(g))}function y(e){return(!o||-1!==o.indexOf(e)||"_persist"===e)&&(!r||-1===r.indexOf(e))}function g(e){c&&c(e)}return{update:function(e){Object.keys(e).forEach(function(t){y(t)&&l[t]!==e[t]&&-1===p.indexOf(t)&&p.push(t)}),Object.keys(l).forEach(function(t){void 0===e[t]&&y(t)&&-1===p.indexOf(t)&&void 0!==l[t]&&p.push(t)}),null===h&&(h=setInterval(v,a)),l=e},flush:function(){for(;0!==p.length;)v();return m||Promise.resolve()}}}(e)),O)return g({},t(E,h),{_persist:O});if("function"!=typeof h.rehydrate||"function"!=typeof h.register)throw Error("redux-persist: either rehydrate or register is not a function on the PERSIST action. This can happen if the action is being replayed. This is an unexplored use case, please open an issue and we will figure out a resolution.");return h.register(e.key),l(e).then(function(t){(e.migrate||function(e,t){return Promise.resolve(e)})(t,r).then(function(e){j(e)},function(e){j(void 0,e)})},function(e){j(void 0,e)}),g({},t(E,h),{_persist:{version:r,rehydrated:!1}})}if(h.type===u)return y=!0,h.result((_=e.storage,w="".concat(void 0!==e.keyPrefix?e.keyPrefix:n).concat(e.key),_.removeItem(w,v))),g({},t(E,h),{_persist:O});if(h.type===o)return h.result(m&&m.flush()),g({},t(E,h),{_persist:O});if(h.type===a)b=!0;else if(h.type===i){if(y)return g({},E,{_persist:g({},O,{rehydrated:!0})});if(h.key===e.key){var R=t(E,h),A=h.payload;return x(g({},!1!==c&&void 0!==A?c(A,p,R,e):R,{_persist:g({},O,{rehydrated:!0})}))}}if(!O)return t(p,h);var T=t(E,h);return T===E?p:x(g({},T,{_persist:O}))}}var x=r(80263);function _(e){return function(e){if(Array.isArray(e)){for(var t=0,r=Array(e.length);t<e.length;t++)r[t]=e[t];return r}}(e)||function(e){if(Symbol.iterator in Object(e)||"[object Arguments]"===Object.prototype.toString.call(e))return Array.from(e)}(e)||function(){throw TypeError("Invalid attempt to spread non-iterable instance")}()}function w(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),r.push.apply(r,n)}return r}function S(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?w(r,!0).forEach(function(t){var n;n=r[t],t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):w(r).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))})}return e}var O={registry:[],bootstrapped:!1},E=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:O,t=arguments.length>1?arguments[1]:void 0;switch(t.type){case c:return S({},e,{registry:[].concat(_(e.registry),[t.key])});case i:var r=e.registry.indexOf(t.key),n=_(e.registry);return n.splice(r,1),S({},e,{registry:n,bootstrapped:0===n.length});default:return e}};function P(e,t,r){var n=r||!1,l=(0,x.MT)(E,O,t&&t.enhancer?t.enhancer:void 0),f=function(e){l.dispatch({type:c,key:e})},p=function(t,r,o){var a={type:i,payload:r,err:o,key:t};e.dispatch(a),l.dispatch(a),n&&d.getState().bootstrapped&&(n(),n=!1)},d=S({},l,{purge:function(){var t=[];return e.dispatch({type:u,result:function(e){t.push(e)}}),Promise.all(t)},flush:function(){var t=[];return e.dispatch({type:o,result:function(e){t.push(e)}}),Promise.all(t)},pause:function(){e.dispatch({type:a})},persist:function(){e.dispatch({type:s,register:f,rehydrate:p})}});return t&&t.manualPersist||d.persist(),d}},53837:function(e,t,r){"use strict";function n(e){return(n="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function o(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}function i(e){return(i=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function a(e){if(void 0===e)throw ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function s(e,t){return(s=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function u(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}r.d(t,{r:function(){return c}});var c=function(e){var t;function r(){!function(e,t){if(!(e instanceof t))throw TypeError("Cannot call a class as a function")}(this,r);for(var e,t,o,s=arguments.length,c=Array(s),l=0;l<s;l++)c[l]=arguments[l];return o=(e=(t=i(r)).call.apply(t,[this].concat(c)))&&("object"===n(e)||"function"==typeof e)?e:a(this),u(a(o),"state",{bootstrapped:!1}),u(a(o),"_unsubscribe",void 0),u(a(o),"handlePersistorState",function(){o.props.persistor.getState().bootstrapped&&(o.props.onBeforeLift?Promise.resolve(o.props.onBeforeLift()).finally(function(){return o.setState({bootstrapped:!0})}):o.setState({bootstrapped:!0}),o._unsubscribe&&o._unsubscribe())}),o}return!function(e,t){if("function"!=typeof t&&null!==t)throw TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&s(e,t)}(r,e),o(r.prototype,[{key:"componentDidMount",value:function(){this._unsubscribe=this.props.persistor.subscribe(this.handlePersistorState),this.handlePersistorState()}},{key:"componentWillUnmount",value:function(){this._unsubscribe&&this._unsubscribe()}},{key:"render",value:function(){return"function"==typeof this.props.children?this.props.children(this.state.bootstrapped):this.state.bootstrapped?this.props.children:this.props.loading}}]),t&&o(r,t),r}(r(2265).PureComponent);u(c,"defaultProps",{children:null,loading:null})},85456:function(e,t,r){"use strict";t.__esModule=!0,t.default=function(e){var t=(0,o.default)(e);return{getItem:function(e){return new Promise(function(r,n){r(t.getItem(e))})},setItem:function(e,r){return new Promise(function(n,o){n(t.setItem(e,r))})},removeItem:function(e){return new Promise(function(r,n){r(t.removeItem(e))})}}};var n,o=(n=r(70521))&&n.__esModule?n:{default:n}},70521:function(e,t){"use strict";function r(e){return(r="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function n(){}t.__esModule=!0,t.default=function(e){var t="".concat(e,"Storage");return!function(e){if(("undefined"==typeof self?"undefined":r(self))!=="object"||!(e in self))return!1;try{var t=self[e],n="redux-persist ".concat(e," test");t.setItem(n,"test"),t.getItem(n),t.removeItem(n)}catch(e){return!1}return!0}(t)?o:self[t]};var o={getItem:n,setItem:n,removeItem:n}},11850:function(e,t,r){"use strict";t.Z=void 0;var n,o=(0,((n=r(85456))&&n.__esModule?n:{default:n}).default)("local");t.Z=o},80263:function(e,t,r){"use strict";r.d(t,{md:function(){return d},UY:function(){return f},qC:function(){return p},MT:function(){return l}});var n=r(32899);function o(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),r.push.apply(r,n)}return r}function i(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?o(Object(r),!0).forEach(function(t){(0,n.Z)(e,t,r[t])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):o(Object(r)).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))})}return e}function a(e){return"Minified Redux error #"+e+"; visit https://redux.js.org/Errors?code="+e+" for the full message or use the non-minified dev environment for full errors. "}var s="function"==typeof Symbol&&Symbol.observable||"@@observable",u=function(){return Math.random().toString(36).substring(7).split("").join(".")},c={INIT:"@@redux/INIT"+u(),REPLACE:"@@redux/REPLACE"+u(),PROBE_UNKNOWN_ACTION:function(){return"@@redux/PROBE_UNKNOWN_ACTION"+u()}};function l(e,t,r){if("function"==typeof t&&"function"==typeof r||"function"==typeof r&&"function"==typeof arguments[3])throw Error(a(0));if("function"==typeof t&&void 0===r&&(r=t,t=void 0),void 0!==r){if("function"!=typeof r)throw Error(a(1));return r(l)(e,t)}if("function"!=typeof e)throw Error(a(2));var n,o=e,i=t,u=[],f=u,p=!1;function d(){f===u&&(f=u.slice())}function h(){if(p)throw Error(a(3));return i}function m(e){if("function"!=typeof e)throw Error(a(4));if(p)throw Error(a(5));var t=!0;return d(),f.push(e),function(){if(t){if(p)throw Error(a(6));t=!1,d();var r=f.indexOf(e);f.splice(r,1),u=null}}}function v(e){if(!function(e){if("object"!=typeof e||null===e)return!1;for(var t=e;null!==Object.getPrototypeOf(t);)t=Object.getPrototypeOf(t);return Object.getPrototypeOf(e)===t}(e))throw Error(a(7));if(void 0===e.type)throw Error(a(8));if(p)throw Error(a(9));try{p=!0,i=o(i,e)}finally{p=!1}for(var t=u=f,r=0;r<t.length;r++)(0,t[r])();return e}return v({type:c.INIT}),(n={dispatch:v,subscribe:m,getState:h,replaceReducer:function(e){if("function"!=typeof e)throw Error(a(10));o=e,v({type:c.REPLACE})}})[s]=function(){var e;return(e={subscribe:function(e){if("object"!=typeof e||null===e)throw Error(a(11));function t(){e.next&&e.next(h())}return t(),{unsubscribe:m(t)}}})[s]=function(){return this},e},n}function f(e){for(var t,r=Object.keys(e),n={},o=0;o<r.length;o++){var i=r[o];"function"==typeof e[i]&&(n[i]=e[i])}var s=Object.keys(n);try{!function(e){Object.keys(e).forEach(function(t){var r=e[t];if(void 0===r(void 0,{type:c.INIT}))throw Error(a(12));if(void 0===r(void 0,{type:c.PROBE_UNKNOWN_ACTION()}))throw Error(a(13))})}(n)}catch(e){t=e}return function(e,r){if(void 0===e&&(e={}),t)throw t;for(var o=!1,i={},u=0;u<s.length;u++){var c=s[u],l=n[c],f=e[c],p=l(f,r);if(void 0===p)throw r&&r.type,Error(a(14));i[c]=p,o=o||p!==f}return(o=o||s.length!==Object.keys(e).length)?i:e}}function p(){for(var e=arguments.length,t=Array(e),r=0;r<e;r++)t[r]=arguments[r];return 0===t.length?function(e){return e}:1===t.length?t[0]:t.reduce(function(e,t){return function(){return e(t.apply(void 0,arguments))}})}function d(){for(var e=arguments.length,t=Array(e),r=0;r<e;r++)t[r]=arguments[r];return function(e){return function(){var r=e.apply(void 0,arguments),n=function(){throw Error(a(15))},o={getState:r.getState,dispatch:function(){return n.apply(void 0,arguments)}},s=t.map(function(e){return e(o)});return n=p.apply(void 0,s)(r.dispatch),i(i({},r),{},{dispatch:n})}}}},99808:function(e,t,r){"use strict";/**
 * @license React
 * use-sync-external-store-shim.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var n=r(2265),o="function"==typeof Object.is?Object.is:function(e,t){return e===t&&(0!==e||1/e==1/t)||e!=e&&t!=t},i=n.useState,a=n.useEffect,s=n.useLayoutEffect,u=n.useDebugValue;function c(e){var t=e.getSnapshot;e=e.value;try{var r=t();return!o(e,r)}catch(e){return!0}}var l="undefined"==typeof window||void 0===window.document||void 0===window.document.createElement?function(e,t){return t()}:function(e,t){var r=t(),n=i({inst:{value:r,getSnapshot:t}}),o=n[0].inst,l=n[1];return s(function(){o.value=r,o.getSnapshot=t,c(o)&&l({inst:o})},[e,r,t]),a(function(){return c(o)&&l({inst:o}),e(function(){c(o)&&l({inst:o})})},[e]),u(r),r};t.useSyncExternalStore=void 0!==n.useSyncExternalStore?n.useSyncExternalStore:l},53176:function(e,t,r){"use strict";/**
 * @license React
 * use-sync-external-store-shim/with-selector.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var n=r(2265),o=r(26272),i="function"==typeof Object.is?Object.is:function(e,t){return e===t&&(0!==e||1/e==1/t)||e!=e&&t!=t},a=o.useSyncExternalStore,s=n.useRef,u=n.useEffect,c=n.useMemo,l=n.useDebugValue;t.useSyncExternalStoreWithSelector=function(e,t,r,n,o){var f=s(null);if(null===f.current){var p={hasValue:!1,value:null};f.current=p}else p=f.current;f=c(function(){function e(e){if(!u){if(u=!0,a=e,e=n(e),void 0!==o&&p.hasValue){var t=p.value;if(o(t,e))return s=t}return s=e}if(t=s,i(a,e))return t;var r=n(e);return void 0!==o&&o(t,r)?(a=e,t):(a=e,s=r)}var a,s,u=!1,c=void 0===r?null:r;return[function(){return e(t())},null===c?void 0:function(){return e(c())}]},[t,r,n,o]);var d=a(e,f[0],f[1]);return u(function(){p.hasValue=!0,p.value=d},[d]),l(d),d}},26272:function(e,t,r){"use strict";e.exports=r(99808)},65401:function(e,t,r){"use strict";e.exports=r(53176)},32899:function(e,t,r){"use strict";r.d(t,{Z:function(){return o}});var n=r(60075);function o(e,t,r){var o;return(o=function(e,t){if("object"!=(0,n.Z)(e)||!e)return e;var r=e[Symbol.toPrimitive];if(void 0!==r){var o=r.call(e,t||"default");if("object"!=(0,n.Z)(o))return o;throw TypeError("@@toPrimitive must return a primitive value.")}return("string"===t?String:Number)(e)}(t,"string"),(t="symbol"==(0,n.Z)(o)?o:o+"")in e)?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}},60075:function(e,t,r){"use strict";function n(e){return(n="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}r.d(t,{Z:function(){return n}})},78180:function(e,t,r){"use strict";r.d(t,{bL:function(){return O}});var n=r(2265);let o=`#version 300 es
precision mediump float;

layout(location = 0) in vec4 a_position;

uniform vec2 u_resolution;
uniform float u_pixelRatio;
uniform float u_imageAspectRatio;

uniform float u_originX;
uniform float u_originY;
uniform float u_worldWidth;
uniform float u_worldHeight;
uniform float u_fit;

uniform float u_scale;
uniform float u_rotation;
uniform float u_offsetX;
uniform float u_offsetY;

uniform float u_pxSize;

out vec2 v_objectUV;
out vec2 v_objectBoxSize;
out vec2 v_objectHelperBox;

out vec2 v_responsiveUV;
out vec2 v_responsiveBoxSize;
out vec2 v_responsiveHelperBox;
out vec2 v_responsiveBoxGivenSize;

out vec2 v_patternUV;
out vec2 v_patternBoxSize;
out vec2 v_patternHelperBox;

out vec2 v_imageUV;

// #define ADD_HELPERS

vec3 getBoxSize(float boxRatio, vec2 givenBoxSize) {
  vec2 box = vec2(0.);
  // fit = none
  box.x = boxRatio * min(givenBoxSize.x / boxRatio, givenBoxSize.y);
  float noFitBoxWidth = box.x;
  if (u_fit == 1.) { // fit = contain
    box.x = boxRatio * min(u_resolution.x / boxRatio, u_resolution.y);
  } else if (u_fit == 2.) { // fit = cover
    box.x = boxRatio * max(u_resolution.x / boxRatio, u_resolution.y);
  }
  box.y = box.x / boxRatio;
  return vec3(box, noFitBoxWidth);
}

void main() {
  gl_Position = a_position;

  vec2 uv = gl_Position.xy * .5;
  vec2 boxOrigin = vec2(.5 - u_originX, u_originY - .5);
  vec2 givenBoxSize = vec2(u_worldWidth, u_worldHeight);
  givenBoxSize = max(givenBoxSize, vec2(1.)) * u_pixelRatio;
  float r = u_rotation * 3.14159265358979323846 / 180.;
  mat2 graphicRotation = mat2(cos(r), sin(r), -sin(r), cos(r));
  vec2 graphicOffset = vec2(-u_offsetX, u_offsetY);


  // ===================================================
  // Sizing api for graphic objects with fixed ratio
  // (currently supports only ratio = 1)

  float fixedRatio = 1.;
  vec2 fixedRatioBoxGivenSize = vec2(
  (u_worldWidth == 0.) ? u_resolution.x : givenBoxSize.x,
  (u_worldHeight == 0.) ? u_resolution.y : givenBoxSize.y
  );

  v_objectBoxSize = getBoxSize(fixedRatio, fixedRatioBoxGivenSize).xy;
  vec2 objectWorldScale = u_resolution.xy / v_objectBoxSize;

  #ifdef ADD_HELPERS
  v_objectHelperBox = uv;
  v_objectHelperBox *= objectWorldScale;
  v_objectHelperBox += boxOrigin * (objectWorldScale - 1.);
  #endif

  v_objectUV = uv;
  v_objectUV *= objectWorldScale;
  v_objectUV += boxOrigin * (objectWorldScale - 1.);
  v_objectUV += graphicOffset;
  v_objectUV /= u_scale;
  v_objectUV = graphicRotation * v_objectUV;


  // ===================================================


  // ===================================================
  // Sizing api for graphic objects with either givenBoxSize ratio or canvas ratio.
  // Full-screen mode available with u_worldWidth = u_worldHeight = 0

  v_responsiveBoxGivenSize = vec2(
  (u_worldWidth == 0.) ? u_resolution.x : givenBoxSize.x,
  (u_worldHeight == 0.) ? u_resolution.y : givenBoxSize.y
  );
  float responsiveRatio = v_responsiveBoxGivenSize.x / v_responsiveBoxGivenSize.y;
  v_responsiveBoxSize = getBoxSize(responsiveRatio, v_responsiveBoxGivenSize).xy;
  vec2 responsiveBoxScale = u_resolution.xy / v_responsiveBoxSize;

  #ifdef ADD_HELPERS
  v_responsiveHelperBox = uv;
  v_responsiveHelperBox *= responsiveBoxScale;
  v_responsiveHelperBox += boxOrigin * (responsiveBoxScale - 1.);
  #endif

  v_responsiveUV = uv;
  v_responsiveUV *= responsiveBoxScale;
  v_responsiveUV += boxOrigin * (responsiveBoxScale - 1.);
  v_responsiveUV += graphicOffset;
  v_responsiveUV /= u_scale;
  v_responsiveUV.x *= responsiveRatio;
  v_responsiveUV = graphicRotation * v_responsiveUV;
  v_responsiveUV.x /= responsiveRatio;

  // ===================================================


  // ===================================================
  // Sizing api for patterns
  // (treating graphics as a image u_worldWidth x u_worldHeight size)

  float patternBoxRatio = givenBoxSize.x / givenBoxSize.y;
  vec2 patternBoxGivenSize = vec2(
  (u_worldWidth == 0.) ? u_resolution.x : givenBoxSize.x,
  (u_worldHeight == 0.) ? u_resolution.y : givenBoxSize.y
  );
  patternBoxRatio = patternBoxGivenSize.x / patternBoxGivenSize.y;

  vec3 boxSizeData = getBoxSize(patternBoxRatio, patternBoxGivenSize);
  v_patternBoxSize = boxSizeData.xy;
  float patternBoxNoFitBoxWidth = boxSizeData.z;
  vec2 patternBoxScale = u_resolution.xy / v_patternBoxSize;

  #ifdef ADD_HELPERS
  v_patternHelperBox = uv;
  v_patternHelperBox *= patternBoxScale;
  v_patternHelperBox += boxOrigin * (patternBoxScale - 1.);
  #endif

  v_patternUV = uv;
  v_patternUV += graphicOffset / patternBoxScale;
  v_patternUV += boxOrigin;
  v_patternUV -= boxOrigin / patternBoxScale;
  v_patternUV *= u_resolution.xy;
  v_patternUV /= u_pixelRatio;
  if (u_fit > 0.) {
    v_patternUV *= (patternBoxNoFitBoxWidth / v_patternBoxSize.x);
  }
  v_patternUV /= u_scale;
  v_patternUV = graphicRotation * v_patternUV;
  v_patternUV += boxOrigin / patternBoxScale;
  v_patternUV -= boxOrigin;
  // x100 is a default multiplier between vertex and fragmant shaders
  // we use it to avoid UV presision issues
  v_patternUV *= .01;

  // ===================================================


  // ===================================================
  // Sizing api for images

  vec2 imageBoxSize;
  if (u_fit == 1.) { // contain
    imageBoxSize.x = min(u_resolution.x / u_imageAspectRatio, u_resolution.y) * u_imageAspectRatio;
  } else if (u_fit == 2.) { // cover
    imageBoxSize.x = max(u_resolution.x / u_imageAspectRatio, u_resolution.y) * u_imageAspectRatio;
  } else {
    imageBoxSize.x = min(10.0, 10.0 / u_imageAspectRatio * u_imageAspectRatio);
  }
  imageBoxSize.y = imageBoxSize.x / u_imageAspectRatio;
  vec2 imageBoxScale = u_resolution.xy / imageBoxSize;

  #ifdef ADD_HELPERS
  vec2 imageHelperBox = uv;
  imageHelperBox *= imageBoxScale;
  imageHelperBox += boxOrigin * (imageBoxScale - 1.);
  #endif

  v_imageUV = uv;
  v_imageUV *= imageBoxScale;
  v_imageUV += boxOrigin * (imageBoxScale - 1.);
  v_imageUV += graphicOffset;
  v_imageUV /= u_scale;
  v_imageUV.x *= u_imageAspectRatio;
  v_imageUV = graphicRotation * v_imageUV;
  v_imageUV.x /= u_imageAspectRatio;

  v_imageUV += .5;
  v_imageUV.y = 1. - v_imageUV.y;

  // ===================================================

}`,i=8294400;class a{parentElement;canvasElement;gl;program=null;uniformLocations={};fragmentShader;rafId=null;lastRenderTime=0;currentFrame=0;speed=0;providedUniforms;hasBeenDisposed=!1;resolutionChanged=!0;textures=new Map;minPixelRatio;maxPixelCount;isSafari=(function(){let e=navigator.userAgent.toLowerCase();return e.includes("safari")&&!e.includes("chrome")&&!e.includes("android")})();uniformCache={};textureUnitMap=new Map;constructor(e,t,r,n,o=0,a=0,s=2,c=i){if(e instanceof HTMLElement)this.parentElement=e;else throw Error("Paper Shaders: parent element must be an HTMLElement");if(!document.querySelector("style[data-paper-shader]")){let e=document.createElement("style");e.innerHTML=u,e.setAttribute("data-paper-shader",""),document.head.prepend(e)}let l=document.createElement("canvas");this.canvasElement=l,this.parentElement.prepend(l),this.fragmentShader=t,this.providedUniforms=r,this.currentFrame=a,this.minPixelRatio=s,this.maxPixelCount=c;let f=l.getContext("webgl2",n);if(!f)throw Error("Paper Shaders: WebGL is not supported in this browser");this.gl=f,this.initProgram(),this.setupPositionAttribute(),this.setupUniforms(),this.setUniformValues(this.providedUniforms),this.setupResizeObserver(),this.setSpeed(o),this.parentElement.setAttribute("data-paper-shader",""),this.parentElement.paperShaderMount=this}initProgram=()=>{let e=function(e,t,r){let n=e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT),o=n?n.precision:null;o&&o<23&&(t=t.replace(/precision\s+(lowp|mediump)\s+float;/g,"precision highp float;"),r=r.replace(/precision\s+(lowp|mediump)\s+float/g,"precision highp float").replace(/\b(uniform|varying|attribute)\s+(lowp|mediump)\s+(\w+)/g,"$1 highp $3"));let i=s(e,e.VERTEX_SHADER,t),a=s(e,e.FRAGMENT_SHADER,r);if(!i||!a)return null;let u=e.createProgram();return u?(e.attachShader(u,i),e.attachShader(u,a),e.linkProgram(u),e.getProgramParameter(u,e.LINK_STATUS))?(e.detachShader(u,i),e.detachShader(u,a),e.deleteShader(i),e.deleteShader(a),u):(console.error("Unable to initialize the shader program: "+e.getProgramInfoLog(u)),e.deleteProgram(u),e.deleteShader(i),e.deleteShader(a),null):null}(this.gl,o,this.fragmentShader);e&&(this.program=e)};setupPositionAttribute=()=>{let e=this.gl.getAttribLocation(this.program,"a_position"),t=this.gl.createBuffer();this.gl.bindBuffer(this.gl.ARRAY_BUFFER,t),this.gl.bufferData(this.gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),this.gl.STATIC_DRAW),this.gl.enableVertexAttribArray(e),this.gl.vertexAttribPointer(e,2,this.gl.FLOAT,!1,0,0)};setupUniforms=()=>{let e={u_time:this.gl.getUniformLocation(this.program,"u_time"),u_pixelRatio:this.gl.getUniformLocation(this.program,"u_pixelRatio"),u_resolution:this.gl.getUniformLocation(this.program,"u_resolution")};Object.entries(this.providedUniforms).forEach(([t,r])=>{if(e[t]=this.gl.getUniformLocation(this.program,t),r instanceof HTMLImageElement){let r=`${t}AspectRatio`;e[r]=this.gl.getUniformLocation(this.program,r)}}),this.uniformLocations=e};renderScale=1;parentWidth=0;parentHeight=0;resizeObserver=null;setupResizeObserver=()=>{this.resizeObserver=new ResizeObserver(([e])=>{e?.borderBoxSize[0]&&(this.parentWidth=e.borderBoxSize[0].inlineSize,this.parentHeight=e.borderBoxSize[0].blockSize),this.handleResize()}),this.resizeObserver.observe(this.parentElement),visualViewport?.addEventListener("resize",this.handleVisualViewportChange);let e=this.parentElement.getBoundingClientRect();this.parentWidth=e.width,this.parentHeight=e.height,this.handleResize()};resizeRafId=null;handleVisualViewportChange=()=>{null!==this.resizeRafId&&cancelAnimationFrame(this.resizeRafId),this.resizeRafId=requestAnimationFrame(()=>{this.resizeRafId=requestAnimationFrame(()=>{this.handleResize()})})};handleResize=()=>{null!==this.resizeRafId&&cancelAnimationFrame(this.resizeRafId);let e=visualViewport?.scale??1,t=window.innerWidth-document.documentElement.clientWidth,r=visualViewport?visualViewport.scale*visualViewport.width+t:window.innerWidth,n=Math.round(1e4*window.outerWidth/r)/1e4,o=this.isSafari?devicePixelRatio:devicePixelRatio/n,i=Math.max(o,this.minPixelRatio),a=i*n*e,s=this.parentWidth*a,u=this.parentHeight*a,c=Math.sqrt(this.maxPixelCount)/Math.sqrt(s*u),l=a*Math.min(1,c),f=Math.round(this.parentWidth*l),p=Math.round(this.parentHeight*l);(this.canvasElement.width!==f||this.canvasElement.height!==p||this.renderScale!==l)&&(this.renderScale=l,this.canvasElement.width=f,this.canvasElement.height=p,this.resolutionChanged=!0,this.gl.viewport(0,0,this.gl.canvas.width,this.gl.canvas.height),this.render(performance.now()))};render=e=>{if(this.hasBeenDisposed)return;if(null===this.program){console.warn("Tried to render before program or gl was initialized");return}let t=e-this.lastRenderTime;this.lastRenderTime=e,0!==this.speed&&(this.currentFrame+=t*this.speed),this.gl.clear(this.gl.COLOR_BUFFER_BIT),this.gl.useProgram(this.program),this.gl.uniform1f(this.uniformLocations.u_time,.001*this.currentFrame),this.resolutionChanged&&(this.gl.uniform2f(this.uniformLocations.u_resolution,this.gl.canvas.width,this.gl.canvas.height),this.gl.uniform1f(this.uniformLocations.u_pixelRatio,this.renderScale),this.resolutionChanged=!1),this.gl.drawArrays(this.gl.TRIANGLES,0,6),0!==this.speed?this.requestRender():this.rafId=null};requestRender=()=>{null!==this.rafId&&cancelAnimationFrame(this.rafId),this.rafId=requestAnimationFrame(this.render)};setTextureUniform=(e,t)=>{if(!t.complete||0===t.naturalWidth)throw Error(`Paper Shaders: image for uniform ${e} must be fully loaded`);let r=this.textures.get(e);r&&this.gl.deleteTexture(r),this.textureUnitMap.has(e)||this.textureUnitMap.set(e,this.textureUnitMap.size);let n=this.textureUnitMap.get(e);this.gl.activeTexture(this.gl.TEXTURE0+n);let o=this.gl.createTexture();this.gl.bindTexture(this.gl.TEXTURE_2D,o),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_S,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_T,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MIN_FILTER,this.gl.LINEAR),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MAG_FILTER,this.gl.LINEAR),this.gl.texImage2D(this.gl.TEXTURE_2D,0,this.gl.RGBA,this.gl.RGBA,this.gl.UNSIGNED_BYTE,t);let i=this.gl.getError();if(i!==this.gl.NO_ERROR||null===o){console.error("Paper Shaders: WebGL error when uploading texture:",i);return}this.textures.set(e,o);let a=this.uniformLocations[e];if(a){this.gl.uniform1i(a,n);let r=`${e}AspectRatio`,o=this.uniformLocations[r];if(o){let e=t.naturalWidth/t.naturalHeight;this.gl.uniform1f(o,e)}}};areUniformValuesEqual=(e,t)=>e===t||!!(Array.isArray(e)&&Array.isArray(t))&&e.length===t.length&&e.every((e,r)=>this.areUniformValuesEqual(e,t[r]));setUniformValues=e=>{this.gl.useProgram(this.program),Object.entries(e).forEach(([e,t])=>{let r=t;if(t instanceof HTMLImageElement&&(r=`${t.src.slice(0,200)}|${t.naturalWidth}x${t.naturalHeight}`),this.areUniformValuesEqual(this.uniformCache[e],r))return;this.uniformCache[e]=r;let n=this.uniformLocations[e];if(!n){console.warn(`Uniform location for ${e} not found`);return}if(t instanceof HTMLImageElement)this.setTextureUniform(e,t);else if(Array.isArray(t)){let r=null,o=null;if(void 0!==t[0]&&Array.isArray(t[0])){let n=t[0].length;if(t.every(e=>e.length===n))r=t.flat(),o=n;else{console.warn(`All child arrays must be the same length for ${e}`);return}}else o=(r=t).length;switch(o){case 2:this.gl.uniform2fv(n,r);break;case 3:this.gl.uniform3fv(n,r);break;case 4:this.gl.uniform4fv(n,r);break;case 9:this.gl.uniformMatrix3fv(n,!1,r);break;case 16:this.gl.uniformMatrix4fv(n,!1,r);break;default:console.warn(`Unsupported uniform array length: ${o}`)}}else"number"==typeof t?this.gl.uniform1f(n,t):"boolean"==typeof t?this.gl.uniform1i(n,t?1:0):console.warn(`Unsupported uniform type for ${e}: ${typeof t}`)})};getCurrentFrame=()=>this.currentFrame;setFrame=e=>{this.currentFrame=e,this.lastRenderTime=performance.now(),this.render(performance.now())};setSpeed=(e=1)=>{this.speed=e,null===this.rafId&&0!==e&&(this.lastRenderTime=performance.now(),this.rafId=requestAnimationFrame(this.render)),null!==this.rafId&&0===e&&(cancelAnimationFrame(this.rafId),this.rafId=null)};setMaxPixelCount=(e=i)=>{this.maxPixelCount=e,this.handleResize()};setMinPixelRatio=(e=2)=>{this.minPixelRatio=e,this.handleResize()};setUniforms=e=>{this.setUniformValues(e),this.providedUniforms={...this.providedUniforms,...e},this.render(performance.now())};dispose=()=>{this.hasBeenDisposed=!0,null!==this.rafId&&(cancelAnimationFrame(this.rafId),this.rafId=null),this.gl&&this.program&&(this.textures.forEach(e=>{this.gl.deleteTexture(e)}),this.textures.clear(),this.gl.deleteProgram(this.program),this.program=null,this.gl.bindBuffer(this.gl.ARRAY_BUFFER,null),this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER,null),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,null),this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,null),this.gl.getError()),this.resizeObserver&&(this.resizeObserver.disconnect(),this.resizeObserver=null),visualViewport?.removeEventListener("resize",this.handleVisualViewportChange),this.uniformLocations={},this.parentElement.paperShaderMount=void 0}}function s(e,t,r){let n=e.createShader(t);return n?(e.shaderSource(n,r),e.compileShader(n),e.getShaderParameter(n,e.COMPILE_STATUS))?n:(console.error("An error occurred compiling the shaders: "+e.getShaderInfoLog(n)),e.deleteShader(n),null):null}let u=`@layer paper-shaders {
  :where([data-paper-shader]) {
    isolation: isolate;
    position: relative;

    & canvas {
      contain: strict;
      display: block;
      position: absolute;
      inset: 0;
      z-index: -1;
      width: 100%;
      height: 100%;
      border-radius: inherit;
      corner-shape: inherit;
    }
  }
}`;var c=r(57437);async function l(e){let t={},r=[],n=e=>{try{if(e.startsWith("/"))return!0;return new URL(e),!0}catch{return!1}},o=e=>{try{if(e.startsWith("/"))return!1;let t=new URL(e,window.location.origin);return t.origin!==window.location.origin}catch{return!1}};return Object.entries(e).forEach(([e,i])=>{if("string"==typeof i){if(!n(i)){console.warn(`Uniform "${e}" has invalid URL "${i}". Skipping image loading.`);return}let a=new Promise((r,n)=>{let a=new Image;o(i)&&(a.crossOrigin="anonymous"),a.onload=()=>{t[e]=a,r()},a.onerror=()=>{console.error(`Could not set uniforms. Failed to load image at ${i}`),n()},a.src=i});r.push(a)}else t[e]=i}),await Promise.all(r),t}let f=(0,n.forwardRef)(function({fragmentShader:e,uniforms:t,webGlContextAttributes:r,speed:o=0,frame:i=0,minPixelRatio:s,maxPixelCount:u,...f},p){let[d,h]=(0,n.useState)(!1),m=(0,n.useRef)(null),v=(0,n.useRef)(null);(0,n.useEffect)(()=>{let n=async()=>{let n=await l(t);m.current&&!v.current&&(v.current=new a(m.current,e,n,r,o,i,s,u),h(!0))};return n(),()=>{v.current?.dispose(),v.current=null}},[e,r]),(0,n.useEffect)(()=>{let e=async()=>{let e=await l(t);v.current?.setUniforms(e)};e()},[t,d]),(0,n.useEffect)(()=>{v.current?.setSpeed(o)},[o,d]),(0,n.useEffect)(()=>{v.current?.setMaxPixelCount(u)},[u,d]),(0,n.useEffect)(()=>{v.current?.setMinPixelRatio(s)},[s,d]),(0,n.useEffect)(()=>{v.current?.setFrame(i)},[i,d]);let y=function(e){let t=n.useRef(void 0),r=n.useCallback(t=>{let r=e.map(e=>{if(null!=e){if("function"==typeof e){let r=e(t);return"function"==typeof r?r:()=>{e(null)}}return e.current=t,()=>{e.current=null}}});return()=>{r.forEach(e=>e?.())}},e);return n.useMemo(()=>e.every(e=>null==e)?null:e=>{t.current&&(t.current(),t.current=void 0),null!=e&&(t.current=r(e))},e)}([m,p]);return(0,c.jsx)("div",{ref:y,...f})});f.displayName="ShaderMount";let p=`
in vec2 v_objectUV;
in vec2 v_responsiveUV;
in vec2 v_responsiveBoxGivenSize;
in vec2 v_patternUV;
in vec2 v_imageUV;`,d={fit:"contain",scale:1,rotation:0,offsetX:0,offsetY:0,originX:.5,originY:.5,worldWidth:0,worldHeight:0},h={none:0,contain:1,cover:2};function m(e){if(Array.isArray(e))return 4===e.length?e:3===e.length?[...e,1]:y;if("string"!=typeof e)return y;let t,r,n,o=1;if(e.startsWith("#"))[t,r,n,o]=function(e){3===(e=e.replace(/^#/,"")).length&&(e=e.split("").map(e=>e+e).join("")),6===e.length&&(e+="ff");let t=parseInt(e.slice(0,2),16)/255,r=parseInt(e.slice(2,4),16)/255,n=parseInt(e.slice(4,6),16)/255,o=parseInt(e.slice(6,8),16)/255;return[t,r,n,o]}(e);else if(e.startsWith("rgb"))[t,r,n,o]=function(e){let t=e.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([0-9.]+))?\s*\)$/i);return t?[parseInt(t[1]??"0")/255,parseInt(t[2]??"0")/255,parseInt(t[3]??"0")/255,void 0===t[4]?1:parseFloat(t[4])]:[0,0,0,1]}(e);else{if(!e.startsWith("hsl"))return console.error("Unsupported color format",e),y;[t,r,n,o]=function(e){let t,r,n;let[o,i,a,s]=e,u=o/360,c=i/100,l=a/100;if(0===i)t=r=n=l;else{let e=(e,t,r)=>(r<0&&(r+=1),r>1&&(r-=1),r<1/6)?e+(t-e)*6*r:r<.5?t:r<2/3?e+(t-e)*(2/3-r)*6:e,o=l<.5?l*(1+c):l+c-l*c,i=2*l-o;t=e(i,o,u+1/3),r=e(i,o,u),n=e(i,o,u-1/3)}return[t,r,n,s]}(function(e){let t=e.match(/^hsla?\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*([0-9.]+))?\s*\)$/i);return t?[parseInt(t[1]??"0"),parseInt(t[2]??"0"),parseInt(t[3]??"0"),void 0===t[4]?1:parseFloat(t[4])]:[0,0,0,1]}(e))}return[v(t,0,1),v(r,0,1),v(n,0,1),v(o,0,1)]}let v=(e,t,r)=>Math.min(Math.max(e,t),r),y=[0,0,0,1],g=`
#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846
`,b=`
vec2 rotate(vec2 uv, float th) {
  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}
`,x=`
  color += 1. / 256. * (fract(sin(dot(.014 * gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453123) - .5);
`,_={maxColorCount:10},w=`#version 300 es
precision mediump float;

uniform float u_time;

uniform vec4 u_colors[${_.maxColorCount}];
uniform float u_colorsCount;

uniform float u_distortion;
uniform float u_swirl;

${p}

out vec4 fragColor;

${g}
${b}

vec2 getPosition(int i, float t) {
  float a = float(i) * .37;
  float b = .6 + mod(float(i), 3.) * .3;
  float c = .8 + mod(float(i + 1), 4.) * 0.25;

  float x = sin(t * b + a);
  float y = cos(t * c + a * 1.5);

  return .5 + .5 * vec2(x, y);
}

void main() {
  vec2 shape_uv = v_objectUV;

  shape_uv += .5;

  float t = .5 * u_time;

  float radius = smoothstep(0., 1., length(shape_uv - .5));
  float center = 1. - radius;
  for (float i = 1.; i <= 2.; i++) {
    shape_uv.x += u_distortion * center / i * sin(t + i * .4 * smoothstep(.0, 1., shape_uv.y)) * cos(.2 * t + i * 2.4 * smoothstep(.0, 1., shape_uv.y));
    shape_uv.y += u_distortion * center / i * cos(t + i * 2. * smoothstep(.0, 1., shape_uv.x));
  }

  vec2 uvRotated = shape_uv;
  uvRotated -= vec2(.5);
  float angle = 3. * u_swirl * radius;
  uvRotated = rotate(uvRotated, -angle);
  uvRotated += vec2(.5);

  vec3 color = vec3(0.);
  float opacity = 0.;
  float totalWeight = 0.;

  for (int i = 0; i < ${_.maxColorCount}; i++) {
    if (i >= int(u_colorsCount)) break;

    vec2 pos = getPosition(i, t);
    vec3 colorFraction = u_colors[i].rgb * u_colors[i].a;
    float opacityFraction = u_colors[i].a;

    float dist = length(uvRotated - pos);

    dist = pow(dist, 3.5);
    float weight = 1. / (dist + 1e-3);
    color += colorFraction * weight;
    opacity += opacityFraction * weight;
    totalWeight += weight;
  }

  color /= totalWeight;
  opacity /= totalWeight;

  ${x}

  fragColor = vec4(color, opacity);
}
`,S={name:"Default",params:{...d,speed:1,frame:0,colors:["#e0eaff","#241d9a","#f75092","#9f50d3"],distortion:.8,swirl:.1}};({...d});let O=(0,n.memo)(function({speed:e=S.params.speed,frame:t=S.params.frame,colors:r=S.params.colors,distortion:n=S.params.distortion,swirl:o=S.params.swirl,fit:i=S.params.fit,rotation:a=S.params.rotation,scale:s=S.params.scale,originX:u=S.params.originX,originY:l=S.params.originY,offsetX:p=S.params.offsetX,offsetY:d=S.params.offsetY,worldWidth:v=S.params.worldWidth,worldHeight:y=S.params.worldHeight,...g}){let b={u_colors:r.map(m),u_colorsCount:r.length,u_distortion:n,u_swirl:o,u_fit:h[i],u_rotation:a,u_scale:s,u_offsetX:p,u_offsetY:d,u_originX:u,u_originY:l,u_worldWidth:v,u_worldHeight:y};return(0,c.jsx)(f,{...g,speed:e,frame:t,fragmentShader:w,uniforms:b})},function(e,t){for(let r in e){if("colors"===r){let r=Array.isArray(e.colors),n=Array.isArray(t.colors);if(!r||!n){if(!1===Object.is(e.colors,t.colors))return!1;continue}if(e.colors?.length!==t.colors?.length||!e.colors?.every((e,r)=>e===t.colors?.[r]))return!1;continue}if(!1===Object.is(e[r],t[r]))return!1}return!0})},91350:function(e,t,r){"use strict";r.d(t,{F:function(){return l},f:function(){return f}});var n=r(2265),o=(e,t,r,n,o,i,a,s)=>{let u=document.documentElement,c=["light","dark"];function l(t){(Array.isArray(e)?e:[e]).forEach(e=>{let r="class"===e,n=r&&i?o.map(e=>i[e]||e):o;r?(u.classList.remove(...n),u.classList.add(i&&i[t]?i[t]:t)):u.setAttribute(e,t)}),s&&c.includes(t)&&(u.style.colorScheme=t)}if(n)l(n);else try{let e=localStorage.getItem(t)||r,n=a&&"system"===e?window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light":e;l(n)}catch(e){}},i=["light","dark"],a="(prefers-color-scheme: dark)",s="undefined"==typeof window,u=n.createContext(void 0),c={setTheme:e=>{},themes:[]},l=()=>{var e;return null!=(e=n.useContext(u))?e:c},f=e=>n.useContext(u)?n.createElement(n.Fragment,null,e.children):n.createElement(d,{...e}),p=["light","dark"],d=({forcedTheme:e,disableTransitionOnChange:t=!1,enableSystem:r=!0,enableColorScheme:o=!0,storageKey:s="theme",themes:c=p,defaultTheme:l=r?"system":"light",attribute:f="data-theme",value:d,children:g,nonce:b,scriptProps:x})=>{let[_,w]=n.useState(()=>m(s,l)),[S,O]=n.useState(()=>"system"===_?y():_),E=d?Object.values(d):c,P=n.useCallback(e=>{let n=e;if(!n)return;"system"===e&&r&&(n=y());let a=d?d[n]:n,s=t?v(b):null,u=document.documentElement,c=e=>{"class"===e?(u.classList.remove(...E),a&&u.classList.add(a)):e.startsWith("data-")&&(a?u.setAttribute(e,a):u.removeAttribute(e))};if(Array.isArray(f)?f.forEach(c):c(f),o){let e=i.includes(l)?l:null,t=i.includes(n)?n:e;u.style.colorScheme=t}null==s||s()},[b]),j=n.useCallback(e=>{let t="function"==typeof e?e(_):e;w(t);try{localStorage.setItem(s,t)}catch(e){}},[_]),R=n.useCallback(t=>{O(y(t)),"system"===_&&r&&!e&&P("system")},[_,e]);n.useEffect(()=>{let e=window.matchMedia(a);return e.addListener(R),R(e),()=>e.removeListener(R)},[R]),n.useEffect(()=>{let e=e=>{e.key===s&&(e.newValue?w(e.newValue):j(l))};return window.addEventListener("storage",e),()=>window.removeEventListener("storage",e)},[j]),n.useEffect(()=>{P(null!=e?e:_)},[e,_]);let A=n.useMemo(()=>({theme:_,setTheme:j,forcedTheme:e,resolvedTheme:"system"===_?S:_,themes:r?[...c,"system"]:c,systemTheme:r?S:void 0}),[_,j,e,S,r,c]);return n.createElement(u.Provider,{value:A},n.createElement(h,{forcedTheme:e,storageKey:s,attribute:f,enableSystem:r,enableColorScheme:o,defaultTheme:l,value:d,themes:c,nonce:b,scriptProps:x}),g)},h=n.memo(({forcedTheme:e,storageKey:t,attribute:r,enableSystem:i,enableColorScheme:a,defaultTheme:s,value:u,themes:c,nonce:l,scriptProps:f})=>{let p=JSON.stringify([r,t,s,e,c,u,i,a]).slice(1,-1);return n.createElement("script",{...f,suppressHydrationWarning:!0,nonce:"undefined"==typeof window?l:"",dangerouslySetInnerHTML:{__html:`(${o.toString()})(${p})`}})}),m=(e,t)=>{let r;if(!s){try{r=localStorage.getItem(e)||void 0}catch(e){}return r||t}},v=e=>{let t=document.createElement("style");return e&&t.setAttribute("nonce",e),t.appendChild(document.createTextNode("*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}")),document.head.appendChild(t),()=>{window.getComputedStyle(document.body),setTimeout(()=>{document.head.removeChild(t)},1)}},y=e=>(e||(e=window.matchMedia(a)),e.matches?"dark":"light")},85063:function(e,t,r){"use strict";function n(){return(n=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var r=arguments[t];for(var n in r)Object.prototype.hasOwnProperty.call(r,n)&&(e[n]=r[n])}return e}).apply(this,arguments)}r.d(t,{_:function(){return n}})},56984:function(e,t,r){"use strict";function n(e){if(null==e)throw TypeError("Cannot destructure "+e);return e}r.d(t,{_:function(){return n}})},5925:function(e,t,r){"use strict";let n,o;r.d(t,{Am:function(){return I}});var i,a=r(2265);let s={data:""},u=e=>"object"==typeof window?((e?e.querySelector("#_goober"):window._goober)||Object.assign((e||document.head).appendChild(document.createElement("style")),{innerHTML:" ",id:"_goober"})).firstChild:e||s,c=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,l=/\/\*[^]*?\*\/|  +/g,f=/\n+/g,p=(e,t)=>{let r="",n="",o="";for(let i in e){let a=e[i];"@"==i[0]?"i"==i[1]?r=i+" "+a+";":n+="f"==i[1]?p(a,i):i+"{"+p(a,"k"==i[1]?"":t)+"}":"object"==typeof a?n+=p(a,t?t.replace(/([^,])+/g,e=>i.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,t=>/&/.test(t)?t.replace(/&/g,e):e?e+" "+t:t)):i):null!=a&&(i=/^--/.test(i)?i:i.replace(/[A-Z]/g,"-$&").toLowerCase(),o+=p.p?p.p(i,a):i+":"+a+";")}return r+(t&&o?t+"{"+o+"}":o)+n},d={},h=e=>{if("object"==typeof e){let t="";for(let r in e)t+=r+h(e[r]);return t}return e},m=(e,t,r,n,o)=>{var i;let a=h(e),s=d[a]||(d[a]=(e=>{let t=0,r=11;for(;t<e.length;)r=101*r+e.charCodeAt(t++)>>>0;return"go"+r})(a));if(!d[s]){let t=a!==e?e:(e=>{let t,r,n=[{}];for(;t=c.exec(e.replace(l,""));)t[4]?n.shift():t[3]?(r=t[3].replace(f," ").trim(),n.unshift(n[0][r]=n[0][r]||{})):n[0][t[1]]=t[2].replace(f," ").trim();return n[0]})(e);d[s]=p(o?{["@keyframes "+s]:t}:t,r?"":"."+s)}let u=r&&d.g?d.g:null;return r&&(d.g=d[s]),i=d[s],u?t.data=t.data.replace(u,i):-1===t.data.indexOf(i)&&(t.data=n?i+t.data:t.data+i),s},v=(e,t,r)=>e.reduce((e,n,o)=>{let i=t[o];if(i&&i.call){let e=i(r),t=e&&e.props&&e.props.className||/^go/.test(e)&&e;i=t?"."+t:e&&"object"==typeof e?e.props?"":p(e,""):!1===e?"":e}return e+n+(null==i?"":i)},"");function y(e){let t=this||{},r=e.call?e(t.p):e;return m(r.unshift?r.raw?v(r,[].slice.call(arguments,1),t.p):r.reduce((e,r)=>Object.assign(e,r&&r.call?r(t.p):r),{}):r,u(t.target),t.g,t.o,t.k)}y.bind({g:1});let g,b,x,_=y.bind({k:1});function w(e,t){let r=this||{};return function(){let n=arguments;function o(i,a){let s=Object.assign({},i),u=s.className||o.className;r.p=Object.assign({theme:b&&b()},s),r.o=/ *go\d+/.test(u),s.className=y.apply(r,n)+(u?" "+u:""),t&&(s.ref=a);let c=e;return e[0]&&(c=s.as||e,delete s.as),x&&c[0]&&x(s),g(c,s)}return t?t(o):o}}var S=e=>"function"==typeof e,O=(e,t)=>S(e)?e(t):e,E=(n=0,()=>(++n).toString()),P=()=>{if(void 0===o&&"u">typeof window){let e=matchMedia("(prefers-reduced-motion: reduce)");o=!e||e.matches}return o},j=(e,t)=>{switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,20)};case 1:return{...e,toasts:e.toasts.map(e=>e.id===t.toast.id?{...e,...t.toast}:e)};case 2:let{toast:r}=t;return j(e,{type:e.toasts.find(e=>e.id===r.id)?1:0,toast:r});case 3:let{toastId:n}=t;return{...e,toasts:e.toasts.map(e=>e.id===n||void 0===n?{...e,dismissed:!0,visible:!1}:e)};case 4:return void 0===t.toastId?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(e=>e.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let o=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(e=>({...e,pauseDuration:e.pauseDuration+o}))}}},R=[],A={toasts:[],pausedAt:void 0},T=e=>{A=j(A,e),R.forEach(e=>{e(A)})},U=(e,t="blank",r)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...r,id:(null==r?void 0:r.id)||E()}),z=e=>(t,r)=>{let n=U(t,e,r);return T({type:2,toast:n}),n.id},I=(e,t)=>z("blank")(e,t);I.error=z("error"),I.success=z("success"),I.loading=z("loading"),I.custom=z("custom"),I.dismiss=e=>{T({type:3,toastId:e})},I.remove=e=>T({type:4,toastId:e}),I.promise=(e,t,r)=>{let n=I.loading(t.loading,{...r,...null==r?void 0:r.loading});return"function"==typeof e&&(e=e()),e.then(e=>{let o=t.success?O(t.success,e):void 0;return o?I.success(o,{id:n,...r,...null==r?void 0:r.success}):I.dismiss(n),e}).catch(e=>{let o=t.error?O(t.error,e):void 0;o?I.error(o,{id:n,...r,...null==r?void 0:r.error}):I.dismiss(n)}),e};var B=w("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${_`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${_`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${_`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,C=w("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${_`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`} 1s linear infinite;
`,k=w("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${_`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${_`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,M=w("div")`
  position: absolute;
`,D=w("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,V=w("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${_`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,F=({toast:e})=>{let{icon:t,type:r,iconTheme:n}=e;return void 0!==t?"string"==typeof t?a.createElement(V,null,t):t:"blank"===r?null:a.createElement(D,null,a.createElement(C,{...n}),"loading"!==r&&a.createElement(M,null,"error"===r?a.createElement(B,{...n}):a.createElement(k,{...n})))},L=e=>`
0% {transform: translate3d(0,${-200*e}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,$=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${-150*e}%,-1px) scale(.6); opacity:0;}
`,N=w("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,W=w("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,H=(e,t)=>{let r=e.includes("top")?1:-1,[n,o]=P()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[L(r),$(r)];return{animation:t?`${_(n)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${_(o)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}};a.memo(({toast:e,position:t,style:r,children:n})=>{let o=e.height?H(e.position||t||"top-center",e.visible):{opacity:0},i=a.createElement(F,{toast:e}),s=a.createElement(W,{...e.ariaProps},O(e.message,e));return a.createElement(N,{className:e.className,style:{...o,...r,...e.style}},"function"==typeof n?n({icon:i,message:s}):a.createElement(a.Fragment,null,i,s))}),i=a.createElement,p.p=void 0,g=i,b=void 0,x=void 0,y`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`}}]);