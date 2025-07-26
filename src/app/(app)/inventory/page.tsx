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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { mockInventoryTransactions } from '@/lib/mock-data';
import { format } from 'date-fns';

export default function InventoryPage() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Inventory Transactions</CardTitle>
          <CardDescription>Track all stock movements.</CardDescription>
        </div>
        <Button size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Transaction
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="text-right">Quantity Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockInventoryTransactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>{format(tx.date, 'MMM d, yyyy p')}</TableCell>
                <TableCell className="font-medium">{tx.productName}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">{tx.reason}</Badge>
                </TableCell>
                <TableCell className={`text-right font-medium ${tx.qtyChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.qtyChange > 0 ? `+${tx.qtyChange}` : tx.qtyChange}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
