
import React, { useState } from 'react';

interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string[];
}

const STATIC_LESSONS: Lesson[] = [
  {
    id: '1',
    title: 'Understanding Market Structure',
    description: 'Learn to identify institutional trends using swing highs and swing lows.',
    content: [
      'Market structure is the most fundamental concept in institutional trading. It allows traders to identify the current trend and potential reversal points by observing the relationship between successive peaks and troughs.',
      'A bullish structure is defined by higher highs (HH) and higher lows (HL). Conversely, a bearish structure consists of lower highs (LH) and lower lows (LL).',
      'Identifying a "Break of Structure" (BOS) is critical for anticipating a change in market direction.'
    ]
  },
  {
    id: '2',
    title: 'Liquidity Concepts v3.1',
    description: 'Deep dive into stop hunts, buy-side liquidity, and sell-side liquidity.',
    content: [
      'Liquidity refers to the areas on a chart where a high volume of orders—specifically stop losses—are likely to reside. Institutional players often drive price to these zones to fill their large positions.',
      'Common liquidity pools include equal highs (double tops) and equal lows (double bottoms).',
      'Understanding "Liquidity Sweeps" helps traders avoid being caught in "Stop Hunts" before the real market move occurs.'
    ]
  },
  {
    id: '3',
    title: 'Institutional Order Blocks',
    description: 'Master the footprint of big banks and hedge funds in the markets.',
    content: [
      'Order blocks are specific price candles where institutional players have placed large orders. These areas often act as strong support or resistance when price returns to them.',
      'A bullish order block is typically the last down candle before a sharp impulsive move upward.',
      'A bearish order block is the last up candle before a sharp impulsive move downward.'
    ]
  },
  {
    id: '4',
    title: 'Risk Management Architecture',
    description: 'The mathematical foundation of professional trading longevity.',
    content: [
      'Professional trading is not about being right 100% of the time; it is about managing risk so that losses are small and wins are significant.',
      'Standard protocol suggests risking no more than 1-2% of total account capital on any single trade setup.',
      'Position sizing must be calculated based on the distance between your entry and stop loss levels.'
    ]
  }
];

const EducationHub: React.FC = () => {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  return (
    <div className="p-6 md:p-10 space-y-10 animate-fade-in max-w-7xl mx-auto">
      {/* Header Section */}
      <section className="space-y-2">
        <h2 className="text-4xl font-black text-brand-charcoal uppercase tracking-tighter">Education Hub</h2>
        <p className="text-brand-muted font-medium text-sm uppercase tracking-widest">
          Algorithmic knowledge base designed to refine your institutional market perspective.
        </p>
      </section>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Lessons Overview Section */}
        <section className={`w-full lg:w-1/3 space-y-4 ${selectedLesson ? 'hidden lg:block' : 'block'}`}>
          <h3 className="text-[10px] font-black text-brand-muted uppercase tracking-[0.3em] mb-4">Available Modules</h3>
          <div className="space-y-4">
            {STATIC_LESSONS.map((lesson) => (
              <div 
                key={lesson.id} 
                className={`athenix-card p-6 cursor-pointer transition-all border-l-4 ${
                  selectedLesson?.id === lesson.id ? 'border-l-brand-gold bg-brand-gold/[0.02]' : 'border-l-transparent hover:border-l-brand-sage'
                }`}
                onClick={() => setSelectedLesson(lesson)}
              >
                <h4 className="font-black text-sm text-brand-charcoal uppercase tracking-widest mb-2">{lesson.title}</h4>
                <p className="text-xs text-brand-muted font-medium mb-4 line-clamp-2">{lesson.description}</p>
                <button className="text-[10px] font-black text-brand-gold uppercase tracking-widest flex items-center gap-2 group">
                  Open Lesson
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Lesson Detail Panel */}
        <section className="flex-1">
          {selectedLesson ? (
            <div className="athenix-card p-8 md:p-12 space-y-10 animate-slide-up bg-white min-h-[600px] flex flex-col">
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setSelectedLesson(null)} 
                  className="lg:hidden p-2 -ml-2 text-brand-muted hover:text-brand-gold transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-[9px] font-black text-brand-gold uppercase tracking-[0.3em] bg-brand-gold/10 px-3 py-1 rounded-full">
                  Verified Content
                </span>
              </div>

              <div className="space-y-4">
                <h3 className="text-3xl font-black text-brand-charcoal uppercase tracking-tighter leading-none">
                  {selectedLesson.title}
                </h3>
                <p className="text-brand-muted font-bold text-[10px] uppercase tracking-widest">
                  Athenix Intelligence Training Module
                </p>
              </div>

              <div className="space-y-6 flex-1">
                {selectedLesson.content.map((paragraph, idx) => (
                  <p key={idx} className="text-sm text-brand-charcoal leading-loose font-medium opacity-90">
                    {paragraph}
                  </p>
                ))}
              </div>

              <div className="pt-10 border-t border-brand-sage/20 space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-brand-charcoal uppercase tracking-widest mb-4">Ask a Question</h4>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Inquire about this module's logic..."
                      className="w-full px-6 py-5 bg-brand-sage/5 border border-brand-sage rounded-2xl outline-none focus:border-brand-gold transition-all font-medium text-xs pr-32"
                    />
                    <button className="absolute right-2 top-2 bottom-2 px-6 bg-brand-gold text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-brand-charcoal transition-colors">
                      Submit
                    </button>
                  </div>
                </div>
                <p className="text-[9px] text-brand-muted font-bold uppercase tracking-[0.2em] text-center">
                  Inquiries require 1 Educational Credit
                </p>
              </div>
            </div>
          ) : (
            <div className="athenix-card min-h-[600px] p-12 flex flex-col items-center justify-center text-center bg-white border-dashed">
              <div className="w-20 h-20 bg-brand-sage/5 rounded-[32px] flex items-center justify-center text-brand-sage mb-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h4 className="text-xl font-black text-brand-charcoal uppercase tracking-widest mb-4">Select a Knowledge Module</h4>
              <p className="text-[10px] text-brand-muted font-bold uppercase tracking-[0.2em] max-w-xs mx-auto leading-loose">
                Initialize your algorithmic training by selecting a core module from the terminal directory.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default EducationHub;
