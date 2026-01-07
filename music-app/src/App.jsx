import React, { useState, useEffect } from 'react';
import './App.css';
import Piano from './components/Piano';
import ChordDisplay from './components/ChordDisplay';
import { Chord, Note, Progression } from '@tonaljs/tonal';
import { playChord, playProgression, stopTransport } from './utils/sound';

// Enhanced Guitar Chord Dictionary
const GUITAR_SHAPES = {
  // Majors
  'C': [-1, 3, 2, 0, 1, 0], 'CMaj7': [-1, 3, 2, 0, 0, 0], 'C7': [-1, 3, 2, 3, 1, 0],
  'D': [-1, -1, 0, 2, 3, 2], 'DMaj7': [-1, -1, 0, 2, 2, 2], 'D7': [-1, -1, 0, 2, 1, 2],
  'E': [0, 2, 2, 1, 0, 0], 'EMaj7': [0, 2, 1, 1, 0, 0], 'E7': [0, 2, 0, 1, 0, 0],
  'F': [1, 3, 3, 2, 1, 1], 'FMaj7': [-1, 3, 3, 2, 1, 0], 'F7': [1, 3, 1, 2, 1, 1],
  'G': [3, 2, 0, 0, 0, 3], 'GMaj7': [3, -1, 0, 0, 0, 2], 'G7': [3, 2, 0, 0, 0, 1],
  'A': [-1, 0, 2, 2, 2, 0], 'AMaj7': [-1, 0, 2, 1, 2, 0], 'A7': [-1, 0, 2, 0, 2, 0],
  'B': [-1, 2, 4, 4, 4, 2], 'BMaj7': [-1, 2, 4, 3, 4, 2], 'B7': [-1, 2, 1, 2, 0, 2],
  // Minors
  'Cm': [-1, 3, 5, 5, 4, 3], 'Cm7': [-1, 3, 5, 3, 4, 3],
  'Dm': [-1, -1, 0, 2, 3, 1], 'Dm7': [-1, -1, 0, 2, 1, 1],
  'Em': [0, 2, 2, 0, 0, 0], 'Em7': [0, 2, 0, 0, 0, 0],
  'Fm': [1, 3, 3, 1, 1, 1], 'Fm7': [1, 3, 1, 1, 1, 1],
  'Gm': [3, 5, 5, 3, 3, 3], 'Gm7': [3, 5, 3, 3, 3, 3],
  'Am': [-1, 0, 2, 2, 1, 0], 'Am7': [-1, 0, 2, 0, 1, 0],
  'Bm': [-1, 2, 4, 4, 3, 2], 'Bm7': [-1, 2, 0, 2, 0, 2]
};

function App() {
  const [activeNotes, setActiveNotes] = useState([]);
  const [currentChord, setCurrentChord] = useState(null);
  const [progressionStatus, setProgressionStatus] = useState("idle");
  const [progressionChords, setProgressionChords] = useState([]);

  const handleNoteClick = (note) => {
    const root = Note.pitchClass(note); // "C"

    // Also find related chords (Major and Minor)
    const major = Chord.get(`${root}M`);
    const minor = Chord.get(`${root}m`);
    const dom7 = Chord.get(`${root}7`);
    const maj7 = Chord.get(`${root}Maj7`);
    const m7 = Chord.get(`${root}m7`);

    // Default to Major
    setCurrentChord({
      name: major.name,
      notes: major.notes,
      variations: [major, minor, dom7, maj7, m7],
      root: root
    });

    setActiveNotes(major.notes.map(n => n + "4"));
  };

  const playVariation = (chordData) => {
      const notesWithOctave = chordData.notes.map((n) => n + "4");
      playChord(notesWithOctave);
      setCurrentChord(prev => ({
          ...prev,
          name: chordData.name,
          notes: chordData.notes,
          root: Note.pitchClass(chordData.notes[0])
      }));
      setActiveNotes(notesWithOctave);

      // Also play guitar strum for texture
      const guitarNotes = chordData.notes.map(n => n + "3");
      playChord(guitarNotes, "4n", "guitar");
  };

  const generateProgression = (mood) => {
      let progTemplate;
      if (mood === 'Happy') progTemplate = ['I', 'IV', 'V', 'I'];
      else if (mood === 'Sad') progTemplate = ['Im', 'IVm', 'V', 'Im']; // Minor
      else if (mood === 'Jazz') progTemplate = ['IIm7', 'V7', 'IMaj7'];

      const key = 'C';

      const chordNames = Progression.fromRomanNumerals(key, progTemplate);

      // Prepare for playback and display
      const playbackData = chordNames.map(chordName => {
          const c = Chord.get(chordName);
          return {
              note: c.notes.map(n => n + "4"),
              name: chordName,
              notes: c.notes.map(n => n + "4"),
              rawNotes: c.notes // without octave
          };
      });

      setProgressionChords(playbackData); // Store for UI

      setProgressionStatus("playing");
      playProgression(playbackData, 100, (currentChord) => {
          setActiveNotes(currentChord.notes);
          setCurrentChord({
              name: currentChord.name,
              notes: currentChord.notes.map(n => n.replace(/[0-9]/g, '')), // remove octave
              root: Note.pitchClass(currentChord.notes[0])
          });
          const guitarNotes = currentChord.notes.map(n => n.replace('4', '3'));
          playChord(guitarNotes, "4n", "guitar");
      });
  };

  const stopPlayback = () => {
      stopTransport();
      setProgressionStatus("idle");
      setActiveNotes([]);
  };

  const renderTab = (chordName) => {
     // Simplify lookup: Tonal.js returns "C major", "C major seventh", but we use "C", "CMaj7"
     // We need to map the full Tonal name to our Dictionary keys
     // This is a heuristic mapping
     let searchKey = chordName;

     // Normalize Tonal names to our Dictionary Keys
     // Example: "C major" -> "C", "C minor" -> "Cm", "C dominant seventh" -> "C7"
     if (chordName.includes("major seventh")) searchKey = chordName.split(" ")[0] + "Maj7";
     else if (chordName.includes("minor seventh")) searchKey = chordName.split(" ")[0] + "m7";
     else if (chordName.includes("dominant seventh")) searchKey = chordName.split(" ")[0] + "7";
     else if (chordName.includes("major")) searchKey = chordName.split(" ")[0]; // C major -> C
     else if (chordName.includes("minor")) searchKey = chordName.split(" ")[0] + "m"; // C minor -> Cm

     // Try direct lookup if above fails (sometimes Tonal returns just "CMaj7")
     if (!GUITAR_SHAPES[searchKey]) {
         searchKey = chordName;
     }

     const frets = GUITAR_SHAPES[searchKey];

     if(!frets) return <div>No tab available for {chordName} ({searchKey})</div>;

     return (
         <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px'}}>
             <div style={{display: 'flex', gap: '5px'}}>
                 {frets.map((fret, i) => (
                     <div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                         <div style={{width: '2px', height: '100px', background: '#888', position: 'relative'}}>
                            {fret >= 0 && (
                                <div style={{
                                    width: '16px',
                                    height: '16px',
                                    background: '#333',
                                    borderRadius: '50%',
                                    position: 'absolute',
                                    top: fret === 0 ? '-10px' : `${fret * 20}px`,
                                    left: '-7px',
                                    color: 'white',
                                    fontSize: '10px',
                                    textAlign: 'center',
                                    lineHeight: '16px'
                                }}>
                                    {fret === 0 ? 'O' : fret}
                                </div>
                            )}
                            {fret === -1 && <span style={{position: 'absolute', top: '-20px', left: '-5px'}}>X</span>}
                         </div>
                         <span>{6-i}</span>
                     </div>
                 ))}
             </div>
             <p>Strings: E A D G B e</p>
         </div>
     )
  };

  return (
    <div className="App">
      <h1>🎹 Web Piano & Chords</h1>

      <div className="controls">
          <button onClick={() => generateProgression('Happy')}>Play Happy (Pop)</button>
          <button onClick={() => generateProgression('Sad')}>Play Sad (Ballad)</button>
          <button onClick={() => generateProgression('Jazz')}>Play Jazz (2-5-1)</button>
          <button onClick={stopPlayback} style={{background: '#8b0000'}}>Stop</button>
      </div>

      {progressionChords.length > 0 && (
          <div className="progression-list" style={{margin: '20px 0', padding: '10px', border: '1px solid #444'}}>
              <h3>Generated Progression:</h3>
              <div style={{display: 'flex', justifyContent: 'center', gap: '10px'}}>
                  {progressionChords.map((pc, idx) => (
                      <button key={idx} onClick={() => {
                          const chordObj = { name: pc.name, notes: pc.rawNotes };
                          playVariation(chordObj);
                      }}>
                          {pc.name}
                      </button>
                  ))}
              </div>
          </div>
      )}

      <br/>

      <Piano onNoteClick={handleNoteClick} activeNotes={activeNotes} />

      {currentChord && (
        <div className="chord-area">
            <div className="variations">
                <h3>Variations for {currentChord.root}:</h3>
                {currentChord.variations && currentChord.variations.map(v => (
                    <button key={v.name} onClick={() => playVariation(v)} style={{margin: '0 5px'}}>
                        {v.name}
                    </button>
                ))}
            </div>

            <ChordDisplay
                chordName={currentChord.name}
                notes={currentChord.notes}
            />

            <div className="guitar-area">
                <h3>Guitar Tab ({currentChord.name})</h3>
                {renderTab(currentChord.name)}
            </div>
        </div>
      )}
    </div>
  );
}

export default App;
