
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// Helper to determine confidence bucket from score
const getConfidenceBucket = (score) => {
  if (score >= 85) return 'High';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Moderate';
  return 'Low';
};

// --- FUNCTION 1: DAILY ANALYTICS AGGREGATION ---
// Runs every 24 hours to summarize the previous day's activity
exports.aggregateDailyAnalytics = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Format YYYY-MM-DD for doc ID
  const dateStr = yesterday.toISOString().split('T')[0];
  
  const startOfDay = new Date(yesterday.setHours(0, 0, 0, 0));
  const endOfDay = new Date(yesterday.setHours(23, 59, 59, 999));

  console.log(`Starting aggregation for ${dateStr}`);

  const snapshot = await db.collection('analysisHistory')
    .where('timestamp', '>=', startOfDay.toISOString())
    .where('timestamp', '<=', endOfDay.toISOString())
    .get();

  const stats = {
    totalAnalyses: 0,
    tpCount: 0,
    slCount: 0,
    beCount: 0,
    notTakenCount: 0,
    confidenceSum: 0,
    byTradeMode: {},
    byStrategy: {},
    bySymbol: {}
  };

  snapshot.forEach(doc => {
    const data = doc.data();
    const outcome = data.feedback ? data.feedback.outcome : null;
    const score = data.signal ? (data.signal.confidence_score || 0) : 0;
    const mode = data.execution_mode || 'unknown';
    const strategy = data.strategy_used || 'unknown';
    const symbol = data.instrument || 'unknown';

    stats.totalAnalyses++;
    stats.confidenceSum += score;

    // Outcome Counts
    if (outcome === 'TP') stats.tpCount++;
    if (outcome === 'SL') stats.slCount++;
    if (outcome === 'BE') stats.beCount++;
    if (outcome === 'NOT_TAKEN') stats.notTakenCount++;

    // Grouping
    if (!stats.byTradeMode[mode]) stats.byTradeMode[mode] = 0;
    stats.byTradeMode[mode]++;

    if (!stats.byStrategy[strategy]) stats.byStrategy[strategy] = 0;
    stats.byStrategy[strategy]++;

    if (!stats.bySymbol[symbol]) stats.bySymbol[symbol] = 0;
    stats.bySymbol[symbol]++;
  });

  const averageConfidenceScore = stats.totalAnalyses > 0 
    ? (stats.confidenceSum / stats.totalAnalyses) 
    : 0;

  await db.collection('admin_analytics_daily').doc(dateStr).set({
    date: dateStr,
    totalAnalyses: stats.totalAnalyses,
    outcomes: {
      TP: stats.tpCount,
      SL: stats.slCount,
      BE: stats.beCount,
      NOT_TAKEN: stats.notTakenCount
    },
    averageConfidenceScore,
    byTradeMode: stats.byTradeMode,
    byStrategy: stats.byStrategy,
    bySymbol: stats.bySymbol,
    calculatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log(`Aggregation for ${dateStr} completed.`);
  return null;
});

// --- FUNCTION 2: OVERALL ANALYTICS AGGREGATION ---
// Scheduled daily maintenance of global stats
exports.aggregateOverallAnalytics = functions.pubsub.schedule('0 1 * * *').onRun(async (context) => {
  // Queries all documents with feedback (completed cycles)
  // Note: For very large datasets, this should be incremental. 
  // For now, we do a full scan as per requirements for "rolling overall".
  
  const snapshot = await db.collection('analysisHistory')
    .orderBy('feedback.outcome') // Only get docs with outcome set
    .get();

  const summary = {
    totalAnalysesWithFeedback: 0,
    outcomes: { TP: 0, SL: 0, BE: 0, NOT_TAKEN: 0 },
    confidenceBucketPerformance: {
      High: { total: 0, wins: 0 },
      Good: { total: 0, wins: 0 },
      Moderate: { total: 0, wins: 0 },
      Low: { total: 0, wins: 0 }
    },
    tradeModePerformance: {},
    strategyPerformance: {}
  };

  snapshot.forEach(doc => {
    const data = doc.data();
    if (!data.feedback || !data.feedback.outcome) return;

    const outcome = data.feedback.outcome;
    const score = data.signal ? (data.signal.confidence_score || 0) : 0;
    const bucket = getConfidenceBucket(score);
    const mode = data.execution_mode || 'unknown';
    const strategy = data.strategy_used || 'unknown';

    summary.totalAnalysesWithFeedback++;
    
    // Outcomes
    if (summary.outcomes[outcome] !== undefined) {
      summary.outcomes[outcome]++;
    }

    // Confidence Performance
    summary.confidenceBucketPerformance[bucket].total++;
    if (outcome === 'TP') summary.confidenceBucketPerformance[bucket].wins++;

    // Trade Mode Performance
    if (!summary.tradeModePerformance[mode]) summary.tradeModePerformance[mode] = { total: 0, tp: 0 };
    summary.tradeModePerformance[mode].total++;
    if (outcome === 'TP') summary.tradeModePerformance[mode].tp++;

    // Strategy Performance
    if (!summary.strategyPerformance[strategy]) summary.strategyPerformance[strategy] = { total: 0, tp: 0 };
    summary.strategyPerformance[strategy].total++;
    if (outcome === 'TP') summary.strategyPerformance[strategy].tp++;
  });

  await db.collection('admin_analytics_overall').doc('summary').set({
    ...summary,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
  });

  return null;
});

// --- FUNCTION 3: REAL-TIME FEEDBACK TRIGGER ---
// Updates daily and overall analytics when user submits feedback
exports.onAnalysisFeedback = functions.firestore
  .document('analysisHistory/{docId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only proceed if feedback changed or was added
    const beforeFeedback = before.feedback ? before.feedback.outcome : null;
    const afterFeedback = after.feedback ? after.feedback.outcome : null;

    if (beforeFeedback === afterFeedback) return null;

    const docDate = after.timestamp ? new Date(after.timestamp) : new Date();
    const dateStr = docDate.toISOString().split('T')[0];
    const dailyRef = db.collection('admin_analytics_daily').doc(dateStr);
    const overallRef = db.collection('admin_analytics_overall').doc('summary');

    await db.runTransaction(async (t) => {
      const dailyDoc = await t.get(dailyRef);
      const overallDoc = await t.get(overallRef);

      // Helper for incrementing/decrementing nested paths
      const updateCounts = (docData, outcome, delta) => {
        if (!docData) return;
        if (!docData.outcomes) docData.outcomes = { TP: 0, SL: 0, BE: 0, NOT_TAKEN: 0 };
        
        // Update generic outcome count
        if (docData.outcomes[outcome] !== undefined) {
          docData.outcomes[outcome] += delta;
        }
        
        // Update specific bucket logic for Overall if exists
        if (docData.confidenceBucketPerformance) {
           const bucket = getConfidenceBucket(after.signal?.confidence_score || 0);
           if (docData.confidenceBucketPerformance[bucket]) {
             docData.confidenceBucketPerformance[bucket].total += delta;
             if (outcome === 'TP') docData.confidenceBucketPerformance[bucket].wins += delta;
           }
        }
      };

      const dailyData = dailyDoc.exists ? dailyDoc.data() : { outcomes: { TP: 0, SL: 0, BE: 0, NOT_TAKEN: 0 } };
      const overallData = overallDoc.exists ? overallDoc.data() : { outcomes: { TP: 0, SL: 0, BE: 0, NOT_TAKEN: 0 } };

      // Remove old outcome count if existed
      if (beforeFeedback) {
        updateCounts(dailyData, beforeFeedback, -1);
        updateCounts(overallData, beforeFeedback, -1);
      }

      // Add new outcome count
      if (afterFeedback) {
        updateCounts(dailyData, afterFeedback, 1);
        updateCounts(overallData, afterFeedback, 1);
      }

      t.set(dailyRef, dailyData, { merge: true });
      t.set(overallRef, overallData, { merge: true });
    });

    return null;
  });
