import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  className,
  containerClassName,
  id,
  ...props
}: InputProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            {leftIcon}
          </div>
        )}
        <input
          id={id}
          className={cn(
            "input-base",
            leftIcon && "!pl-10",
            rightIcon && "!pr-10",
            error && "border-red-500/50 focus:border-red-500 focus:shadow-none",
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

interface SearchInputProps extends Omit<InputProps, "leftIcon"> {
  onClear?: () => void;
}

export function SearchInput({ className, ...props }: SearchInputProps) {
  return (
    <Input
      leftIcon={<Search className="h-4 w-4" />}
      placeholder="Search…"
      className={className}
      {...props}
    />
  );
}
