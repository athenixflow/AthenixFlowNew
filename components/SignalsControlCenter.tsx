import React, { useState, useEffect } from 'react';
import { TradingSignal, SignalStatus, SignalPublisher, UserProfile } from '../types';
import { addSignal, updateSignal, deleteSignal, getSignalPublishers, updateSignalPublisherPermission, subscribeToSignals, getAllUsers } from '../services/firestore';
import { ICONS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

interface SignalsControlCenterProps {
  user: UserProfile | null;
}

const SignalsControlCenter: React.FC<SignalsControlCenterProps> = ({ user }) => {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [publishers, setPublishers] = useState<SignalPublisher[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'CREATE' | 'MANAGE' | 'PUBLISHERS'>('CREATE');

  // Form State
  const [newSignal, setNewSignal] = useState<Omit<TradingSignal, 'id' | 'timestamp'>>({
    instrument: '',
    direction: 'Buy',
    orderType: 'Market',
    entry: 0,
    stopLoss: 0,
    takeProfit: 0,
    riskReward: '0.00',
    timeframe: 'H1',
    tradeType: 'Day Trade',
    status: 'Pending',
    visibility: 'All Users',
    notes: '',
    postedBy: user?.uid || '',
    postedByName: user?.fullName || 'Admin'
  });

  useEffect(() => {
    const unsubscribe = subscribeToSignals((data) => {
      setSignals(data);
      setLoading(false);
    });

    loadPublishers();
    loadAllUsers();

    return () => unsubscribe();
  }, []);

  const loadPublishers = async () => {
    const data = await getSignalPublishers();
    setPublishers(data);
  };

  const loadAllUsers = async () => {
    const data = await getAllUsers();
    setAllUsers(data);
  };

  const calculateRR = (entry: number, sl: number, tp: number, direction: 'Buy' | 'Sell') => {
    if (!entry || !sl || !tp) return '0.00';
    const risk = Math.abs(entry - sl);
    const reward = Math.abs(tp - entry);
    if (risk === 0) return '0.00';
    return (reward / risk).toFixed(2);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewSignal(prev => {
      const updated = { ...prev, [name]: value };
      if (['entry', 'stopLoss', 'takeProfit', 'direction'].includes(name)) {
        const entry = name === 'entry' ? Number(value) : prev.entry;
        const sl = name === 'stopLoss' ? Number(value) : prev.stopLoss;
        const tp = name === 'takeProfit' ? Number(value) : prev.takeProfit;
        const dir = name === 'direction' ? value as 'Buy' | 'Sell' : prev.direction;
        updated.riskReward = calculateRR(entry, sl, tp, dir);
      }
      return updated;
    });
  };

  const handleCreateSignal = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await addSignal(newSignal);
    if (res.success) {
      alert("Signal Created Successfully!");
      setNewSignal({
        ...newSignal,
        instrument: '',
        entry: 0,
        stopLoss: 0,
        takeProfit: 0,
        riskReward: '0.00',
        notes: ''
      });
    } else {
      alert("Error: " + res.error);
    }
  };

  const handleUpdateStatus = async (id: string, status: SignalStatus) => {
    await updateSignal(id, { status });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this signal?")) {
      await deleteSignal(id);
    }
  };

  const handleTogglePublisher = async (targetUser: UserProfile) => {
    const isPublisher = publishers.find(p => p.userId === targetUser.uid)?.canPostSignals;
    const res = await updateSignalPublisherPermission(
      targetUser.uid,
      !isPublisher,
      user?.uid || 'SYSTEM',
      targetUser.fullName,
      targetUser.role
    );
    if (res.success) {
      loadPublishers();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-brand-sage/5 p-1 rounded-xl w-fit">
        {['CREATE', 'MANAGE', 'PUBLISHERS'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab as any)}
            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
              activeSubTab === tab ? 'bg-white text-brand-charcoal shadow-sm' : 'text-brand-muted hover:text-brand-gold'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'CREATE' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white p-8 rounded-2xl border border-brand-sage/20"
          >
            <form onSubmit={handleCreateSignal} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest block mb-1">Instrument</label>
                  <input
                    type="text"
                    name="instrument"
                    value={newSignal.instrument}
                    onChange={handleFormChange}
                    placeholder="e.g. XAUUSD"
                    className="w-full bg-brand-sage/5 border border-brand-sage/20 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand-gold transition-colors"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest block mb-1">Direction</label>
                    <select
                      name="direction"
                      value={newSignal.direction}
                      onChange={handleFormChange}
                      className="w-full bg-brand-sage/5 border border-brand-sage/20 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand-gold"
                    >
                      <option value="Buy">Buy</option>
                      <option value="Sell">Sell</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest block mb-1">Order Type</label>
                    <select
                      name="orderType"
                      value={newSignal.orderType}
                      onChange={handleFormChange}
                      className="w-full bg-brand-sage/5 border border-brand-sage/20 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand-gold"
                    >
                      <option value="Market">Market</option>
                      <option value="Buy Limit">Buy Limit</option>
                      <option value="Sell Limit">Sell Limit</option>
                      <option value="Buy Stop">Buy Stop</option>
                      <option value="Sell Stop">Sell Stop</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest block mb-1">Entry Price</label>
                    <input
                      type="number"
                      step="any"
                      name="entry"
                      value={newSignal.entry}
                      onChange={handleFormChange}
                      className="w-full bg-brand-sage/5 border border-brand-sage/20 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand-gold"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest block mb-1">Stop Loss</label>
                    <input
                      type="number"
                      step="any"
                      name="stopLoss"
                      value={newSignal.stopLoss}
                      onChange={handleFormChange}
                      className="w-full bg-brand-sage/5 border border-brand-sage/20 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand-gold"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest block mb-1">Take Profit</label>
                    <input
                      type="number"
                      step="any"
                      name="takeProfit"
                      value={newSignal.takeProfit}
                      onChange={handleFormChange}
                      className="w-full bg-brand-sage/5 border border-brand-sage/20 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand-gold"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest block mb-1">Risk:Reward</label>
                    <div className="w-full bg-brand-sage/10 border border-transparent rounded-xl px-4 py-3 text-sm font-black text-brand-gold">
                      {newSignal.riskReward}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest block mb-1">Timeframe</label>
                    <select
                      name="timeframe"
                      value={newSignal.timeframe}
                      onChange={handleFormChange}
                      className="w-full bg-brand-sage/5 border border-brand-sage/20 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand-gold"
                    >
                      {['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'].map(tf => (
                        <option key={tf} value={tf}>{tf}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest block mb-1">Trade Type</label>
                    <select
                      name="tradeType"
                      value={newSignal.tradeType}
                      onChange={handleFormChange}
                      className="w-full bg-brand-sage/5 border border-brand-sage/20 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand-gold"
                    >
                      <option value="Scalp">Scalp</option>
                      <option value="Day Trade">Day Trade</option>
                      <option value="Swing Trade">Swing Trade</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest block mb-1">Visibility</label>
                  <select
                    name="visibility"
                    value={newSignal.visibility}
                    onChange={handleFormChange}
                    className="w-full bg-brand-sage/5 border border-brand-sage/20 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand-gold"
                  >
                    <option value="All Users">All Users</option>
                    <option value="Paid Users">Paid Users</option>
                    <option value="Lite">Lite Plan Only</option>
                    <option value="Pro">Pro Plan Only</option>
                    <option value="Elite">Elite Plan Only</option>
                  </select>
                </div>
              </div>

              <div className="md:col-span-3">
                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest block mb-1">Analysis Notes</label>
                <textarea
                  name="notes"
                  value={newSignal.notes}
                  onChange={handleFormChange}
                  rows={3}
                  className="w-full bg-brand-sage/5 border border-brand-sage/20 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-gold"
                  placeholder="Describe the logic behind this setup..."
                />
              </div>

              <div className="md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="bg-brand-charcoal text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-gold transition-all shadow-lg"
                >
                  Publish Signal
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {activeSubTab === 'MANAGE' && (
          <motion.div
            key="manage"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-2xl border border-brand-sage/20 overflow-hidden"
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-sage/5">
                  <th className="p-4 text-[10px] font-black text-brand-muted uppercase tracking-widest">Signal</th>
                  <th className="p-4 text-[10px] font-black text-brand-muted uppercase tracking-widest">Entry/SL/TP</th>
                  <th className="p-4 text-[10px] font-black text-brand-muted uppercase tracking-widest">Status</th>
                  <th className="p-4 text-[10px] font-black text-brand-muted uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {signals.map(signal => (
                  <tr key={signal.id} className="border-t border-brand-sage/10 hover:bg-brand-sage/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded flex items-center justify-center text-[10px] font-black text-white ${signal.direction === 'Buy' ? 'bg-brand-success' : 'bg-brand-error'}`}>
                          {signal.direction === 'Buy' ? 'B' : 'S'}
                        </div>
                        <div>
                          <p className="text-sm font-black text-brand-charcoal uppercase">{signal.instrument}</p>
                          <p className="text-[8px] text-brand-muted font-bold uppercase">{signal.orderType} • {signal.timeframe}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-[10px] font-bold text-brand-charcoal">E: {signal.entry}</p>
                      <p className="text-[10px] font-bold text-brand-error">SL: {signal.stopLoss}</p>
                      <p className="text-[10px] font-bold text-brand-success">TP: {signal.takeProfit}</p>
                    </td>
                    <td className="p-4">
                      <select
                        value={signal.status}
                        onChange={(e) => handleUpdateStatus(signal.id!, e.target.value as SignalStatus)}
                        className="bg-brand-sage/10 border-none rounded px-2 py-1 text-[9px] font-black uppercase tracking-widest focus:ring-0"
                      >
                        {['Pending', 'Triggered', 'Active', 'Take Profit', 'Stop Loss', 'Break Even', 'Closed'].map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4 text-right space-x-4">
                      <button onClick={() => handleDelete(signal.id!)} className="text-brand-error hover:text-red-700 transition-colors">
                        <ICONS.Trash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {activeSubTab === 'PUBLISHERS' && (
          <motion.div
            key="publishers"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-2xl border border-brand-sage/20 overflow-hidden"
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-sage/5">
                  <th className="p-4 text-[10px] font-black text-brand-muted uppercase tracking-widest">User</th>
                  <th className="p-4 text-[10px] font-black text-brand-muted uppercase tracking-widest">Role</th>
                  <th className="p-4 text-[10px] font-black text-brand-muted uppercase tracking-widest">Permission</th>
                  <th className="p-4 text-[10px] font-black text-brand-muted uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map(u => {
                  const publisher = publishers.find(p => p.userId === u.uid);
                  const isPublisher = publisher?.canPostSignals;
                  return (
                    <tr key={u.uid} className="border-t border-brand-sage/10 hover:bg-brand-sage/5 transition-colors">
                      <td className="p-4">
                        <p className="text-sm font-black text-brand-charcoal">{u.fullName}</p>
                        <p className="text-[8px] text-brand-muted font-bold uppercase">{u.email}</p>
                      </td>
                      <td className="p-4">
                        <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest">{u.role}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${isPublisher ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-sage/20 text-brand-muted'}`}>
                          {isPublisher ? 'Can Publish' : 'No Permission'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleTogglePublisher(u)}
                          className={`text-[10px] font-black uppercase tracking-widest hover:underline ${isPublisher ? 'text-brand-error' : 'text-brand-success'}`}
                        >
                          {isPublisher ? 'Revoke' : 'Grant Permission'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SignalsControlCenter;
