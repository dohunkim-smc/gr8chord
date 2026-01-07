import * as Tone from 'tone';

// Create a PolySynth for the Piano
const piano = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "triangle" },
  envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 }
}).toDestination();

// Create a PluckSynth for Guitar
const guitar = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sawtooth" },
  envelope: { attack: 0.005, decay: 0.2, sustain: 0.1, release: 1.5 },
  volume: -5
}).toDestination();

export const playNote = async (note, duration = "8n", type = "piano") => {
  await Tone.start();
  if (type === "guitar") guitar.triggerAttackRelease(note, duration);
  else piano.triggerAttackRelease(note, duration);
};

export const playChord = async (notes, duration = "1n", type = "piano") => {
  await Tone.start();
  if (type === "guitar") guitar.triggerAttackRelease(notes, duration);
  else piano.triggerAttackRelease(notes, duration);
};

export const stopTransport = () => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
};

// Advanced Progression Player with Styles
export const playStyledProgression = async (
    progressionData,
    style = "Block",
    tempo = 120,
    instruments = ["piano"],
    onChordChange
) => {
    await Tone.start();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = tempo;

    // Create a loop that iterates through the chords
    let index = 0;

    const loop = new Tone.Loop((time) => {
        const chordData = progressionData[index % progressionData.length];
        const notes = chordData.notes; // e.g., ["C4", "E4", "G4"]
        const guitarNotes = chordData.rawNotes.map(n => n + "3"); // Lower octave for guitar

        // Notify UI
        Tone.Draw.schedule(() => {
            onChordChange(chordData);
        }, time);

        // --- Style Logic ---

        if (style === "Arpeggio") {
            // Arpeggiate notes (Play one by one)
            const noteDuration = "8n";
            notes.forEach((note, i) => {
                const triggerTime = time + i * Tone.Time("8n").toSeconds();
                if (instruments.includes("piano")) {
                    piano.triggerAttackRelease(note, noteDuration, triggerTime);
                }
                if (instruments.includes("guitar")) {
                     // Guitar arpeggios usually sound better slightly overlapping
                    guitar.triggerAttackRelease(guitarNotes[i % guitarNotes.length], "4n", triggerTime);
                }
            });

        } else if (style === "Bossa") {
            // Simple Bossa Pattern: Bass on 1, Chord on 1 (short), 2.5, 3.5, 4 (syncopated)
            // Just a simplified approximation for now
            const chordDur = "16n";

            // On beat 1
            if(instruments.includes("piano")) piano.triggerAttackRelease(notes, "4n", time);
            if(instruments.includes("guitar")) guitar.triggerAttackRelease(guitarNotes, "8n", time);

            // Syncopated hits (using small offsets)
            const offBeats = [0.75, 1.25, 2.0, 2.75, 3.5]; // in quarter notes relative to start
            offBeats.forEach(offset => {
                 const t = time + offset * (60/tempo);
                 if(instruments.includes("piano")) piano.triggerAttackRelease(notes, chordDur, t, 0.7);
                 if(instruments.includes("guitar")) guitar.triggerAttackRelease(guitarNotes, chordDur, t, 0.8);
            });

        } else if (style === "Slow Strum") {
            // Strum chords (notes slightly delayed)
            const strumSpeed = 0.05; // seconds

            if (instruments.includes("piano")) {
                // Piano usually plays block chords in ballads, maybe soft
                piano.triggerAttackRelease(notes, "1n", time);
            }
            if (instruments.includes("guitar")) {
                guitarNotes.forEach((n, i) => {
                    guitar.triggerAttackRelease(n, "2n", time + (i * strumSpeed));
                });
            }

        } else if (style === "4-Beat") {
            // Play chord on every quarter note
            for (let i = 0; i < 4; i++) {
                const t = time + i * Tone.Time("4n").toSeconds();
                if (instruments.includes("piano")) piano.triggerAttackRelease(notes, "8n", t);
                if (instruments.includes("guitar")) guitar.triggerAttackRelease(guitarNotes, "8n", t);
            }

        } else {
            // Default: Block Chords (Whole note)
            if (instruments.includes("piano")) piano.triggerAttackRelease(notes, "1n", time);
            if (instruments.includes("guitar")) guitar.triggerAttackRelease(guitarNotes, "1n", time);
        }

        index++;
    }, "1n"); // Loop triggers every measure

    loop.start(0);
    Tone.Transport.start();
};
