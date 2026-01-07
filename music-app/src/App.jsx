import React, { useState, useEffect } from 'react';
import './App.css';
import Piano from './components/Piano';
import ChordDisplay from './components/ChordDisplay';
import { Chord, Note, Progression } from '@tonaljs/tonal';
import { playChord, playProgression, stopTransport } from './utils/sound';

// Simple Guitar Chord Dictionary (String 6 to 1, -1 = mute, 0 = open)
const GUITAR_SHAPES = {
  // Majors
  'C': [-1, 3, 2, 0, 1, 0],
  'D': [-1, -1, 0, 2, 3, 2],
  'E': [0, 2, 2, 1, 0, 0],
  'F': [1, 3, 3, 2, 1, 1],
  'G': [3, 2, 0, 0, 0, 3],
  'A': [-1, 0, 2, 2, 2, 0],
  'B': [-1, 2, 4, 4, 4, 2],
  // Minors
  'Cm': [-1, 3, 5, 5, 4, 3],
  'Dm': [-1, -1, 0, 2, 3, 1],
  'Em': [0, 2, 2, 0, 0, 0],
  'Fm': [1, 3, 3, 1, 1, 1],
  'Gm': [3, 5, 5, 3, 3, 3],
  'Am': [-1, 0, 2, 2, 1, 0],
  'Bm': [-1, 2, 4, 4, 3, 2]
};

function App() {
  const [activeNotes, setActiveNotes] = useState([]);
  const [currentChord, setCurrentChord] = useState(null);
  const [progressionStatus, setProgressionStatus] = useState("idle");

  const handleNoteClick = (note) => {
    // Determine the root note name (e.g., C4 -> C)
    const root = Note.pitchClass(note); // "C"

    // Let's generate a major chord by default for the display
    const chord = Chord.get(`${root}M`);

    // Also find related chords (Major and Minor)
    const major = Chord.get(`${root}M`);
    const minor = Chord.get(`${root}m`);
    const dom7 = Chord.get(`${root}7`);

    setCurrentChord({
      name: major.name,
      notes: major.notes,
      variations: [major, minor, dom7],
      root: root
    });

    setActiveNotes(major.notes.map(n => n + "4")); // Highlight middle octave
  };

  const playVariation = (chordData) => {
      const notesWithOctave = chordData.notes.map((n) => n + "4");
      playChord(notesWithOctave);
      setCurrentChord(prev => ({...prev, name: chordData.name, notes: chordData.notes}));
      setActiveNotes(notesWithOctave);
  };

  const generateProgression = (mood) => {
      let progTemplate;
      if (mood === 'Happy') progTemplate = ['I', 'IV', 'V', 'I'];
      else if (mood === 'Sad') progTemplate = ['i', 'iv', 'V', 'i']; // Minor
      else if (mood === 'Jazz') progTemplate = ['ii7', 'V7', 'Imaj7'];

      // Default to C Major or C Minor based on mood
      const key = mood === 'Sad' ? 'C minor' : 'C major';

      const chords = Progression.fromRomanNumerals(key, progTemplate);

      // Prepare for playback
      const playbackData = chords.map(chordName => {
          const c = Chord.get(chordName);
          return {
              note: c.notes.map(n => n + "4"), // Simple mapping to 4th octave
              name: chordName,
              notes: c.notes.map(n => n + "4")
          };
      });

      setProgressionStatus("playing");
      playProgression(playbackData, 100, (currentChord) => {
          setActiveNotes(currentChord.notes);
          setCurrentChord({
              name: currentChord.name,
              notes: currentChord.notes.map(n => n.replace(/[0-9]/g, '')), // remove octave for display
              root: Note.pitchClass(currentChord.notes[0])
          });
          // Also play guitar strum for texture
          const guitarNotes = currentChord.notes.map(n => n.replace('4', '3')); // Lower octave for guitar
          playChord(guitarNotes, "4n", "guitar");
      });
  };

  const stopPlayback = () => {
      stopTransport();
      setProgressionStatus("idle");
      setActiveNotes([]);
  };

  const renderTab = (root, quality) => {
     // Very basic lookup
     const key = root + (quality === "Major" ? "" : "m");
     const frets = GUITAR_SHAPES[key];

     if(!frets) return <div>No tab available for this specific chord yet.</div>;

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

            {/* Guitar Tab Render */}
            <div className="guitar-area">
                <h3>Guitar Tab ({currentChord.name})</h3>
                {/* Heuristic to determine if major or minor for our simple lookup */}
                {renderTab(currentChord.root, currentChord.name.includes("m") && !currentChord.name.includes("Maj") ? "Minor" : "Major")}
            </div>
        </div>
      )}
    </div>
  );
}

export default App;
