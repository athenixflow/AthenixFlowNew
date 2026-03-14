import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, EducationInteraction } from '../types';
import { getAILessonContent } from '../services/backend';
import { getEducationHistory } from '../services/firestore';
import { ICONS } from '../constants';

interface EducationHubProps {
  user: UserProfile | null;
  onTokenSpend: (amount: number) => void;
}

const CATEGORIES = [
  'Market Structure',
  'Liquidity',
  'Order Blocks',
  'Fair Value Gaps',
  'Risk Management',
  'Trading Psychology',
  'Fundamental Analysis',
  'Platform Tutorials'
];

const SUGGESTIONS: Record<string, string[]> = {
  'Market Structure': [
    'What is a Break of Structure (BOS)?',
    'How to identify a Change of Character (CHoCH)?',
    'What is a strong high/low?'
  ],
  'Liquidity': [
    'What is buy-side liquidity?',
    'How does inducement work?',
    'What are equal highs/lows?'
  ],
  'Order Blocks': [
    'What is a valid Order Block?',
    'How to find a Breaker Block?',
    'What is a Mitigation Block?'
  ],
  'Fair Value Gaps': [
    'What is a Fair Value Gap (FVG)?',
    'How to trade an Inversion FVG?',
    'What is a Balanced Price Range?'
  ],
  'Risk Management': [
    'How to calculate position size?',
    'What is the 1% rule?',
    'How to manage a trade at break-even?'
  ],
  'Trading Psychology': [
    'How to deal with FOMO?',
    'What is a trading plan?',
    'How to handle a losing streak?'
  ],
  'Fundamental Analysis': [
    'How does NFP affect the market?',
    'What is the role of Central Banks?',
    'How to read an economic calendar?'
  ],
  'Platform Tutorials': [
    'How to use the Athenix AI Assistant?',
    'What do the confluence scores mean?',
    'How to read the liquidity heatmap?'
  ]
};

const DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Institutional'];

const EducationHub: React.FC<EducationHubProps> = ({ user, onTokenSpend }) => {
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [history, setHistory] = useState<EducationInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lastInteraction, setLastInteraction] = useState<{ question: string; answer: string } | null>(null);

  useEffect(() => {
    if (user) {
      loadHistory();
      testConnection();
    }
  }, [user]);

  const testConnection = async () => {
    try {
      // Simple connectivity check
      const { checkDatabaseConnection } = await import('../services/firestore');
      const isConnected = await checkDatabaseConnection();
      if (!isConnected) {
        console.warn("Athenix: Neural link latency detected. Check network or Firebase config.");
      }
    } catch (error) {
      // Silent fail for background check
    }
  };

  const loadHistory = async () => {
    if (!user) return;
    setLoading(true);
    const data = await getEducationHistory(user.uid);
    setHistory(data);
    if (data.length > 0) {
      if (!expandedId) setExpandedId(data[0].id || null);
      if (!lastInteraction) setLastInteraction({ question: data[0].question, answer: data[0].answer });
    }
    setLoading(false);
  };

  const handleAsk = async (customQuestion?: string, isFollowUp = false) => {
    const q = customQuestion || question;
    if (!user || !q.trim()) return;
    
    setIsAsking(true);
    try {
      let context = '';
      if (isFollowUp && lastInteraction) {
        context = `Previous Question: ${lastInteraction.question}\nPrevious Answer: ${lastInteraction.answer}`;
      }

      const response = await getAILessonContent(
        user.uid, 
        q, 
        context, 
        difficulty, 
        selectedCategory || 'General Trading'
      );

      if (response.status === 'success') {
        onTokenSpend(1);
        setQuestion('');
        setLastInteraction({ question: q, answer: response.data });
        await loadHistory();
        // The loadHistory will set the newest as expanded if we want, 
        // but let's explicitly set it if we can find the new ID.
        // For now, loadHistory handles it.
      } else {
        alert(response.message);
      }
    } catch (error) {
      console.error(error);
    }
    setIsAsking(false);
  };

  const filteredSuggestions = useMemo(() => {
    if (selectedCategory && SUGGESTIONS[selectedCategory]) {
      return SUGGESTIONS[selectedCategory];
    }
    // Default suggestions if no category selected
    return [
      'What is liquidity in trading?',
      'What is a trading range?',
      'What is inducement?',
      'What is a fair value gap?'
    ];
  }, [selectedCategory]);

  const dynamicSuggestions = useMemo(() => {
    if (!question.trim()) return filteredSuggestions;
    const search = question.toLowerCase();
    const all = Object.values(SUGGESTIONS).flat();
    return all.filter(s => s.toLowerCase().includes(search)).slice(0, 4);
  }, [question, filteredSuggestions]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10 animate-fade-in">
      {/* Academy Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-gold rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-gold/20">
              <ICONS.Education />
            </div>
            <h1 className="text-4xl font-black text-brand-charcoal uppercase tracking-tighter">AI Trading Academy</h1>
          </div>
          <p className="text-brand-muted font-medium text-lg">Master institutional concepts with your personal SMC mentor.</p>
        </div>
        
        {/* Token Balance Card */}
        <div className="bg-brand-charcoal p-4 rounded-2xl flex items-center gap-4 shadow-xl border border-white/10">
          <div className="w-10 h-10 bg-brand-gold/20 rounded-lg flex items-center justify-center text-brand-gold">
            <ICONS.Target className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[8px] font-black text-white/50 uppercase tracking-widest">Neural Credits</p>
            <p className="text-lg font-black text-white">{user?.educationTokens || 0} <span className="text-[10px] text-brand-gold">Units</span></p>
          </div>
        </div>
      </div>

      {/* Main Interaction Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Controls & Input */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-brand-sage/20 shadow-xl space-y-8 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none">
              <ICONS.Chart className="w-64 h-64 text-brand-gold" />
            </div>

            {/* Difficulty Selector */}
            <div className="space-y-3 relative z-10">
              <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Select Learning Depth</label>
              <div className="flex flex-wrap gap-2">
                {DIFFICULTY_LEVELS.map(level => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      difficulty === level 
                        ? 'bg-brand-gold text-white shadow-md shadow-brand-gold/20' 
                        : 'bg-brand-sage/5 text-brand-muted hover:bg-brand-sage/10'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filters */}
            <div className="space-y-3 relative z-10">
              <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Explore Topics</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    selectedCategory === null 
                      ? 'bg-brand-charcoal text-white' 
                      : 'bg-brand-sage/5 text-brand-muted hover:bg-brand-sage/10'
                  }`}
                >
                  All
                </button>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      selectedCategory === cat 
                        ? 'bg-brand-charcoal text-white' 
                        : 'bg-brand-sage/5 text-brand-muted hover:bg-brand-sage/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="space-y-4 relative z-10">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    placeholder="Ask your mentor anything..."
                    className="w-full p-5 bg-brand-sage/5 border border-brand-sage/20 rounded-2xl outline-none focus:border-brand-gold text-sm font-medium pr-12"
                    onKeyPress={e => e.key === 'Enter' && handleAsk()}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted">
                    <ICONS.Search />
                  </div>
                </div>
                <button
                  onClick={() => handleAsk()}
                  disabled={isAsking || !question.trim()}
                  className="px-8 py-5 bg-brand-charcoal text-white rounded-2xl font-black uppercase tracking-widest hover:bg-brand-gold transition-all disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
                >
                  {isAsking ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <span>Ask Mentor</span>
                  )}
                </button>
              </div>

              {/* Suggestions */}
              <div className="flex flex-wrap gap-2">
                {dynamicSuggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAsk(s)}
                    className="px-3 py-1.5 bg-brand-gold/5 hover:bg-brand-gold/10 border border-brand-gold/10 rounded-lg text-[10px] font-bold text-brand-gold transition-colors text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Follow-up Section (Only if there's a recent answer) */}
          <AnimatePresence>
            {lastInteraction && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-brand-gold/5 border border-brand-gold/20 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-brand-gold rounded-lg flex items-center justify-center text-white">
                    <ICONS.Target className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-brand-charcoal">Deepen your understanding of this topic.</p>
                </div>
                <button 
                  onClick={() => {
                    setQuestion(`Can you explain more about ${lastInteraction.question}?`);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-6 py-3 bg-brand-gold text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-gold/20 hover:scale-105 transition-transform"
                >
                  Ask Follow-Up Question
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Recent Consultations (Accordion) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-brand-charcoal uppercase tracking-tighter flex items-center gap-2">
              <ICONS.Target className="w-4 h-4 text-brand-gold" />
              Learning History
            </h3>
            <span className="text-[10px] font-black text-brand-muted uppercase bg-brand-sage/10 px-2 py-1 rounded">
              {history.length} Sessions
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-brand-sage/5 rounded-2xl animate-pulse border border-brand-sage/10" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-[2rem] border border-dashed border-brand-sage/30">
              <p className="text-brand-muted text-[10px] font-black uppercase tracking-widest">Neural history empty</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(item => (
                <div 
                  key={item.id} 
                  className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                    expandedId === item.id 
                      ? 'border-brand-gold shadow-lg ring-1 ring-brand-gold/20' 
                      : 'border-brand-sage/20 hover:border-brand-sage/40'
                  }`}
                >
                  <button 
                    onClick={() => setExpandedId(expandedId === item.id ? null : (item.id || null))}
                    className="w-full p-5 flex items-center justify-between text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        expandedId === item.id ? 'bg-brand-gold text-white' : 'bg-brand-sage/10 text-brand-muted group-hover:bg-brand-sage/20'
                      }`}>
                        <span className="text-[10px] font-black">Q</span>
                      </div>
                      <span className="text-xs font-black text-brand-charcoal line-clamp-1">{item.question}</span>
                    </div>
                    <div className={`transition-transform duration-300 ${expandedId === item.id ? 'rotate-90 text-brand-gold' : 'text-brand-muted'}`}>
                      <ICONS.ChevronRight />
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedId === item.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                      >
                        <div className="px-5 pb-6 space-y-6">
                          <div className="h-px bg-brand-sage/10 w-full" />
                          
                          {/* Response Metadata */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="p-2 bg-brand-sage/5 rounded-lg text-center">
                              <p className="text-[8px] font-black text-brand-muted uppercase tracking-widest mb-1">Category</p>
                              <p className="text-[9px] font-bold text-brand-charcoal uppercase">{item.category || 'General'}</p>
                            </div>
                            <div className="p-2 bg-brand-sage/5 rounded-lg text-center">
                              <p className="text-[8px] font-black text-brand-muted uppercase tracking-widest mb-1">Level</p>
                              <p className="text-[9px] font-bold text-brand-charcoal uppercase">{difficulty}</p>
                            </div>
                            <div className="p-2 bg-brand-sage/5 rounded-lg text-center">
                              <p className="text-[8px] font-black text-brand-muted uppercase tracking-widest mb-1">Date</p>
                              <p className="text-[9px] font-bold text-brand-charcoal uppercase">{new Date(item.timestamp).toLocaleDateString()}</p>
                            </div>
                          </div>

                          {/* Response Content */}
                          <div className="flex gap-3">
                            <div className="w-8 h-8 bg-brand-charcoal rounded-lg flex items-center justify-center text-white flex-shrink-0">
                              <span className="text-[10px] font-black">A</span>
                            </div>
                            <div className="prose prose-sm max-w-none text-brand-charcoal font-medium leading-relaxed academy-markdown">
                              <ReactMarkdown>{item.answer}</ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .academy-markdown h1, .academy-markdown h2, .academy-markdown h3 {
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -0.02em;
          color: #1a1a1a;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .academy-markdown h1 { font-size: 1.25rem; }
        .academy-markdown h2 { font-size: 1.1rem; }
        .academy-markdown h3 { font-size: 1rem; }
        .academy-markdown p { margin-bottom: 1rem; }
        .academy-markdown ul, .academy-markdown ol {
          margin-bottom: 1rem;
          padding-left: 1.25rem;
        }
        .academy-markdown li { margin-bottom: 0.5rem; }
        .academy-markdown strong { font-weight: 800; color: #1a1a1a; }
        .academy-markdown code {
          background: #f4f7f5;
          padding: 0.2rem 0.4rem;
          border-radius: 0.4rem;
          font-family: monospace;
          font-size: 0.85em;
        }
      `}</style>
    </div>
  );
};

export default EducationHub;

