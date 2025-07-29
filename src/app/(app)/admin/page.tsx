
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';

export default function AdminPage() {
  const { userRole } = useAuth();
  const router = useRouter();
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isViewUserOpen, setIsViewUserOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userRole && userRole !== 'superadmin') {
      router.push('/dashboard');
    }
  }, [userRole, router]);

  useEffect(() => {
    if (userRole === 'superadmin') {
      const q = query(collection(db, 'users'), where('status', '==', 'pending'), where('role', '==', 'manager'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
        setPendingUsers(usersData);
      });
      return () => unsubscribe();
    }
  }, [userRole]);

  const handleApproveUser = async (uid: string) => {
    try {
      const userDoc = doc(db, 'users', uid);
      await updateDoc(userDoc, { status: 'approved' });
      toast({
        title: 'Manager Approved',
        description: 'The manager has been approved and can now log in.',
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to approve manager.', variant: 'destructive' });
    }
  };

  const handleRejectUser = async (uid: string) => {
    try {
      const userDoc = doc(db, 'users', uid);
      await updateDoc(userDoc, { status: 'rejected' });
      toast({
        title: 'Manager Rejected',
        description: 'The manager has been rejected.',
        variant: 'destructive',
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to reject manager.', variant: 'destructive' });
    }
  }

  const handleViewClick = (user: User) => {
    setSelectedUser(user);
    setIsViewUserOpen(true);
  }

  if (userRole !== 'superadmin') {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <p>You do not have permission to view this page.</p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pending Manager Approvals</CardTitle>
          <CardDescription>
            The following managers have signed up and are awaiting approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {pendingUsers.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Business Name</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pendingUsers.map((user) => (
                            <TableRow key={user.uid}>
                                <TableCell>
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={user.avatar} alt={user.name || 'User'} />
                                            <AvatarFallback>{user.name?.[0].toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium">{user.name}</div>
                                            <div className="text-sm text-muted-foreground">{user.email}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="capitalize">{user.role}</TableCell>
                                <TableCell>{user.businessName || 'N/A'}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex gap-2 justify-end">
                                        <Button variant="outline" size="sm" onClick={() => handleViewClick(user)}>View Details</Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm">Reject</Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure you want to reject this manager?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. The user will not be able to log in.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleRejectUser(user.uid)}>
                                                    Confirm Reject
                                                </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                        <Button size="sm" onClick={() => handleApproveUser(user.uid)}>Approve</Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <p className="text-muted-foreground">There are no pending manager approvals at this time.</p>
            )}
        </CardContent>
      </Card>

      <Dialog open={isViewUserOpen} onOpenChange={setIsViewUserOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>User Details</DialogTitle>
                <DialogDescription>
                    Viewing details for {selectedUser?.name}.
                </DialogDescription>
            </DialogHeader>
            {selectedUser && (
                <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={selectedUser.avatar} alt={selectedUser.name || 'User'} />
                            <AvatarFallback>{selectedUser.name?.[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                            <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                        </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><strong>Role:</strong> <span className="capitalize">{selectedUser.role}</span></div>
                        <div><strong>Status:</strong> <span className="capitalize">{selectedUser.status}</span></div>
                        {selectedUser.username && (
                            <div><strong>Username:</strong> <span className="font-mono">{selectedUser.username}</span></div>
                        )}
                    </div>
                     {(selectedUser.businessName || selectedUser.mobileNumber || selectedUser.address) && (
                       <>
                         <Separator />
                          <div className="space-y-2 text-sm">
                            <h4 className="font-semibold">Business Information</h4>
                            <p><strong>Name:</strong> {selectedUser.businessName}</p>
                            <p><strong>Mobile:</strong> {selectedUser.mobileNumber}</p>
                            <p><strong>Address:</strong> {selectedUser.address}</p>
                          </div>
                       </>
                     )}
                </div>
            )}
            <DialogFooter>
                <DialogClose asChild>
                    <Button>Close</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
