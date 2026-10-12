'use client';


import { Button, type ButtonProps  } from "./button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { authService } from "@/services/auth.service";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";


interface LogoutButtonProps extends ButtonProps {
  showIcon?: boolean;
  className?: string;
}

export function LogoutButton({ 
  showIcon = false, 
  className,
  ...props 
}: LogoutButtonProps) {
  
  const router = useRouter();
  
  const logoutMutation = useMutation({
    mutationFn: authService.signOut,
    onSuccess: () => {
      toast.success("Logged out successfully");
      router.push('/landing');
      router.refresh();
    },
    onError: (error) => {
      toast.error("Failed to logout");
      console.error('Logout error:', error);
    }
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      disabled={logoutMutation.isPending}
      className={cn(className, "w-full")}
      {...props}
    >
      {showIcon && <LogOut className="mr-2 h-4 w-4" />}
      <span>Log out</span>
    </Button>
  );
}