import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 squircle select-none',
  {
    variants: {
      variant: {
        default:     'bg-primary text-primary-foreground active:bg-primary/80',
        destructive: 'bg-destructive text-destructive-foreground active:bg-destructive/80',
        outline:     'border border-input bg-background active:bg-accent active:text-accent-foreground',
        secondary:   'bg-secondary text-secondary-foreground active:bg-secondary/60',
        ghost:       'active:bg-accent active:text-accent-foreground',
        link:        'text-primary underline-offset-4 active:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm:      'h-8 rounded-md px-3 text-xs',
        lg:      'h-11 rounded-xl px-8',
        icon:    'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export function Button({ className, variant, size, ...props }) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
