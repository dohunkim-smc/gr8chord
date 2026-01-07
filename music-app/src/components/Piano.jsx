import React from 'react';
import './Piano.css';
import { playNote } from '../utils/sound';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const Piano = ({ onNoteClick, activeNotes = [] }) => {
  const startOctave = 3;
  const endOctave = 4;

  const keys = [];

  for (let oct = startOctave; oct <= endOctave; oct++) {
    NOTES.forEach((note) => {
      const isSharp = note.includes('#');
      const noteName = `${note}${oct}`;
      keys.push({ note: noteName, isSharp });
    });
  }
  // Add one high C
  keys.push({ note: `C${endOctave + 1}`, isSharp: false });

  return (
    <div className="piano">
      {keys.map((k) => (
        <div
          key={k.note}
          className={`key ${k.isSharp ? 'black' : 'white'} ${activeNotes.includes(k.note) ? 'active' : ''}`}
          onMouseDown={() => {
            playNote(k.note);
            onNoteClick(k.note);
          }}
        >
            <span className="note-label">{k.note}</span>
        </div>
      ))}
    </div>
  );
};

export default Piano;
