
'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import { CardDescription, CardTitle } from './card';

interface TableToolbarProps {
  title: string;
  description: string;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  dateFilter?: string;
  onDateFilterChange?: (filter: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
  showDateFilter?: boolean;
}

export function TableToolbar({
  title,
  description,
  searchTerm,
  onSearchTermChange,
  dateFilter,
  onDateFilterChange,
  searchPlaceholder = "Search...",
  children,
  showDateFilter = true,
}: TableToolbarProps) {
  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </div>
      <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={searchPlaceholder}
            className="w-full rounded-lg bg-background pl-8"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
            {children}
            {showDateFilter && dateFilter && onDateFilterChange && (
            <Select
                value={dateFilter}
                onValueChange={(value) => {
                if (value) {
                    onDateFilterChange(value);
                }
                }}
            >
                <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
            </Select>
            )}
        </div>
      </div>
    </>
  );
}
