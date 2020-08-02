"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.debug = exports.error = void 0;
const util_1 = __importDefault(require("util"));
let debugItem = 0;
exports.error = (err) => {
    console.log('\n\x1b[43m-----');
    console.log('\x1b[41m\x1b[1mError!!!\x1b[22m\x1b[34m', err.message);
    console.log(err.stack);
    console.log('\n\x1b[43m-----');
};
/**
 * Show all values provided to the process.stdout colorized
 *
 * @param {...any[]} args
 */
exports.debug = (...args) => {
    if (process.env.NODE_ENV === 'test')
        return;
    console.log(`\n ######  (${debugItem}.)`);
    console.log(...args.map((a, idx) => `   ${idx}. ${a && typeof a === "object" ? util_1.default.inspect(a, { colors: true, sorted: true }) : a}\n`));
    console.log(`(${debugItem++}.)  ######\n`);
};
