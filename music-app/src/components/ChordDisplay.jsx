import React from 'react';

const ChordDisplay = ({ chordName, notes, guitarTabs }) => {
  if (!chordName) return <div className="chord-display">Click a key to see chords!</div>;

  return (
    <div className="chord-display">
      <h2>Chord: {chordName}</h2>
      <p>Notes: {notes.join(' - ')}</p>

      {guitarTabs && (
        <div className="guitar-tab">
           <h3>Guitar Voicing (Standard EADGBE)</h3>
           <div className="tab-visualization">
             {/* Simple text representation for now, or SVG if time permits */}
             <pre>{JSON.stringify(guitarTabs, null, 2)}</pre>
             {/* I will improve this to a visual representation later */}
           </div>
        </div>
      )}
    </div>
  );
};

export default ChordDisplay;
