import { Progression, Chord } from '@tonaljs/tonal';
const key = 'C major';
const template = ['I', 'IV', 'V', 'I'];
const chords = Progression.fromRomanNumerals(key, template);
console.log("Chords:", chords);
const mapped = chords.map(n => {
   const c = Chord.get(n);
   return { name: n, cName: c.name };
});
console.log("Mapped:", mapped);
