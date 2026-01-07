import React, { useState } from 'react';
import './App.css';
import Piano from './components/Piano';
import { Chord, Note, Progression } from '@tonaljs/tonal';
import { playChord, playStyledProgression, stopTransport } from './utils/sound';

// --- DATA & CONSTANTS ---

const ROOT_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const MOODS = {
  'Happy (Major)': { template: ['I', 'IV', 'V', 'I'], type: 'Major' },
  'Sad (Minor)': { template: ['Im', 'IVm', 'V', 'Im'], type: 'Minor' },
  'Emotional (Ballad)': { template: ['I', 'V', 'VIm', 'IV'], type: 'Major' }, // Canon/Pop Ballad
  'Jazz (2-5-1)': { template: ['IIm7', 'V7', 'IMaj7', 'VI7b9'], type: 'Major' },
  'R&B (Neo-Soul)': { template: ['IMaj9', 'IIIm7', 'IIm9', 'V13'], type: 'Major' }, // Extended chords
  'Spooky (Diminished)': { template: ['Im', 'bII', 'VII', 'Im'], type: 'Minor' }
};

const STYLES = ['Block', 'Arpeggio', '4-Beat', 'Slow Strum', 'Bossa'];

// Guitar Dictionary (Expanded)
const GUITAR_SHAPES = {
  // Majors
  'C': [-1, 3, 2, 0, 1, 0], 'CMaj7': [-1, 3, 2, 0, 0, 0], 'C7': [-1, 3, 2, 3, 1, 0], 'CMaj9': [-1, 3, 2, 4, 3, -1],
  'D': [-1, -1, 0, 2, 3, 2], 'DMaj7': [-1, -1, 0, 2, 2, 2], 'D7': [-1, -1, 0, 2, 1, 2],
  'E': [0, 2, 2, 1, 0, 0], 'EMaj7': [0, 2, 1, 1, 0, 0], 'E7': [0, 2, 0, 1, 0, 0],
  'F': [1, 3, 3, 2, 1, 1], 'FMaj7': [-1, 3, 3, 2, 1, 0], 'F7': [1, 3, 1, 2, 1, 1],
  'G': [3, 2, 0, 0, 0, 3], 'GMaj7': [3, -1, 0, 0, 0, 2], 'G7': [3, 2, 0, 0, 0, 1],
  'A': [-1, 0, 2, 2, 2, 0], 'AMaj7': [-1, 0, 2, 1, 2, 0], 'A7': [-1, 0, 2, 0, 2, 0],
  'B': [-1, 2, 4, 4, 4, 2], 'BMaj7': [-1, 2, 4, 3, 4, 2], 'B7': [-1, 2, 1, 2, 0, 2],
  // Sharp/Flat Majors
  'C#': [-1, 4, 3, 1, 2, 1], 'Db': [-1, 4, 3, 1, 2, 1],
  'D#': [-1, 6, 5, 3, 4, 3], 'Eb': [-1, 6, 5, 3, 4, 3],
  'F#': [2, 4, 4, 3, 2, 2], 'Gb': [2, 4, 4, 3, 2, 2],
  'G#': [4, 6, 6, 5, 4, 4], 'Ab': [4, 6, 6, 5, 4, 4],
  'A#': [-1, 1, 3, 3, 3, 1], 'Bb': [-1, 1, 3, 3, 3, 1],
  // Minors
  'Cm': [-1, 3, 5, 5, 4, 3], 'Cm7': [-1, 3, 5, 3, 4, 3],
  'Dm': [-1, -1, 0, 2, 3, 1], 'Dm7': [-1, -1, 0, 2, 1, 1], 'Dm9': [-1, 5, 3, 5, 5, -1],
  'Em': [0, 2, 2, 0, 0, 0], 'Em7': [0, 2, 0, 0, 0, 0],
  'Fm': [1, 3, 3, 1, 1, 1], 'Fm7': [1, 3, 1, 1, 1, 1],
  'Gm': [3, 5, 5, 3, 3, 3], 'Gm7': [3, 5, 3, 3, 3, 3],
  'Am': [-1, 0, 2, 2, 1, 0], 'Am7': [-1, 0, 2, 0, 1, 0],
  'Bm': [-1, 2, 4, 4, 3, 2], 'Bm7': [-1, 2, 0, 2, 0, 2],
  // Sharp/Flat Minors
  'C#m': [-1, 4, 6, 6, 5, 4], 'Dbm': [-1, 4, 6, 6, 5, 4],
  'D#m': [-1, 6, 8, 8, 7, 6], 'Ebm': [-1, 6, 8, 8, 7, 6],
  'F#m': [2, 4, 4, 2, 2, 2], 'Gbm': [2, 4, 4, 2, 2, 2],
  'G#m': [4, 6, 6, 4, 4, 4], 'Abm': [4, 6, 6, 4, 4, 4],
  'A#m': [-1, 1, 3, 3, 2, 1], 'Bbm': [-1, 1, 3, 3, 2, 1]
};

function App() {
  // --- STATE ---
  const [root, setRoot] = useState('C');
  const [mood, setMood] = useState('Happy (Major)');
  const [style, setStyle] = useState('Block');
  const [instruments, setInstruments] = useState({ piano: true, guitar: false });

  const [generatedChords, setGeneratedChords] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);

  // Visual State
  const [activeNotes, setActiveNotes] = useState([]);
  const [currentChordDisplay, setCurrentChordDisplay] = useState(null);

  // --- LOGIC ---

  const handlePianoClick = (note) => {
    // When user clicks piano manually
    playChord([note], "8n", "piano");
    const rootName = Note.pitchClass(note);
    const chord = Chord.get(rootName + "M"); // Default to Major for display
    updateVisuals(chord, [note]);
  };

  const updateVisuals = (chordObj, notes) => {
      setCurrentChordDisplay({
          name: chordObj.name,
          notes: notes.map(n => n.replace(/[0-9]/g, '')),
          root: Note.pitchClass(notes[0])
      });
      setActiveNotes(notes);
  };

  const generate = () => {
    const selectedMood = MOODS[mood];
    // Tonal.js progression generation
    // If mood type is Minor, we use the root as minor key?
    // Actually Tonal.js Progression.fromRomanNumerals takes a tonic.
    // We should just pass the root and let the numerals define quality.

    const chords = Progression.fromRomanNumerals(root, selectedMood.template);

    const detailedChords = chords.map(name => {
        const c = Chord.get(name);
        return {
            name: name,
            notes: c.notes.map(n => n + "4"), // Octave 4
            rawNotes: c.notes
        };
    });

    setGeneratedChords(detailedChords);
  };

  const toggleInstrument = (inst) => {
      setInstruments(prev => ({ ...prev, [inst]: !prev[inst] }));
  };

  const handlePlay = () => {
      if (generatedChords.length === 0) return;

      if (isPlaying) {
          stopTransport();
          setIsPlaying(false);
          setActiveNotes([]);
          return;
      }

      setIsPlaying(true);
      const activeInsts = Object.keys(instruments).filter(k => instruments[k]);
      if (activeInsts.length === 0) activeInsts.push('piano'); // Fallback

      playStyledProgression(
          generatedChords,
          style,
          100, // Tempo
          activeInsts,
          (currentChord) => {
              // On Chord Change Update UI
              updateVisuals({ name: currentChord.name }, currentChord.notes);
          }
      );
  };

  // --- RENDER HELPERS ---

  const renderTab = (chordName) => {
     if (!chordName) return null;

     // Heuristic for matching complex names to dictionary keys
     let searchKey = chordName;
     const rootPart = chordName.match(/^[A-G][#b]?/)[0];

     if (chordName.includes("Major 9") || chordName.includes("Maj9")) searchKey = rootPart + "Maj9";
     else if (chordName.includes("Major 7") || chordName.includes("Maj7")) searchKey = rootPart + "Maj7";
     else if (chordName.includes("minor 7") || chordName.includes("m7")) searchKey = rootPart + "m7";
     else if (chordName.includes("dominant 7") || chordName.includes("7")) searchKey = rootPart + "7";
     else if (chordName.includes("major")) searchKey = rootPart;
     else if (chordName.includes("minor")) searchKey = rootPart + "m";

     // Fallback check
     if (!GUITAR_SHAPES[searchKey]) searchKey = chordName;

     const frets = GUITAR_SHAPES[searchKey];
     if(!frets) return <div className="tab-placeholder">No tab for {chordName}</div>;

     return (
         <div className="tab-visual">
             <div className="strings">
                 {frets.map((fret, i) => (
                     <div key={i} className="string">
                         <div className="line">
                            {fret >= 0 && (
                                <div className="dot" style={{ top: fret === 0 ? '-10px' : `${fret * 15}px`}}>
                                    {fret === 0 ? '○' : fret}
                                </div>
                            )}
                            {fret === -1 && <span className="mute">×</span>}
                         </div>
                         <span className="string-num">{6-i}</span>
                     </div>
                 ))}
             </div>
         </div>
     )
  };

  return (
    <div className="App">
      <header>
          <h1>🎹 Music Lab</h1>
          <p>Create progressions with Mood & Style</p>
      </header>

      <div className="main-layout">
          {/* LEFT PANEL: CONFIGURATION */}
          <div className="config-panel">

              <div className="step-box">
                  <div className="step-title">1. Root Note</div>
                  <div className="grid-buttons">
                      {ROOT_NOTES.map(n => (
                          <button
                            key={n}
                            className={root === n ? 'selected' : ''}
                            onClick={() => setRoot(n)}
                          >{n}</button>
                      ))}
                  </div>
              </div>

              <div className="step-box">
                  <div className="step-title">2. Mood (Harmony)</div>
                  <div className="grid-buttons wide">
                      {Object.keys(MOODS).map(m => (
                          <button
                            key={m}
                            className={mood === m ? 'selected' : ''}
                            onClick={() => setMood(m)}
                          >{m}</button>
                      ))}
                  </div>
              </div>

              <div className="step-box">
                  <div className="step-title">3. Style (Rhythm)</div>
                  <div className="grid-buttons wide">
                      {STYLES.map(s => (
                          <button
                            key={s}
                            className={style === s ? 'selected' : ''}
                            onClick={() => setStyle(s)}
                          >{s}</button>
                      ))}
                  </div>
              </div>

              <div className="action-area">
                  <button className="generate-btn" onClick={generate}>
                      Generate Progression 🎵
                  </button>
              </div>
          </div>

          {/* RIGHT PANEL: VISUALIZATION & PLAYBACK */}
          <div className="viz-panel">

              {/* Generated Chords List */}
              <div className="progression-bar">
                  {generatedChords.length === 0 ? (
                      <div className="placeholder-text">Click Generate to start...</div>
                  ) : (
                      generatedChords.map((c, i) => (
                          <div
                            key={i}
                            className={`chord-card ${currentChordDisplay?.name === c.name ? 'active' : ''}`}
                            onClick={() => {
                                playChord(c.notes);
                                updateVisuals({name: c.name}, c.notes);
                            }}
                          >
                              {c.name}
                          </div>
                      ))
                  )}
              </div>

              {/* Playback Controls */}
              <div className="controls-bar">
                  <div className="inst-toggles">
                      <label>
                          <input type="checkbox" checked={instruments.piano} onChange={() => toggleInstrument('piano')} />
                          Piano 🎹
                      </label>
                      <label>
                          <input type="checkbox" checked={instruments.guitar} onChange={() => toggleInstrument('guitar')} />
                          Guitar 🎸
                      </label>
                  </div>
                  <button
                    className={`play-btn ${isPlaying ? 'stop' : ''}`}
                    onClick={handlePlay}
                    disabled={generatedChords.length === 0}
                  >
                      {isPlaying ? 'STOP ■' : 'PLAY ▶'}
                  </button>
              </div>

              {/* Visualization */}
              <div className="visualizer-container">
                  <Piano onNoteClick={handlePianoClick} activeNotes={activeNotes} />

                  <div className="bottom-info">
                      <div className="chord-info">
                          <h2>{currentChordDisplay ? currentChordDisplay.name : "..."}</h2>
                          <p>{currentChordDisplay ? currentChordDisplay.notes.join(' - ') : "Select a key or play"}</p>
                      </div>
                      <div className="tab-area">
                          {currentChordDisplay && renderTab(currentChordDisplay.name)}
                      </div>
                  </div>
              </div>

          </div>
      </div>
    </div>
  );
}

export default App;
