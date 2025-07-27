
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseAuthUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import type { UserRole, User } from '@/lib/types';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';

const SUPER_ADMIN_EMAIL = 'apeuninepal.com@gmail.com';

interface AuthContextType {
  user: FirebaseAuthUser | null;
  loading: boolean;
  userRole: UserRole | null;
  userData: User | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userRole: null,
  userData: null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseAuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userData, setUserData] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Handle Super Admin
        if (user.email === SUPER_ADMIN_EMAIL) {
          setUserRole('superadmin');
          const superAdminData: User = {
            uid: user.uid,
            email: user.email,
            name: user.displayName || 'Super Admin',
            role: 'superadmin',
            status: 'approved',
          }
          setUserData(superAdminData);
          setLoading(false);
          return;
        }
        
        // Handle regular users
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const dbUser = userDoc.data() as User;
            if (dbUser.status === 'pending') {
                auth.signOut();
                setUser(null);
                setUserData(null);
                setUserRole(null);
            } else {
                setUserData(dbUser);
                setUserRole(dbUser.role);
            }
        } else {
            // This case handles users who signed up but haven't completed business info
            // or google sign in users not yet in db
            if (user.providerData.some(p => p.providerId === 'password') && !user.displayName) {
              // This is likely a user who hasn't finished step 2
              // The login page logic will handle redirecting them. We just don't set a role here.
               setUserRole(null);
               setUserData(null);
            } else {
              // User might be from Google Sign-In, not yet in DB
              setUserRole('customer');
              setUserData(null);
            }
        }
        setLoading(false);

      } else {
        setUserRole(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, userRole, userData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
