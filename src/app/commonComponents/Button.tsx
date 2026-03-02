import React from "react";

export type ButtonVariant = "filled" | "outline" | "tonal" | "text";
export type ButtonSize = "sm" | "md" | "lg" | "xl" | "2xl";
export type ButtonShape = "round" | "square";

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  type?: "button" | "submit" | "reset";
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  label: string;
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  disabled?: boolean;
  title?: string;
  fullWidth?: boolean;
  value?: string;
}

const Button: React.FC<ButtonProps> = ({
  variant = "filled",
  size = "md",
  shape = "round",
  type = "button",
  onClick,
  label,
  className = "",
  icon,
  iconPosition = "left",
  disabled = false,
  title,
  fullWidth = false,
  value,
}) => {
  
  const baseClasses = `
  inline-flex items-center justify-center gap-2 
  font-semibold transition-all duration-200 
  no-underline whitespace-nowrap relative overflow-hidden 
  disabled:opacity-38 disabled:cursor-not-allowed 
  disabled:pointer-events-none cursor-pointer
  [&_svg]:fill-current [&_svg]:stroke-current
`;
  
  const sizeClasses = {
    sm: "min-h-[32px] text-label-l2 px-xsm [&_svg]:w-4 [&_svg]:h-4",
    md: "min-h-[40px] text-label-l3 px-sm [&_svg]:w-5 [&_svg]:h-5",
    lg: "min-h-[48px] text-label-l4 px-md [&_svg]:w-6 [&_svg]:h-6",
    xl: "min-h-[56px] text-h6 px-xlg [&_svg]:w-7 [&_svg]:h-7",
    "2xl": "min-h-[64px] text-h5 px-xxlg [&_svg]:w-8 [&_svg]:h-8",
  };

  const radiusClasses = {
    round: {
      sm: "rounded-xsm",
      md: "rounded-sm",
      lg: "rounded-md",
      xl: "rounded-lg",
      "2xl": "rounded-xlg",
    },
    square: {
      sm: "rounded-xxsm",
      md: "rounded-xsm",
      lg: "rounded-sm",
      xl: "rounded-md",
      "2xl": "rounded-lg",
    },
  };

  const variantClasses = {
    filled: {
      default: "bg-primary-900 text-base-white hover:bg-primary-50 hover:text-primary-800 active:bg-primary-800 active:text-base-white focus-visible:outline-2 focus-visible:outline-primary-500 focus-visible:outline-offset-2",
      disabled: "bg-neutral-200 text-neutral-700",
    },
    outline: {
      default: "border-2 border-primary-900 text-primary-900 bg-transparent hover:bg-primary-900 hover:text-white active:border-primary-800 active:text-primary-800 focus-visible:outline-2 focus-visible:outline-primary-500 focus-visible:outline-offset-2",
      disabled: "border-neutral-200 text-neutral-700 bg-transparent",
    },
    tonal: {
      default: "bg-secondary-500 text-base-white hover:bg-secondary-400 active:bg-secondary-600 focus-visible:outline-2 focus-visible:outline-secondary-500 focus-visible:outline-offset-2",
      disabled: "bg-neutral-200 text-neutral-700",
    },
    text: {
      default: "text-primary-900 bg-transparent hover:text-primary-50 active:text-primary-900 focus-visible:outline-2 focus-visible:outline-primary-500 focus-visible:outline-offset-2",
      disabled: "text-neutral-700 bg-transparent",
    },
  };

  const iconSpacing = {
    left: icon ? "flex-row" : "",
    right: icon ? "flex-row-reverse" : "",
  };

  const widthClass = fullWidth ? "w-full" : "";

  const variantStateClass = disabled 
    ? variantClasses[variant].disabled 
    : variantClasses[variant].default;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      title={title}
      value={value}
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${radiusClasses[shape][size]}
        ${variantStateClass}
        ${iconSpacing[iconPosition]}
        ${widthClass}
        ${className}
      `}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="btn-label">{label}</span>
    </button>
  );
};

export default Button;