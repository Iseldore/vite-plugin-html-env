"use strict";

function _toArray(arr) { return _arrayWithHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const _require = require('vite'),
      loadEnv = _require.loadEnv;

const path = require('path');

const fs = require('fs');

const ParseHTML = require('./parse');

const REGEXP_SYNTAX_CHARACTER = /[\[\]\(\)\.\+\^\$\*\!]/g;

const _omit = (obj = {}, uselessKeys = []) => {
  return Object.keys(obj || {}).reduce((cur, key) => {
    return uselessKeys.includes(key) ? cur : _objectSpread(_objectSpread({}, cur), {}, {
      [key]: obj[key]
    });
  }, {});
};

const _pick = (obj, defaultConfig = {}) => {
  return Object.keys(obj).length ? Object.keys(defaultConfig).reduce((cur, key) => {
    return _objectSpread(_objectSpread({}, cur), {}, {
      [key]: typeof obj[key] === 'boolean' ? obj[key] : obj[key] || defaultConfig[key]
    });
  }, defaultConfig) : defaultConfig;
};

const _resolve = (...arg) => path.resolve(__dirname, ...arg);

const _loadEnv = (envPath = '.env') => {
  const envFilePath = _resolve(process.cwd(), envPath);

  try {
    let res = {};
    if (!fs.existsSync(envFilePath)) return {};
    const data = fs.readFileSync(envFilePath, 'utf8');
    data.split('\n').forEach(kv => {
      const _kv$split = kv.split('='),
            _kv$split2 = _toArray(_kv$split),
            k = _kv$split2[0],
            values = _kv$split2.slice(1);

      const key = k.replace(/\s+/g, '');
      const value = values.join('=').trim();

      if (key) {
        res[key] = value;
      }
    });
    return res;
  } catch (err) {
    console.error(err);
  }
};

const _getModeEnvPath = () => {
  const argvList = process.argv.slice(2);
  const modeIndex = argvList.findIndex(arg => arg === '-m' || arg === '--mode');
  const modeFuzzyIndex = argvList.findIndex(arg => arg.indexOf('-m') > -1 || arg.indexOf('--mode') > -1);
  if (modeIndex !== -1 && modeIndex === modeFuzzyIndex && !!argvList[modeIndex + 1] // both null vs empty
  ) return `.env.${argvList[modeIndex + 1]}`;
  if (modeFuzzyIndex !== -1 && !!argvList[modeFuzzyIndex]) return `.env.${argvList[modeFuzzyIndex].split('=')[1]}`;
};

const modeEnvPath = _getModeEnvPath();

const getEnvConfig = (envDir = '') => {
  const prefix = envDir ? `${envDir}/` : '';
  const modeEnvConfig = !!modeEnvPath ? _loadEnv(`${prefix}${modeEnvPath}`) : {};
  const productionEnvConfig = modeEnvConfig.NODE_ENV === 'production' ? _loadEnv(`${prefix}.env.production`) : {};
  return Object.assign({}, _loadEnv(`${prefix}.env`), productionEnvConfig, modeEnvConfig);
};

const DEFAULT_CONFIG = {
  prefix: '<{',
  suffix: '}>',
  envPrefixes: 'SLB_',
  compiler: true,
  enforce: null,
  compress: false,
  replaceLinefeed: false
};

function vitePluginHtmlEnv(config) {
  let cacheEnvDir = '';
  config = config || {};

  let _pick2 = _pick(config, DEFAULT_CONFIG),
      prefix = _pick2.prefix,
      suffix = _pick2.suffix,
      envPrefixes = _pick2.envPrefixes,
      compiler = _pick2.compiler,
      enforce = _pick2.enforce,
      compress = _pick2.compress,
      replaceLinefeed = _pick2.replaceLinefeed;

  let transformIndexHtml = {
    transform(html, ctx) {
      let ctxEnvConfig = {}; // Use the loadEnv method provided by vite, because the code checks that it is a dev environment

      if (ctx.server) {
        const envDirPath = _resolve(process.cwd(), cacheEnvDir);

        ctxEnvConfig = loadEnv(ctx.server.config.mode, envDirPath, envPrefixes || 'SLB_') || {};
      } else {
        Object.assign(ctxEnvConfig, getEnvConfig(cacheEnvDir));
      }

      const map = _objectSpread(_objectSpread({}, ctxEnvConfig), _omit(config, Object.keys(DEFAULT_CONFIG)));

      prefix = prefix.replace(REGEXP_SYNTAX_CHARACTER, (...arg) => `\\${arg[0]}`);
      suffix = suffix.replace(REGEXP_SYNTAX_CHARACTER, (...arg) => `\\${arg[0]}`);

      if (compiler) {
        const parseHtml = new ParseHTML(html, _objectSpread(_objectSpread({}, map), {}, {
          prefix,
          suffix,
          compress,
          replaceLinefeed
        }));
        parseHtml.parse();
        return parseHtml.generate();
      }

      const reg = new RegExp(`(${prefix}|<%)\\s+(\\w+)\\s+(${suffix}|\/>)`, 'g');
      return html.replace(reg, (...arg) => {
        const key = arg[2];
        return `${map[key]}`;
      });
    }

  };
  if (enforce) transformIndexHtml.enforce = enforce;
  return {
    name: 'rollup-plugin-html-env',

    config(cfg) {
      if (cfg && cfg.envDir) {
        cacheEnvDir = cfg && cfg.envDir;
      } else {
        // The directory from which .env files are loaded. Can be an absolute path, or a path relative to the project root.
        // https://vitejs.dev/config/shared-options.html#envdir
        cacheEnvDir = cfg.root || '';
      }
    },

    transformIndexHtml
  };
}

module.exports = vitePluginHtmlEnv;
