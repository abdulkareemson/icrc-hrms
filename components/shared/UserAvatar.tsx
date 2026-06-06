// components/shared/UserAvatar.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials, stringToColor } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_MAP = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
} as const;

export function UserAvatar({
  name,
  imageUrl,
  size = "md",
  className,
}: UserAvatarProps) {
  const initials = getInitials(name);
  const bgColor = stringToColor(name);

  return (
    <Avatar className={cn(SIZE_MAP[size], className)}>
      {imageUrl && (
        <AvatarImage src={imageUrl} alt={`${name}'s profile photo`} />
      )}
      <AvatarFallback
        style={{ backgroundColor: bgColor }}
        className="text-white font-medium"
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
