import { useState, InputHTMLAttributes, ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  leftIcon?: ReactNode;
}

export default function PasswordInput({ leftIcon, className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      {leftIcon}
      <input type={visible ? "text" : "password"} className={className} {...props} />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
