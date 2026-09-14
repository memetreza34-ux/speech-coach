import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const loadProfile = useCallback(async (firebaseUser) => {
    setAuthError(null);
    try {
      const docRef = doc(db, 'users', firebaseUser.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      } else {
        const newProfile = {
          name: firebaseUser.displayName || '',
          role: '',
          age: '',
          hobbies: '',
          isPremium: false,
          createdAt: new Date().toISOString()
        };
        await setDoc(docRef, newProfile);
        setProfile(newProfile);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setAuthError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await loadProfile(firebaseUser);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [loadProfile]);

  const retryProfileLoad = () => {
    if (user) {
      setLoading(true);
      loadProfile(user);
    }
  };

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const deleteAccount = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error("Failed to delete account server-side");
      }
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error("Delete Account Error:", error);
      throw error;
    }
  };

  const deleteTrainingData = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/account/data', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error("Failed to delete training data server-side");
      }
    } catch (error) {
      console.error("Delete Data Error:", error);
      throw error;
    }
  };

  const updateProfile = async (updates) => {
    if (!user) return;
    try {
      const newProfile = { ...profile, ...updates };
      await setDoc(doc(db, 'users', user.uid), newProfile, { merge: true });
      setProfile(newProfile);
    } catch (error) {
      console.error("Profile Update Error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, authError, retryProfileLoad, loginWithGoogle, logout, deleteAccount, deleteTrainingData, updateProfile }}>
      {!loading && !authError && children}
      {authError && (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-sm w-full border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Verbindungsfehler</h2>
            <p className="text-slate-600 mb-6 text-sm">Profil konnte nicht geladen werden.</p>
            <button onClick={retryProfileLoad} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-indigo-700 w-full mb-3">Erneut versuchen</button>
            <button onClick={logout} className="text-slate-500 hover:text-slate-700 text-sm w-full">Abmelden</button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};
