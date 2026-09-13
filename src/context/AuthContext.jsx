import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Fetch or create profile
        const docRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        } else {
          // Defaults for new user
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
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
  const logout = () => signOut(auth);

  const updateProfile = async (updates) => {
    if (!user) return;
    const newProfile = { ...profile, ...updates };
    await setDoc(doc(db, 'users', user.uid), newProfile, { merge: true });
    setProfile(newProfile);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, loginWithGoogle, logout, updateProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
