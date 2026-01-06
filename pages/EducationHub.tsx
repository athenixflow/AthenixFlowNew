import React, { useState, useEffect } from 'react';
import { getEducationLessons } from '../services/firestore';
import { getAILessonContent } from '../services/backend';
import { Lesson, UserProfile } from '../types';

interface EducationHubProps {
  user: UserProfile | null;
  onTokenSpend: (resource: 'education') => void;
  onNavigate: (page: string) => void;
}

const EducationHub: React.FC<EducationHubProps> = ({ user, onNavigate }) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLessons = async () => {
      setLoading(true);
      const data = await getEducationLessons();
      // Ensure authority metadata is present for SEO
      const enriched = data.map(l => ({
        ...l,
        author: l.author || 'Athenix Neural Research',
        updatedAt: l.updatedAt || new Date().toISOString(),
        category: l.category || 'Institutional Strategy'
      }));
      setLessons(enriched);
      
      // Auto-select first lesson for SEO visibility if none selected
      if (enriched.length > 0 && !selectedLesson) {
        setSelectedLesson(enriched[0]);
      }
      setLoading(false);
    };
    fetchLessons();
  }, []);

  const handleAskMentor = async () => {
    if (!user || !question.trim()) {
      if (!user) onNavigate('login');
      return;
    }

    setIsAsking(true);
    setError(null);
    setAiResponse(null);

    const response = await getAILessonContent(
      user.uid, 
      question, 
      selectedLesson ? `Context: This query relates to ${selectedLesson.title}` : undefined
    );

    if (response.status === 'success') {
      setAiResponse(response.data);
      setQuestion('');
    } else {
      setError(response.message);
    }
    setIsAsking(false);
  };

  const relatedLessons = lessons
    .filter(l => l.id !== selectedLesson?.id)
    .slice(0, 3);

  return (
    <div className="p-6 md:p-10 space-y-12 animate-fade-in max-w-7xl mx-auto pb-24">
      {/* SEO Optimized Header Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-brand-gold/10 border border-brand-gold/20 rounded-full">
            <span className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em]">Institutional Alpha Library</span>
          </div>
          <span className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">Knowledge is your edge</span>
        </div>
        <h1 className="text-4xl md:text-7xl font-black text-brand-charcoal uppercase tracking-tighter leading-[0.9]">
          Master The <br /> <span className="text-brand-gold">Institutional Loop.</span>
        </h1>
        <p className="text-brand-muted font-medium text-lg max-w-3xl leading-relaxed">
          Athenix provides evergreen trading education, strategy breakdowns, and market explanations designed to help you understand Smart Money Concepts (SMC) and high-frequency institutional liquidity patterns.
        </p>
      </section>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Main Content Area: Article Style */}
        <main className="flex-1 min-w-0">
          {loading ? (
            <div className="space-y-8">
              <div className="h-12 bg-brand-sage/10 rounded-2xl animate-pulse w-3/4"></div>
              <div className="space-y-4">
                <div className="h-4 bg-brand-sage/10 rounded-full w-full animate-pulse"></div>
                <div className="h-4 bg-brand-sage/10 rounded-full w-5/6 animate-pulse"></div>
                <div className="h-4 bg-brand-sage/10 rounded-full w-4/6 animate-pulse"></div>
              </div>
            </div>
          ) : selectedLesson ? (
            <article className="athenix-card p-8 md:p-12 space-y-10 relative overflow-hidden bg-white">
              {/* Article Authority Metadata */}
              <header className="space-y-4 border-b border-brand-sage/20 pb-8">
                <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest text-brand-muted">
                  <span className="text-brand-gold">{selectedLesson.category}</span>
                  <span className="w-1 h-1 bg-brand-sage rounded-full"></span>
                  <span>By {selectedLesson.author}</span>
                  <span className="w-1 h-1 bg-brand-sage rounded-full"></span>
                  <span>Updated {new Date(selectedLesson.updatedAt).toLocaleDateString()}</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-brand-charcoal tracking-tighter uppercase leading-none">
                  {selectedLesson.title}
                </h2>
                <p className="text-brand-muted font-bold uppercase text-xs tracking-tight">
                  Strategy Overview & Algorithmic Mechanics
                </p>
              </header>

              {/* Main Content Render */}
              <div className="space-y-8">
                {selectedLesson.content.map((para, i) => (
                  <p key={i} className="text-brand-charcoal/90 text-sm md:text-base leading-loose font-medium">
                    {para}
                  </p>
                ))}
              </div>

              {/* Internal Linking: Neural Directives CTA */}
              <div className="bg-brand-sage/5 border border-dashed border-brand-sage rounded-2xl p-8 space-y-6">
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-brand-charcoal uppercase tracking-[0.2em]">Neural Directives</h4>
                  <p className="text-[11px] text-brand-muted font-medium">Apply this logic using the Athenix Neural Core for real-time market setups.</p>
                </div>
                <button 
                  onClick={() => onNavigate('assistant')}
                  className="flex items-center gap-4 px-6 py-4 bg-brand-charcoal text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-gold transition-all group"
                >
                  Launch AI Assistant
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>

              {/* Disclaimer: Trust Signals */}
              <footer className="pt-10 border-t border-brand-sage/20">
                <p className="text-[9px] text-brand-muted font-black uppercase tracking-[0.2em] leading-relaxed">
                  Risk Disclosure: Trading involves significant financial risk. The educational content provided by Athenix is for informational purposes only and does not constitute financial advice. Past performance is not indicative of future results.
                </p>
              </footer>
            </article>
          ) : (
            <div className="athenix-card p-20 text-center opacity-40 italic">
              Select a module from the intelligence library.
            </div>
          )}

          {/* AI Response Section */}
          {aiResponse && (
            <div className="mt-8 athenix-card p-8 md:p-12 bg-brand-gold/5 border-brand-gold/20 animate-slide-up">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 bg-brand-gold rounded-full animate-pulse"></div>
                <h3 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.3em]">AI Mentor Synthesis</h3>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="text-brand-charcoal text-sm leading-loose whitespace-pre-wrap font-medium">{aiResponse}</p>
              </div>
            </div>
          )}
        </main>

        {/* Sidebar: Library & AI Query */}
        <aside className="w-full lg:w-80 space-y-8">
          {/* AI Query Terminal */}
          <div className="athenix-card p-6 bg-brand-charcoal text-white space-y-6">
            <div className="space-y-2">
              <h3 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.3em]">Query Intelligence</h3>
              <p className="text-[9px] text-white/50 font-bold uppercase tracking-tight">Ask anything about market mechanics</p>
            </div>
            <textarea 
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Query institutional concepts..."
              className="w-full h-24 p-4 bg-white/5 border border-white/10 rounded-xl text-xs font-medium outline-none focus:border-brand-gold transition-all resize-none text-white"
            />
            <button 
              disabled={isAsking}
              onClick={handleAskMentor}
              className="w-full py-4 bg-brand-gold text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 disabled:opacity-50 transition-all hover:bg-white hover:text-brand-charcoal"
            >
              {isAsking ? 'Decoding Node...' : 'Analyze Concept'}
            </button>
          </div>

          {/* Module Library Index */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-brand-muted uppercase tracking-[0.3em] pl-4 border-l-2 border-brand-sage">Related Intelligence</h3>
            <div className="space-y-4">
              {lessons.map((lesson) => (
                <button 
                  key={lesson.id} 
                  onClick={() => setSelectedLesson(lesson)}
                  className={`w-full text-left athenix-card p-5 transition-all group ${
                    selectedLesson?.id === lesson.id ? 'border-brand-gold bg-brand-gold/5' : 'hover:border-brand-sage/50'
                  }`}
                >
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                    selectedLesson?.id === lesson.id ? 'text-brand-gold' : 'text-brand-muted group-hover:text-brand-charcoal'
                  }`}>
                    {lesson.category}
                  </p>
                  <h4 className="text-xs font-black text-brand-charcoal uppercase leading-tight group-hover:text-brand-gold transition-colors">
                    {lesson.title}
                  </h4>
                </button>
              ))}
            </div>
          </div>

          {/* External Growth Signal */}
          <div className="athenix-card p-6 bg-brand-sage/5 border-dashed border-brand-sage/30 text-center">
            <p className="text-[9px] text-brand-muted font-black uppercase tracking-widest mb-4">Authority Signal</p>
            <p className="text-[11px] font-medium text-brand-charcoal leading-relaxed mb-6">
              Missing a concept? Our research team publishes institutional breakdowns weekly.
            </p>
            <a 
              href="/" 
              onClick={(e) => { e.preventDefault(); onNavigate('landing'); }}
              className="text-[9px] font-black text-brand-gold uppercase tracking-widest hover:underline"
            >
              Back to Overview
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default EducationHub;