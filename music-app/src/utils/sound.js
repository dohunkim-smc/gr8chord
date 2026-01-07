import * as Tone from 'tone';

// Create a PolySynth for the Piano (handles chords better)
const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: {
    type: "triangle"
  },
  envelope: {
    attack: 0.005,
    decay: 0.1,
    sustain: 0.3,
    release: 1
  }
}).toDestination();

// Create a simpler PluckSynth for Guitar-like sound
const guitar = new Tone.PolySynth(Tone.Synth, {
  oscillator: {
    type: "sawtooth"
  },
  envelope: {
    attack: 0.005,
    decay: 0.2,
    sustain: 0.1,
    release: 1.5
  },
  volume: -5
}).toDestination();

export const playNote = async (note, duration = "8n", type = "piano") => {
  await Tone.start();
  if (type === "guitar") {
    guitar.triggerAttackRelease(note, duration);
  } else {
    synth.triggerAttackRelease(note, duration);
  }
};

export const playChord = async (notes, duration = "1n", type = "piano") => {
  await Tone.start();
  if (type === "guitar") {
    guitar.triggerAttackRelease(notes, duration);
  } else {
    synth.triggerAttackRelease(notes, duration);
  }
};

// Function to schedule a progression
export const playProgression = async (chords, tempo = 120, onChordChange) => {
    await Tone.start();
    Tone.Transport.cancel(); // Clear previous
    Tone.Transport.bpm.value = tempo;

    const sequence = new Tone.Sequence((time, chord) => {
        // chord is an object { note: ["C4", "E4", "G4"], name: "CMaj7" }
        synth.triggerAttackRelease(chord.notes, "2n", time);
        // Maybe play a bass note too?
        if(onChordChange) {
            Tone.Draw.schedule(() => {
                onChordChange(chord);
            }, time);
        }
    }, chords, "1n");

    sequence.start(0);
    Tone.Transport.start();
};

export const stopTransport = () => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
}
