
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseAuthUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import type { UserRole, User } from '@/lib/types';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
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
      if (user) {
        setUser(user);
        
        // Explicitly check for superadmin email first
        if (user.email === SUPER_ADMIN_EMAIL) {
            const superAdminData: User = {
                uid: user.uid,
                email: user.email,
                name: user.displayName || 'Super Admin',
                role: 'superadmin',
                status: 'approved',
            };
            setUserData(superAdminData);
            setUserRole('superadmin');
            setManagerId(null);
        } else {
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const dbUser = userDocSnap.data() as User;
                if (dbUser.status === 'pending') {
                    auth.signOut();
                    router.push('/login?approval=pending');
                    setLoading(false);
                    return;
                }
                 if (dbUser.status === 'suspended') {
                    await auth.signOut();
                    router.push('/login?status=suspended');
                    setLoading(false);
                    return;
                }

                setUserData(dbUser);
                setUserRole(dbUser.role);

                if (dbUser.role === 'manager') {
                    setManagerId(user.uid);
                } else {
                    setManagerId(dbUser.managerId || null);
                }

            } else {
                // Handle case where user is authenticated but not in DB
                setUserRole(null);
                setUserData(null);
                setManagerId(null);
            }
        }
      } else {
        setUser(null);
        setUserData(null);
        setUserRole(null);
        setManagerId(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Separate effect for live updates on user data
  useEffect(() => {
    if (user?.uid && user.email !== SUPER_ADMIN_EMAIL) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubFromDoc = onSnapshot(userDocRef, (docSnap) => {
         if (docSnap.exists()) {
            const dbUser = docSnap.data() as User;
            if (dbUser.status === 'suspended') {
                auth.signOut();
                router.push('/login?status=suspended');
                return;
            }
            setUserData(dbUser);
            setUserRole(dbUser.role);
            if (dbUser.role === 'manager') {
              setManagerId(user.uid);
            } else {
              setManagerId(dbUser.managerId || null);
            }
         }
      });
      return () => unsubFromDoc();
    }
  }, [user?.uid, user?.email, router]);


  return (
    <AuthContext.Provider value={{ user, loading, userRole, userData, managerId }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
