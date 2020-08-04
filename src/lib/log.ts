import util from 'util';

let debugItem = 0;

export const error = (err: Error) => {
    if (process.env.NODE_ENV === 'test') return;
    console.log('\n\x1b[43m-----');
    console.log('\x1b[41m\x1b[1mError!!!\x1b[22m\x1b[34m', err.message);
    console.log(err.stack);
    console.log('\n\x1b[43m-----');
}

/**
 * Show all values provided to the process.stdout colorized
 *
 * @param {...any[]} args
 */
export const debug = (...args: any[]) => {
    if (process.env.NODE_ENV === 'test') return;
    console.log(`\n \x1b[43m######  \x1b[47m\x1b[30m(${debugItem}.)`);
    console.log(...args.map((a, idx) => `   \x1b[32m${idx}. ${a && typeof a === "object" ? util.inspect(a, { colors: true, sorted: true, depth: 4 }) : a}\n`));
    console.log(`\x1b[47m\x1b[30m(${debugItem++}.)  \x1b[43m######\n`);
}