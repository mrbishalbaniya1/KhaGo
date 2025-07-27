
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import type { UserRole } from '@/lib/types';
import { doc, onSnapshot } from 'firebase/firestore';

const SUPER_ADMIN_EMAIL = 'apeuninepal.com@gmail.com';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userRole: UserRole | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userRole: null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        // Handle Super Admin
        if (user.email === SUPER_ADMIN_EMAIL) {
          setUserRole('superadmin');
          setLoading(false);
          return;
        }
        
        // Handle regular users
        const userDocRef = doc(db, 'users', user.uid);
        const unsubUser = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setUserRole(doc.data().role as UserRole);
          } else {
            setUserRole('customer'); // Default role if not in DB
          }
          setLoading(false);
        });
        return () => unsubUser();

      } else {
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, userRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
