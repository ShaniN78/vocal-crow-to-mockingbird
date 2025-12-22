'use client';

import { useState } from 'react';

interface Tip {
  header: string;
  actions: string[];
}

const TIPS: Tip[] = [
  {
    header: 'Breathe from your diaphragm',
    actions: [
      'Place your hand on your belly and breathe so your belly expands, not your chest',
      'Practice deep breathing exercises daily for 5-10 minutes',
      'Engage your core muscles when you inhale',
      'Exhale slowly and controlled while maintaining support'
    ]
  },
  {
    header: 'Maintain good posture',
    actions: [
      'Stand with feet shoulder-width apart, knees slightly bent',
      'Keep your spine straight but relaxed',
      'Roll your shoulders back and down',
      'Align your head so your ears are over your shoulders',
      'Avoid tensing your neck muscles'
    ]
  },
  {
    header: 'Warm up your voice before singing',
    actions: [
      'Start with gentle humming for 2-3 minutes',
      'Do lip trills (blowing air through relaxed lips)',
      'Practice scales slowly, starting in your comfortable range',
      'Gradually increase volume and range over 10-15 minutes',
      'Never skip warm-ups, even for short practice sessions'
    ]
  },
  {
    header: 'Stay hydrated',
    actions: [
      'Drink water throughout the day, not just before singing',
      'Aim for 8-10 glasses of water daily',
      'Avoid excessive caffeine and alcohol',
      'Warm water with honey and lemon can soothe your throat',
      'Room temperature water is best during practice'
    ]
  },
  {
    header: 'Practice proper vowel formation',
    actions: [
      'Keep your jaw relaxed and drop it slightly when opening your mouth',
      'Shape vowels consistently across your range',
      'Avoid jaw tension when singing higher notes',
      'Practice each vowel (A, E, I, O, U) separately',
      'Maintain space in your mouth for resonance'
    ]
  },
  {
    header: 'Develop consistent practice habits',
    actions: [
      'Practice daily, even if only for 15-20 minutes',
      'Short, focused sessions are better than long, unfocused ones',
      'Set specific goals for each practice session',
      'Record yourself regularly to track progress',
      'Be patient - vocal improvement takes time'
    ]
  },
  {
    header: 'Listen to your body',
    actions: [
      'Stop immediately if you feel pain or strain',
      'Take breaks when your voice feels tired',
      'Recognize the difference between muscle fatigue and vocal strain',
      'Rest your voice when you have a cold or sore throat',
      'Don\'t push through hoarseness or loss of voice'
    ]
  },
  {
    header: 'Build your range gradually',
    actions: [
      'Don\'t force notes that feel uncomfortable',
      'Practice extending your range by just a few semitones at a time',
      'Focus on maintaining quality as you extend range',
      'Work on both lower and upper extensions',
      'High notes require less air, not more force'
    ]
  },
  {
    header: 'Work on breath control',
    actions: [
      'Practice holding long, steady notes',
      'Try counting while sustaining a single note',
      'Practice phrases without taking extra breaths',
      'Learn to use your breath efficiently',
      'Exhale slowly and evenly to maintain consistent tone'
    ]
  },
  {
    header: 'Relax your jaw and tongue',
    actions: [
      'Practice singing while keeping your jaw loose',
      'Avoid clenching or tensing your jaw',
      'Keep your tongue flat and relaxed in your mouth',
      'Practice tongue twisters to improve flexibility',
      'Tension in these areas limits your vocal freedom'
    ]
  },
  {
    header: 'Practice with a mirror',
    actions: [
      'Watch for facial tension while singing',
      'Check that your jaw isn\'t clenching',
      'Ensure your posture stays correct',
      'Observe your breathing movements',
      'Look for unnecessary movements or gestures'
    ]
  },
  {
    header: 'Develop your ear training',
    actions: [
      'Practice matching pitches with a piano or app',
      'Sing intervals and scales to improve pitch accuracy',
      'Listen carefully to professional singers',
      'Try to sing along to recordings',
      'Practice sight-reading simple melodies'
    ]
  },
  {
    header: 'Focus on resonance',
    actions: [
      'Imagine the sound vibrating in your face/mask area',
      'Practice humming to feel vibrations in your nose and lips',
      'Open your throat like you\'re yawning (but don\'t actually yawn)',
      'Create space in your mouth and throat',
      'Think about projecting forward, not up or down'
    ]
  },
  {
    header: 'Work on articulation',
    actions: [
      'Practice clear consonant sounds',
      'Don\'t sacrifice clarity for volume',
      'Over-articulate when practicing to develop muscle memory',
      'Practice tongue twisters to improve diction',
      'Ensure every word is understandable'
    ]
  },
  {
    header: 'Manage performance anxiety',
    actions: [
      'Practice visualization techniques before performing',
      'Focus on your breathing to calm nerves',
      'Prepare thoroughly - confidence comes from preparation',
      'Accept that small mistakes are normal',
      'Remember that you\'re sharing something beautiful'
    ]
  },
  {
    header: 'Avoid vocal strain',
    actions: [
      'Never yell or scream, even in practice',
      'Don\'t try to sing over loud music',
      'Use a microphone when performing in loud environments',
      'Avoid whispering - it can strain your voice',
      'Take vocal rest days when needed'
    ]
  },
  {
    header: 'Practice transitions between registers',
    actions: [
      'Work on smooth transitions between chest and head voice',
      'Practice scales that cross your break point',
      'Use slides (glissandos) to connect registers',
      'Develop mixed voice for seamless transitions',
      'Be patient - register transitions take time to master'
    ]
  },
  {
    header: 'Get proper rest',
    actions: [
      'Aim for 7-9 hours of sleep nightly',
      'Your voice needs rest to recover and strengthen',
      'Avoid late-night practice sessions',
      'Sleep helps muscle memory develop',
      'Fatigue affects vocal performance significantly'
    ]
  },
  {
    header: 'Avoid harmful habits',
    actions: [
      'Don\'t smoke - it damages vocal cords',
      'Limit alcohol consumption, especially before singing',
      'Avoid clearing your throat forcefully',
      'Don\'t drink extremely cold or hot beverages right before singing',
      'Avoid excessive talking in noisy environments'
    ]
  },
  {
    header: 'Seek feedback and instruction',
    actions: [
      'Consider taking lessons from a qualified vocal coach',
      'Ask for honest feedback from trusted listeners',
      'Record yourself and listen critically',
      'Join a choir or singing group',
      'Learn from other singers and share experiences'
    ]
  }
];

export default function SingingTips() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [randomTipIndex, setRandomTipIndex] = useState(Math.floor(Math.random() * TIPS.length));

  // Get a random tip
  const randomTip = TIPS[randomTipIndex];

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="mb-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <button
          onClick={handleToggle}
          className="w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded transition-colors"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 pr-2">
              💡 {randomTip.header}
            </h3>
            <span className="text-blue-600 dark:text-blue-400 text-sm font-medium flex-shrink-0">
              {isExpanded ? 'Collapse' : 'Expand'}
            </span>
          </div>
        </button>
        
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Practical actions you can take:
              </h4>
              <ul className="space-y-2">
                {randomTip.actions.map((action, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 dark:text-blue-400 mr-2 flex-shrink-0 mt-0.5">•</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
