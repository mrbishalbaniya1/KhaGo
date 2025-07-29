
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { User } from '@/lib/types';
import { userSchema, userRoles as allRoles } from '@/lib/types';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, query, where, getDocs, setDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { Separator } from '@/components/ui/separator';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { getApp, initializeApp, deleteApp } from 'firebase/app';


const employeeRoles = allRoles.filter(role => !['superadmin', 'admin', 'manager', 'customer'].includes(role));
const managerRoles = allRoles.filter(role => role === 'manager');

async function generateUniqueUsername(businessName: string): Promise<string> {
    const baseUsername = businessName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
    let username = baseUsername;
    let counter = 1;
    while (true) {
        const q = query(collection(db, 'users'), where('username', '==', username));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return username;
        }
        username = `${baseUsername}${counter}`;
        counter++;
    }
}

const addManagerSchema = userSchema.extend({
    businessName: z.string().min(1, 'Business name is required.'),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
});


export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isViewUserOpen, setIsViewUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();
  const { user, userRole, userData } = useAuth();

  useEffect(() => {
    if (!user) return;

    let q;
    if (userRole === 'superadmin') {
        q = query(collection(db, 'users'), where('role', '==', 'manager'));
    } else if (userRole === 'manager' && user.uid) {
        q = query(collection(db, 'users'), where('managerId', '==', user.uid));
    } else {
        return;
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData: User[] = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
      setUsers(usersData);
    });

    return () => unsubscribe();
  }, [user, userRole]);

  const addUserForm = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      role: userRole === 'superadmin' ? 'manager' : 'employee',
      status: 'approved',
      mobileNumber: '',
      address: '',
    },
  });

   const addManagerForm = useForm<z.infer<typeof addManagerSchema>>({
    resolver: zodResolver(addManagerSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'manager',
      status: 'approved',
      businessName: '',
      mobileNumber: '',
      address: '',
      password: '',
    },
  });

  const editUserForm = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
  });

  const onAddUserSubmit = async (values: z.infer<typeof userSchema | typeof addManagerSchema>) => {
    if (!user || !userData) return;

    const managerId = userRole === 'manager' ? user.uid : userData.managerId;
    if (!managerId && userRole !== 'superadmin') return;
    
    let success = false;

    try {
      let newUser: Partial<User> = {
        name: values.name,
        email: values.email,
        role: values.role,
        status: 'approved',
        mobileNumber: values.mobileNumber,
        address: values.address,
        avatar: `https://i.pravatar.cc/150?u=${Date.now()}`,
      };

      if (userRole === 'manager') {
        newUser.managerId = managerId;
        await addDoc(collection(db, 'users'), newUser);
        success = true;
      } else if (userRole === 'superadmin' && 'businessName' in values && 'password' in values) {
        
        const tempAppName = `temp-app-${Date.now()}`;
        const mainAppConfig = getApp().options;
        const tempApp = initializeApp(mainAppConfig, tempAppName);
        const tempAuth = getAuth(tempApp);

        try {
            const userCredential = await createUserWithEmailAndPassword(tempAuth, values.email, values.password);
            const newAuthUser = userCredential.user;
            
            newUser.uid = newAuthUser.uid;
            newUser.businessName = values.businessName;
            newUser.username = await generateUniqueUsername(values.businessName);

            await setDoc(doc(db, 'users', newAuthUser.uid), newUser);
            success = true;
        } catch (error: any) {
            console.error(error);
            let message = 'Failed to add user.';
            if (error.code === 'auth/email-already-in-use') {
                message = 'This email is already registered.';
            }
            toast({ title: 'Error', description: message, variant: 'destructive' });
        } finally {
            await deleteApp(tempApp);
        }
      }

      if (success) {
          toast({
            title: 'User Added',
            description: `${values.name} has been added successfully.`,
          });
          addUserForm.reset();
          addManagerForm.reset();
          setIsAddUserOpen(false);
      }
    } catch (error: any) {
      console.error(error);
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    }
  };


  const onEditUserSubmit = async (values: z.infer<typeof userSchema>) => {
    if (!selectedUser) return;
    try {
      const userDoc = doc(db, 'users', selectedUser.uid);
      await updateDoc(userDoc, values);
      toast({
        title: 'User Updated',
        description: `${values.name}'s information has been updated.`,
      });
      setIsEditUserOpen(false);
      setSelectedUser(null);
    } catch (error) {
       toast({ title: 'Error', description: 'Failed to update user.', variant: 'destructive' });
    }
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    editUserForm.reset({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    setIsEditUserOpen(true);
  };
  
  const handleViewClick = (user: User) => {
    setSelectedUser(user);
    setIsViewUserOpen(true);
  }

  const handleDeleteUser = async (uid: string) => {
    // Note: Deleting from Firestore. Auth user deletion would need a server-side function.
    try {
      await deleteDoc(doc(db, 'users', uid));
      toast({
        title: 'User Deleted',
        description: 'The user has been removed successfully.',
        variant: 'destructive'
      });
    } catch (error) {
       toast({ title: 'Error', description: 'Failed to delete user.', variant: 'destructive' });
    }
  };

  const handleSuspendUser = async (uid: string) => {
    try {
      const userDoc = doc(db, 'users', uid);
      await updateDoc(userDoc, { status: 'suspended' });
      toast({
        title: 'User Suspended',
        description: 'The user has been suspended and can no longer log in.',
        variant: 'destructive',
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to suspend user.', variant: 'destructive' });
    }
  };

  const handleUnsuspendUser = async (uid: string) => {
    try {
      const userDoc = doc(db, 'users', uid);
      await updateDoc(userDoc, { status: 'approved' });
      toast({
        title: 'User Unsuspended',
        description: 'The user has been unsuspended and can now log in.',
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to unsuspend user.', variant: 'destructive' });
    }
  };
  
  if (userRole !== 'manager' && userRole !== 'superadmin') {
      return (
          <div className="flex h-full w-full items-center justify-center">
              <p>You do not have permission to view this page.</p>
          </div>
      );
  }

  const pageTitle = userRole === 'superadmin' ? 'Managers' : 'Team Members';
  const pageDescription = userRole === 'superadmin' ? 'Manage all restaurant managers.' : 'Manage your team members and their roles.';
  const availableRoles = userRole === 'superadmin' ? managerRoles : employeeRoles;
  const addButtonLabel = userRole === 'superadmin' ? 'Add Manager' : 'Add Employee';
  const dialogTitle = userRole === 'superadmin' ? 'Add New Manager' : 'Add New Employee';
  const dialogDescription = userRole === 'superadmin' ? 'Fill in the details to add a new manager.' : 'Fill in the details to invite a new employee.';
  const currentForm = userRole === 'superadmin' ? addManagerForm : addUserForm;


  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{pageTitle}</CardTitle>
            <CardDescription>{pageDescription}</CardDescription>
          </div>
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogTrigger asChild>
                <Button size="sm">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    {addButtonLabel}
                </Button>
                </DialogTrigger>
                <DialogContent>
                <DialogHeader>
                    <DialogTitle>{dialogTitle}</DialogTitle>
                    <DialogDescription>{dialogDescription}</DialogDescription>
                </DialogHeader>
                <Form {...currentForm}>
                    <form
                    onSubmit={currentForm.handleSubmit(onAddUserSubmit)}
                    className="space-y-4"
                    >
                    <FormField
                        control={currentForm.control}
                        name="name"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g., Hari Bahadur" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={currentForm.control}
                        name="mobileNumber"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Mobile Number</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g., 98xxxxxxxx" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={currentForm.control}
                        name="email"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                            <Input
                                type="email"
                                placeholder="e.g., hari@example.com"
                                {...field}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    {userRole === 'superadmin' && (
                       <>
                        <FormField
                            control={addManagerForm.control}
                            name="password"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={addManagerForm.control}
                            name="businessName"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Business Name</FormLabel>
                                <FormControl>
                                <Input placeholder="e.g., Awesome Restaurant" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                       </>
                    )}
                    <FormField
                        control={currentForm.control}
                        name="address"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g., Kathmandu, Nepal" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={currentForm.control}
                        name="role"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            >
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {availableRoles.map(role => (
                                <SelectItem key={role} value={role} className="capitalize">{role}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <DialogFooter>
                        <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">Add User</Button>
                    </DialogFooter>
                    </form>
                </Form>
                </DialogContent>
            </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.uid}>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={user.avatar}
                          alt={user.name || 'User'}
                        />
                        <AvatarFallback>
                          {user.name?.[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <button onClick={() => handleViewClick(user)} className="font-medium text-left hover:underline">
                          {user.name}
                        </button>
                        <div className="text-sm text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                      <Badge variant={user.status === 'approved' ? 'default' : user.status === 'suspended' ? 'destructive' : 'secondary'} className={`capitalize ${user.status === 'approved' ? 'bg-green-500' : ''}`}>
                          {user.status}
                      </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleViewClick(user)}>View</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditClick(user)}>
                          Edit
                        </DropdownMenuItem>
                        {user.status === 'suspended' ? (
                            <DropdownMenuItem onClick={() => handleUnsuspendUser(user.uid)}>
                                Unsuspend
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem onClick={() => handleSuspendUser(user.uid)} className="text-destructive">
                                Suspend
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the user account.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteUser(user.uid)}>
                                  Delete
                                  </AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>

        {/* Edit User Dialog */}
        <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update the user's details below.
              </DialogDescription>
            </DialogHeader>
            <Form {...editUserForm}>
              <form
                onSubmit={editUserForm.handleSubmit(onEditUserSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={editUserForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editUserForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editUserForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableRoles.map(role => (
                              <SelectItem key={role} value={role} className="capitalize">{role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={editUserForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {['pending', 'approved', 'rejected', 'suspended'].map(status => (
                              <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
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
    </>
  );
}
