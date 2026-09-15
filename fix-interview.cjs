const fs = require('fs');
let code = fs.readFileSync('src/screens/InterviewFlow.jsx', 'utf8');

// Add failedTurnContext state
code = code.replace(/const \[isProcessing, setIsProcessing\] = useState\(false\);/, `const [isProcessing, setIsProcessing] = useState(false);
  const [failedTurnContext, setFailedTurnContext] = useState(null);`);

code = code.replace(/const { profile } = useAuth\(\);/, `const { profile } = useAuth();
  const { addToast } = useToast();`);

// Fix sendTurn logic
const sendTurnReplace = `      if (response.ok) {
        setFailedTurnContext(null);
        const data = await response.json();
        
        // Add AI response to messages
        setMessages(prev => [...prev, { role: 'model', text: data.interviewerSpeech }]);
        if (data.feedback) setFeedback(data.feedback);
        
        // Read out loud
        speakText(data.interviewerSpeech);
        
        if (data.isFinished) {
          // Final Evaluation via /api/analyze
          const completeHistory = [...chatHistory, { role: 'model', text: data.interviewerSpeech }];
          const finalTranscript = completeHistory.filter(m => m.text !== 'Wir starten jetzt. Stelle dich als Interviewer vor und stelle die allererste Frage.').map(m => \`\${m.role === 'user' ? 'Du' : 'Interviewer'}: \${m.text}\`).join('\\n\\n');
          
          const finalWpm = currentMetrics.totalDurationMs > 0 ? Math.round((currentMetrics.totalWords / (currentMetrics.totalDurationMs / 1000 / 60))) : 0;
          
          const finalSpeakingRatio = currentMetrics.totalDurationMs > 0 
            ? Math.round(currentMetrics.weightedSpeakingRatioSum / currentMetrics.totalDurationMs)
            : 0;
          
          const finalDynamics = currentMetrics.totalDurationMs > 0
            ? Math.round(currentMetrics.weightedDynamicsSum / currentMetrics.totalDurationMs)
            : 0;

          const finalMetrics = {
             wpm: finalWpm || 0,
             pauseCount: currentMetrics.totalPauseCount || 0,
             longestPauseMs: currentMetrics.maxPauseMs || 0,
             speakingRatio: finalSpeakingRatio || 0,
             dynamics: finalDynamics || 0,
             durationMs: currentMetrics.totalDurationMs || 0
          };

          let aiFeedback = null;
          let aiStatus = 'not_available';
          try {
             const analyzeRes = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
                body: JSON.stringify({
                  mode: modeId,
                  transcript: finalTranscript || "Keine Antwort gegeben.",
                  metrics: finalMetrics,
                  profile,
                  customPrompt: "Bewerte das Live-Interview abschließend und gib einen Gesamt-Score."
                })
             });
             if (analyzeRes.ok) {
                 aiFeedback = await analyzeRes.json();
                 aiStatus = 'success';
             } else {
                 if (analyzeRes.status === 429) aiStatus = 'quota_exceeded';
                 else if (analyzeRes.status === 504) aiStatus = 'timeout';
                 else if (analyzeRes.status === 502) aiStatus = 'invalid_response';
                 else aiStatus = 'server_error';
             }
          } catch(e) {
             console.error("Evaluation error", e);
             aiStatus = 'server_error';
          }
          
          // Save session
          if (auth.currentUser) {
            const sessionRef = doc(collection(db, 'users', auth.currentUser.uid, 'sessions'));
            await setDoc(sessionRef, {
              mode: modeId,
              modeLabel: modeTitle(modeId),
              date: new Date().toISOString(),
              createdAt: serverTimestamp(),
              sessionType: 'interview',
              fillers: aiFeedback?.fillers ?? null,
              confidenceScore: aiFeedback?.confidenceScore ?? null,
              aiTip: aiFeedback?.aiTip ?? null,
              aiStatus: aiStatus,
              wpm: finalMetrics.wpm,
              dynamics: finalMetrics.dynamics,
              speakingRatio: finalMetrics.speakingRatio,
              pauseCount: finalMetrics.pauseCount,
              longestPauseMs: finalMetrics.longestPauseMs,
              durationMs: finalMetrics.durationMs,
              transcript: finalTranscript
            }).catch(console.error);
          }
          setTimeout(() => navigate('/dashboard'), 5000);
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        let errMsg = 'Ein Fehler ist aufgetreten.';
        if (response.status === 429) errMsg = 'Dein tägliches Live-Interview-Limit ist erreicht.';
        else if (response.status === 403) errMsg = 'Live-Interviews erfordern ein Premium-Abonnement.';
        else if (response.status === 504) errMsg = 'Die KI antwortet gerade nicht. Versuche es erneut.';
        else if (response.status === 500 || response.status === 502) errMsg = errData.error || 'Verbindung fehlgeschlagen.';
        
        addToast(errMsg, 'error');
        setFailedTurnContext(chatHistory);
      }`;
      
code = code.replace(/if \(response\.ok\) \{[\s\S]*\}\n\s*\} catch \(e\) \{/g, sendTurnReplace + '\n    } catch (e) {');

fs.writeFileSync('src/screens/InterviewFlow.jsx', code);
