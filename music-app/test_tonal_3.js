import { Progression } from '@tonaljs/tonal';
console.log("Major:", Progression.fromRomanNumerals("C", ["I", "IV", "V"]));
console.log("Minor:", Progression.fromRomanNumerals("C", ["i", "iv", "V"]));
