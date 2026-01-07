import { Progression } from '@tonaljs/tonal';
console.log("Minors:", Progression.fromRomanNumerals("C", ["Im", "IVm", "V"]));
console.log("Lowercase:", Progression.fromRomanNumerals("C", ["im", "ivm", "V"]));
