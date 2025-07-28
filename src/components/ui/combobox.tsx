
"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "./input"

interface ComboboxProps {
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    inputPlaceholder?: string;
}

export function Combobox({ options, value, onChange, placeholder, inputPlaceholder }: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value || '')

  React.useEffect(() => {
    setInputValue(value || '')
  }, [value])
  
  const handleSelect = (currentValue: string) => {
    const newValue = currentValue === inputValue ? "" : currentValue
    onChange(newValue)
    setInputValue(newValue)
    setOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newInputValue = e.target.value;
      setInputValue(newInputValue);
      onChange(newInputValue);
  }

  const filteredOptions = options.filter(option => option.label.toLowerCase().includes(inputValue.toLowerCase()));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input 
            value={inputValue} 
            onChange={handleInputChange} 
            placeholder={inputPlaceholder}
            className="w-full"
            onClick={() => setOpen(true)}
            />
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className="absolute right-0 top-0 h-full px-2"
            onClick={() => setOpen((prev) => !prev)}
          >
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandList>
            {filteredOptions.length === 0 && inputValue && (
                <CommandEmpty>No customer found.</CommandEmpty>
            )}
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      inputValue === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
