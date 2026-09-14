import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, deleteUser } from 'firebase/auth';
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
        try {
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
        } catch (error) {
          console.error("Error loading profile:", error);
          // Set a basic profile so the app doesn't break, but ideally show an error state
          setProfile({ name: firebaseUser.displayName || '', isPremium: false });
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

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
      await deleteUser(user);
    } catch (error) {
      console.error("Delete Account Error:", error);
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
    <AuthContext.Provider value={{ user, profile, loading, loginWithGoogle, logout, deleteAccount, updateProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
