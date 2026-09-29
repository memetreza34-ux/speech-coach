import { useState, useEffect } from 'react'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import { db } from './lib/firebase'

// Alle Sessions, neueste zuerst. Dashboard, Analyse und Profil nutzen dieselben Daten,
// damit Level und Streak überall gleich sind.
export function useSessionHistory(user) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const q = query(collection(db, 'users', user.uid, 'sessions'), orderBy('date', 'desc'));
    getDocs(q)
      .then(snap => { if (!cancelled) setHistory(snap.docs.map(d => d.data())); })
      .catch(e => {
        console.error('Sessions konnten nicht geladen werden:', e);
        if (!cancelled) setError(true);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  return { history, setHistory, loading, error };
}
