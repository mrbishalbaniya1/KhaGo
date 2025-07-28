
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseAuthUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import type { UserRole, User } from '@/lib/types';
import { doc, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

const SUPER_ADMIN_EMAIL = 'apeuninepal.com@gmail.com';

interface AuthContextType {
  user: FirebaseAuthUser | null;
  loading: boolean;
  userRole: UserRole | null;
  userData: User | null;
  managerId: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userRole: null,
  userData: null,
  managerId: null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseAuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [managerId, setManagerId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        if (user.email === SUPER_ADMIN_EMAIL) {
          setUserRole('superadmin');
          const superAdminData: User = {
            uid: user.uid,
            email: user.email!,
            name: user.displayName || 'Super Admin',
            role: 'superadmin',
            status: 'approved',
          }
          setUserData(superAdminData);
          setManagerId(null);
          setLoading(false);
          return;
        }
        
        const userDocRef = doc(db, 'users', user.uid);
        const userDocUnsubscribe = onSnapshot(userDocRef, (userDoc) => {
            if (userDoc.exists()) {
                const dbUser = userDoc.data() as User;
                if (dbUser.status === 'pending') {
                    auth.signOut();
                    router.push('/login?approval=pending');
                } else {
                    setUserData(dbUser);
                    setUserRole(dbUser.role);
                    if (dbUser.role === 'manager') {
                        setManagerId(dbUser.uid);
                    } else if (dbUser.managerId) {
                        setManagerId(dbUser.managerId);
                    } else {
                        setManagerId(null);
                    }
                }
            } else {
                 // User might not be in DB yet (e.g. during signup)
                 setUserRole(null);
                 setUserData(null);
                 setManagerId(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error in userDoc snapshot listener:", error);
            setLoading(false);
        });
        
        return () => userDocUnsubscribe();

      } else {
        setUser(null);
        setUserData(null);
        setUserRole(null);
        setManagerId(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, userRole, userData, managerId }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
