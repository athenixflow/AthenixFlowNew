import React, { useState, useEffect } from 'react';
import { UserProfile, EducationInteraction } from '../types';
import { getAILessonContent } from '../services/backend';
import { getEducationHistory } from '../services/firestore';
import { ICONS } from '../constants';

interface EducationHubProps {
  user: UserProfile | null;
  onTokenSpend: (amount: number) => void;
}

const EducationHub: React.FC<EducationHubProps> = ({ user, onTokenSpend }) => {
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [history, setHistory] = useState<EducationInteraction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    setLoading(true);
    setHistory(await getEducationHistory(user.uid));
    setLoading(false);
  };

  const handleAsk = async () => {
    if (!user || !question.trim()) return;
    setIsAsking(true);
    try {
      const response = await getAILessonContent(user.uid, question);
      if (response.status === 'success') {
        onTokenSpend(1);
        setQuestion('');
        loadHistory();
      } else {
        alert(response.message);
      }
    } catch (error) {
      console.error(error);
    }
    setIsAsking(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in">
      {/* Search/Ask Section */}
      <div className="bg-white p-8 md:p-12 rounded-[2rem] border border-brand-sage/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <ICONS.Chart className="w-32 h-32 text-brand-gold" />
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-brand-charcoal uppercase tracking-tighter">Education Hub</h2>
            <p className="text-brand-muted font-medium">Master Smart Money Concepts with the Athenix AI Mentor.</p>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Ask about Liquidity, POIs, Market Structure..."
              className="flex-1 p-5 bg-brand-sage/5 border border-brand-sage/20 rounded-2xl outline-none focus:border-brand-gold text-sm font-medium"
              onKeyPress={e => e.key === 'Enter' && handleAsk()}
            />
            <button
              onClick={handleAsk}
              disabled={isAsking || !question.trim()}
              className="px-10 py-5 bg-brand-charcoal text-white rounded-2xl font-black uppercase tracking-widest hover:bg-brand-gold transition-all disabled:opacity-50 shadow-lg"
            >
              {isAsking ? 'Consulting Mentor...' : 'Ask Mentor'}
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            {['Liquidity Mapping', 'Market Structure', 'POI Selection', 'Risk Management'].map(tag => (
              <button 
                key={tag} 
                onClick={() => setQuestion(tag)}
                className="px-4 py-2 bg-brand-sage/10 hover:bg-brand-sage/20 rounded-full text-[10px] font-black uppercase tracking-widest text-brand-muted transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="space-y-6">
        <h3 className="text-xl font-black text-brand-charcoal uppercase tracking-tighter flex items-center gap-3">
          <ICONS.Target className="w-5 h-5 text-brand-gold" />
          Recent Consultations
        </h3>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-brand-sage/30">
            <p className="text-brand-muted text-sm font-medium">Your learning history will appear here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {history.map(item => (
              <div key={item.id} className="bg-white p-8 rounded-2xl border border-brand-sage/20 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 bg-brand-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-gold font-black">Q</span>
                  </div>
                  <h4 className="text-lg font-black text-brand-charcoal leading-tight pt-1">{item.question}</h4>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-brand-charcoal/5 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-charcoal font-black">A</span>
                  </div>
                  <div className="text-sm text-brand-muted leading-relaxed font-medium space-y-4 pt-1">
                    {item.answer.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-brand-sage/10 flex justify-between items-center">
                  <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest">{item.category}</span>
                  <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest">{new Date(item.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EducationHub;
