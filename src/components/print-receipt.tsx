
'use client';

import React from 'react';
import type { Order, User } from '@/lib/types';
import { Separator } from './ui/separator';
import { format } from 'date-fns';
import { Icons } from './icons';
import QRCode from 'react-qr-code';

interface PrintReceiptProps {
  order: Order;
  businessInfo?: Partial<User> | null;
}

export const PrintReceipt = React.forwardRef<HTMLDivElement, PrintReceiptProps>(({ order, businessInfo }, ref) => {
  const qrValue = JSON.stringify({
    tokenNumber: order.tokenNumber,
    totalPrice: order.totalPrice.toFixed(2),
    date: order.createdAt.toISOString(),
    customer: order.customerName || 'N/A',
    table: order.tableNumber || 'N/A',
  });
  
  return (
    <div ref={ref} className="p-4 bg-white text-black text-sm font-sans">
        <div className="text-center space-y-2 mb-6">
            <Icons.logo className="h-12 w-12 mx-auto text-black" />
            <h2 className="text-xl font-bold font-headline">{businessInfo?.businessName || 'KhaGo'}</h2>
            <p>{businessInfo?.address || '123 Main Street, Kathmandu, Nepal'}</p>
            <p>{businessInfo?.mobileNumber || '+977-9800000000'}</p>
            <Separator className="bg-black/50" />
        </div>

        <div className="grid grid-cols-2 gap-x-4 mb-4">
            <div><strong>Order:</strong> #{order.tokenNumber}</div>
            <div className="text-right"><strong>Date:</strong> {format(order.createdAt, 'PPp')}</div>
            {order.tableNumber && <div><strong>Table:</strong> {order.tableNumber}</div>}
            {order.customerName && <div className={order.tableNumber ? 'text-right' : ''}><strong>Customer:</strong> {order.customerName}</div>}
        </div>

        <Separator className="bg-black/50 my-2" />
        
        <table className="w-full">
            <thead>
                <tr className="border-b border-black/50">
                    <th className="text-left font-bold py-2">Item</th>
                    <th className="text-center font-bold py-2">Qty</th>
                    <th className="text-right font-bold py-2">Price</th>
                    <th className="text-right font-bold py-2">Total</th>
                </tr>
            </thead>
            <tbody>
                {order.products.map(p => (
                    <tr key={p.productId}>
                        <td className="py-1">{p.name}</td>
                        <td className="text-center py-1">{p.qty}</td>
                        <td className="text-right py-1">{(p.price).toFixed(2)}</td>
                        <td className="text-right py-1">{(p.price * p.qty).toFixed(2)}</td>
                    </tr>
                ))}
            </tbody>
        </table>

        <Separator className="bg-black/50 my-2" />

        <div className="space-y-1">
            <div className="flex justify-between">
                <span>Subtotal</span>
                <span>NPR {order.subtotal.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
                <div className="flex justify-between">
                    <span>Discount</span>
                    <span>- NPR {order.discount.toFixed(2)}</span>
                </div>
            )}
             {order.tip > 0 && (
                <div className="flex justify-between">
                    <span>Tip</span>
                    <span>+ NPR {order.tip.toFixed(2)}</span>
                </div>
            )}
             <div className="flex justify-between font-bold text-base border-t border-dashed border-black/50 pt-2 mt-2">
                <span>Total</span>
                <span>NPR {order.totalPrice.toFixed(2)}</span>
            </div>
        </div>

        {order.notes && (
            <>
                <Separator className="bg-black/50 my-2" />
                <div>
                    <h4 className="font-bold mb-1">Notes:</h4>
                    <p>{order.notes}</p>
                </div>
            </>
        )}
        
        <div className="mt-6 flex flex-col items-center justify-center space-y-2">
          <QRCode value={qrValue} size={100} />
          <p className="text-xs">Scan for details</p>
        </div>

        <div className="text-center mt-6">
            <p>Thank you for your visit!</p>
        </div>
    </div>
  );
});

PrintReceipt.displayName = 'PrintReceipt';
