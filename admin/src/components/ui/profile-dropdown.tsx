"use client";

import { CreditCard, FileText, LogOut, Settings, User, ShieldAlert } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { logout } from "@/app/login/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Profile {
  name: string;
  email: string;
  avatar: string;
  subscription?: string;
  model?: string;
}

interface MenuItem {
  label: string;
  value?: string;
  href: string;
  icon: React.ReactNode;
  external?: boolean;
}

interface ProfileDropdownProps extends React.HTMLAttributes<HTMLDivElement> {
  data: Profile;
  showTopbar?: boolean;
  isSuperAdmin?: boolean;
}

export default function ProfileDropdown({
  data,
  className,
  isSuperAdmin,
  ...props
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const baseItems: MenuItem[] = [
    {
      label: "Аккаунт",
      href: "/account",
      icon: <User className="h-4 w-4" />,
    },
    {
      label: "Справка / FAQ",
      href: "/docs",
      icon: <FileText className="h-4 w-4" />,
    },
  ];

  const menuItems: MenuItem[] = isSuperAdmin
    ? [
        {
          label: "Админка",
          href: "/superadmin",
          icon: <ShieldAlert className="h-4 w-4" />,
        },
        ...baseItems,
      ]
    : baseItems;

  return (
    <div className={cn("relative", className)} {...props}>
      <DropdownMenu onOpenChange={setIsOpen}>
        <div className="group relative">
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex cursor-pointer items-center gap-4 rounded-xl border border-zinc-200/60 bg-white py-2 px-3 transition-all duration-200 hover:border-zinc-300 hover:bg-zinc-50/80 hover:shadow-sm focus:outline-none dark:border-zinc-800/60 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/40"
              />
            }
          >
            <div className="flex-1 text-left">
              <div className="font-medium text-sm text-zinc-900 leading-tight tracking-tight dark:text-zinc-100">
                {data.name}
              </div>
              <div className="text-xs text-zinc-500 leading-tight tracking-tight dark:text-zinc-400">
                {data.email}
              </div>
            </div>
          </DropdownMenuTrigger>

          {/* Bending line indicator on the right */}
          <div
            className={cn(
              "absolute top-1/2 -right-3 -translate-y-1/2 transition-all duration-200",
              isOpen ? "opacity-100" : "opacity-60 group-hover:opacity-100"
            )}
          >
            <svg
              aria-hidden="true"
              className={cn(
                "transition-all duration-200",
                isOpen
                  ? "scale-110 text-blue-500 dark:text-blue-400"
                  : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"
              )}
              fill="none"
              height="24"
              viewBox="0 0 12 24"
              width="12"
            >
              <path
                d="M2 4C6 8 6 16 2 20"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.5"
              />
            </svg>
          </div>

          <DropdownMenuContent
            align="end"
            className="data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 w-64 origin-top-right rounded-2xl border border-zinc-200/60 bg-white/95 p-2 shadow-xl shadow-zinc-900/5 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in dark:border-zinc-800/60 dark:bg-zinc-900/95 dark:shadow-zinc-950/20"
            sideOffset={4}
          >
            <div className="space-y-1">
              {menuItems.map((item) => (
                <DropdownMenuItem
                  key={item.label}
                  className="group flex cursor-pointer items-center rounded-lg border border-transparent p-2 transition-all duration-200 hover:border-zinc-200/50 hover:bg-zinc-100/80 hover:shadow-sm dark:hover:border-zinc-700/50 dark:hover:bg-zinc-800/60"
                  render={
                    <Link
                      href={item.href}
                    />
                  }
                >
                  <div className="flex flex-1 items-center gap-2">
                    {item.icon}
                    <span className="whitespace-nowrap font-medium text-sm text-zinc-900 leading-tight tracking-tight transition-colors group-hover:text-zinc-950 dark:text-zinc-100 dark:group-hover:text-zinc-50">
                      {item.label}
                    </span>
                  </div>
                  <div className="ml-auto flex-shrink-0">
                    {item.value && (
                      <span
                        className={cn(
                          "rounded-md px-2 py-1 font-medium text-xs tracking-tight",
                          item.label === "Model"
                            ? "border border-blue-500/10 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                            : "border border-purple-500/10 bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
                        )}
                      >
                        {item.value}
                      </span>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </div>

            <DropdownMenuSeparator className="my-3 bg-gradient-to-r from-transparent via-zinc-200 to-transparent dark:via-zinc-800" />

            <form action={logout} className="w-full m-0 p-0" id="logout-form">
              <DropdownMenuItem
                variant="destructive"
                className="group flex w-full cursor-pointer items-center gap-3 rounded-lg border border-transparent bg-red-500/10 p-2 transition-all duration-200 hover:border-red-500/20 data-[variant=destructive]:focus:bg-red-950/50 dark:data-[variant=destructive]:focus:bg-red-900/20 hover:shadow-sm"
                onClick={() => {
                  const form = document.getElementById("logout-form") as HTMLFormElement;
                  form?.requestSubmit();
                }}
                render={
                  <div />
                }
              >
                <LogOut className="h-4 w-4 text-red-500" />
                <span className="font-medium text-red-500 text-sm">
                  Выйти
                </span>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </div>
      </DropdownMenu>
    </div>
  );
}
