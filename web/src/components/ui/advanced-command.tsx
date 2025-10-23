import * as React from 'react';
import { type DialogProps } from '@radix-ui/react-dialog';
import { Command as CommandPrimitive } from 'cmdk';
import { Search, Mic, X as X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      'flex h-full w-full flex-col overflow-hidden rounded-md bg-white text-slate-950 dark:bg-slate-950 dark:text-slate-50',
      className
    )}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

interface CommandDialogProps extends DialogProps {
  onVoiceSearch?: () => void;
  showVoiceSearch?: boolean;
}

const CommandDialog = ({
  children,
  onVoiceSearch: _onVoiceSearch,
  showVoiceSearch: _showVoiceSearch = false,
  ...props
}: CommandDialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-slate-500 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
};

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input> & {
    onVoiceSearch?: () => void;
    showVoiceSearch?: boolean;
  }
>(({ className, onVoiceSearch, showVoiceSearch = false, ...props }, ref) => (
  <div
    className="flex items-center border-b border-slate-200 px-3 dark:border-slate-800"
    cmdk-input-wrapper=""
  >
    <Search className="mr-2 h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50 dark:placeholder:text-slate-400',
        className
      )}
      {...props}
    />
    {showVoiceSearch && onVoiceSearch && (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
        onClick={onVoiceSearch}
        type="button"
      >
        <Mic className="h-4 w-4" />
        <span className="sr-only">Voice search</span>
      </Button>
    )}
  </div>
));

CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn(
      'max-h-[300px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent dark:scrollbar-thumb-slate-800',
      className
    )}
    {...props}
  />
));

CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className={cn('py-6 text-center text-sm text-slate-500 dark:text-slate-400', className)}
    {...props}
  />
));

CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      'overflow-hidden p-1 text-slate-950 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-slate-500 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider dark:text-slate-50 dark:[&_[cmdk-group-heading]]:text-slate-400',
      className
    )}
    {...props}
  />
));

CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 h-px bg-slate-200 dark:bg-slate-800', className)}
    {...props}
  />
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item> & {
    shortcut?: string;
    nutritionBadge?: 'vegan' | 'vegetarian' | 'gluten-free' | 'high-protein';
  }
>(({ className, shortcut, nutritionBadge, children, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-slate-100 aria-selected:text-slate-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:aria-selected:bg-slate-800 dark:aria-selected:text-slate-50',
      className
    )}
    {...props}
  >
    <div className="flex-1 flex items-center space-x-2">
      {children}
      {nutritionBadge && (
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
            nutritionBadge === 'vegan' &&
              'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
            nutritionBadge === 'vegetarian' &&
              'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
            nutritionBadge === 'gluten-free' &&
              'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
            nutritionBadge === 'high-protein' &&
              'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
          )}
        >
          {nutritionBadge === 'vegan' && '🌱'}
          {nutritionBadge === 'vegetarian' && '🥬'}
          {nutritionBadge === 'gluten-free' && '🌾'}
          {nutritionBadge === 'high-protein' && '💪'}
          {nutritionBadge.replace('-', ' ')}
        </span>
      )}
    </div>
    {shortcut && (
      <span className="ml-auto text-xs tracking-widest text-slate-500 dark:text-slate-400">
        {shortcut}
      </span>
    )}
  </CommandPrimitive.Item>
));

CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        'ml-auto text-xs tracking-widest text-slate-500 dark:text-slate-400',
        className
      )}
      {...props}
    />
  );
};
CommandShortcut.displayName = 'CommandShortcut';

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
