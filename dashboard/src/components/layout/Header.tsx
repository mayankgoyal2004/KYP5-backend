import { Bell, Search, Sun, Moon, LogOut, User, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";

export function Header({ title }: { title: string }) {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between transition-all duration-300">
      <div className="flex flex-col">
        <h2 className="text-xl font-heading font-semibold text-foreground tracking-tight">
          {title}
        </h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Home</span>
          <span>/</span>
          <span className="text-foreground font-medium">{title}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* <div className="relative w-64 hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search grievances, projects..."
            className="pl-9 h-9 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:bg-background transition-all"
          />
        </div> */}
{/* 
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-destructive rounded-full border border-background"></span>
        </Button> */}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9 border border-border shadow-sm">
                <AvatarImage src={user?.avatarUrl || ""} alt={user?.name} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user?.name?.substring(0, 2).toUpperCase() || "CN"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                <p className="text-[10px] uppercase tracking-wider font-bold text-primary mt-1">
                  {user?.role?.name?.replace("_", " ")}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link to="/profile">
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
            </Link>
            <Link to="/change-password">
              <DropdownMenuItem className="cursor-pointer">
                <Key className="mr-2 h-4 w-4" />
                <span>Change Password</span>
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
              onClick={() => logout()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
