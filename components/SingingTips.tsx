'use client';

import { useState, useEffect } from 'react';

const SINGING_TIPS = [
  "Breathe from your diaphragm, not your chest. Place your hand on your stomach and feel it expand as you inhale.",
  "Practice vocal warm-ups before singing to prevent strain and improve flexibility.",
  "Stay hydrated! Water helps keep your vocal cords lubricated and healthy.",
  "Maintain good posture. Stand or sit straight with your shoulders relaxed.",
  "Practice consistently, even if it's just 15-20 minutes daily.",
  "Record yourself singing to identify areas for improvement.",
  "Learn to listen critically to pitch accuracy and tone quality.",
  "Work on your breathing control to sustain longer phrases.",
  "Practice scales and arpeggios to improve pitch accuracy.",
  "Don't strain your voice. If it hurts, stop and rest.",
  "Warm up your voice gently, starting with low notes and gradually moving higher.",
  "Practice vowel sounds (A, E, I, O, U) to improve clarity.",
  "Use your body to support your voice - engage your core muscles.",
  "Practice matching pitches with a piano or tuning app.",
  "Work on your resonance by finding your 'mask' (the area around your nose and mouth).",
  "Sing with emotion and expression, not just correct notes.",
  "Practice in a quiet space where you can hear yourself clearly.",
  "Take breaks during practice sessions to avoid vocal fatigue.",
  "Learn proper breath support by practicing 'hissing' exercises.",
  "Practice singing through a straw to improve breath control and reduce tension.",
  "Work on your vibrato naturally - don't force it.",
  "Practice singing different genres to expand your versatility.",
  "Learn proper diction and articulation for clear singing.",
  "Practice interval training to improve pitch recognition.",
  "Work on your chest voice and head voice balance.",
  "Practice dynamics - soft to loud and back again.",
  "Learn to sing with proper vowel modification for different registers.",
  "Practice legato (smooth) singing to connect your notes.",
  "Work on your falsetto if you're a male singer.",
  "Practice breathy vs. full voice to develop vocal colors.",
  "Learn to sing with a relaxed jaw and open throat.",
  "Practice staccato (short, detached) notes for precision.",
  "Work on your lower register by practicing descending scales.",
  "Practice singing with a metronome to improve rhythm.",
  "Learn proper tongue placement for clearer enunciation.",
  "Practice lip trills to improve breath control and warm up.",
  "Work on your upper register by practicing ascending scales.",
  "Practice singing acapella to develop independence.",
  "Learn to blend your registers smoothly (avoiding breaks).",
  "Practice singing in different languages to expand range.",
  "Work on your projection without shouting or straining.",
  "Practice sight-reading to improve musical literacy.",
  "Learn proper microphone technique if you plan to perform.",
  "Practice singing while moving to develop stability.",
  "Work on your vocal agility with runs and riffs.",
  "Practice singing harmonies to develop ear training.",
  "Learn to control your vibrato speed and width.",
  "Practice in different environments (bathroom, car, studio) to adapt.",
  "Work on your emotional connection to lyrics.",
  "Practice vocal exercises that target specific problem areas.",
  "Learn proper hydration timing (not just right before singing).",
  "Practice singing at different volumes to build control.",
  "Work on your stage presence and confidence.",
  "Practice with backing tracks to simulate performance.",
  "Learn to use consonants effectively for rhythm and clarity.",
  "Practice vocal rests - silence is part of music too.",
  "Work on your pitch accuracy with interval drills.",
  "Practice singing through your passaggio (break between registers).",
  "Learn to recognize and fix common pitch problems (sharp/flat).",
  "Practice breathing exercises away from singing.",
  "Work on your vocal endurance gradually over time.",
  "Practice singing scales in different keys.",
  "Learn to use proper vocal placement for different styles.",
  "Practice with a vocal coach or mentor for feedback.",
  "Work on your confidence - believe in your voice.",
  "Practice singing songs you love to maintain motivation.",
  "Learn proper vocal health habits (avoid smoking, excessive alcohol).",
  "Practice vocal exercises that strengthen your mix voice.",
  "Work on your interpretation of songs, not just technique.",
  "Practice singing with others to develop ensemble skills.",
  "Learn to handle stage fright and performance anxiety.",
  "Practice vocal agility exercises (runs, melismas).",
  "Work on your lower back support for better breath control.",
  "Practice singing with proper facial expression.",
  "Learn to use your diaphragm efficiently for breath support.",
  "Practice vocal sirens (gliding up and down) for flexibility.",
  "Work on your upper range gradually - don't force it.",
  "Practice singing with different emotional intentions.",
  "Learn to recognize when your voice needs rest.",
  "Practice vocal exercises that improve resonance.",
  "Work on your chest-to-head voice transition smoothly.",
  "Practice singing while playing an instrument if you can.",
  "Learn proper warm-down exercises after practice.",
  "Practice vocal range expansion exercises carefully.",
  "Work on your tone quality by experimenting with placement.",
  "Practice singing covers to learn from other artists.",
  "Learn to use dynamics to create musical interest.",
  "Practice vocal exercises that improve breath efficiency.",
  "Work on your articulation - clear consonants, open vowels.",
  "Practice singing with proper breath support on long notes.",
  "Learn to use your head voice without strain.",
  "Practice vocal exercises that improve pitch stability.",
  "Work on your lower range by relaxing and opening up.",
  "Practice singing with a mirror to check posture and expression.",
  "Learn to use vocal twang for certain styles (country, rock).",
  "Practice vocal exercises that improve vocal cord closure.",
  "Work on your falsetto/head voice connection.",
  "Practice singing with backing vocals to hear harmonies.",
  "Learn to use your mix voice for a balanced sound.",
  "Practice vocal exercises that improve agility and speed.",
  "Work on your breath control by practicing long phrases.",
  "Practice singing songs slightly above your comfortable range.",
  "Learn to use proper vocal registration for different styles.",
  "Practice vocal exercises that strengthen your middle voice.",
  "Work on your pitch memory by learning songs by ear.",
  "Practice singing with emotion - let the lyrics guide you.",
  "Learn to use your voice as an instrument with dynamics.",
];

export default function SingingTips() {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  useEffect(() => {
    // Randomly select a tip when component mounts
    setCurrentTipIndex(Math.floor(Math.random() * SINGING_TIPS.length));
  }, []);

  const getRandomTip = () => {
    setCurrentTipIndex(Math.floor(Math.random() * SINGING_TIPS.length));
  };

  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
          💡 Singing Tip #{currentTipIndex + 1}
        </h3>
        <button
          onClick={getRandomTip}
          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline"
        >
          New tip
        </button>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        {SINGING_TIPS[currentTipIndex]}
      </p>
    </div>
  );
}

