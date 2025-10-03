"use client";

import { Button } from "@/components/ui/button";
import { Bot, Menu } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import type React from "react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAppKitAccount } from "@reown/appkit/react";
import { useAppKit } from "@reown/appkit/react";

export default function Navbar() {
  const { address, isConnected } = useAppKitAccount();
  const { open } = useAppKit();

  const [showMobileNav, setShowMobileNav] = useState(false);
  useEffect(() => {
    if (showMobileNav) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [showMobileNav]);

  const allLinks = [
    {
      name: "Create Task",
      href: "/create-task",
    },
    {
      name: "Available Task",
      href: "/available-task",
    },
  ];
  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="flex items-center justify-between px-6 py-4 backdrop-blur-sm border-b border-white/10 z-50"
      >
        <Link href="/" className="flex items-center space-x-2">
          <Bot className="w-8 h-8 text-purple-500" />
          <span className="text-white font-medium text-xl">GiG_Economy</span>
        </Link>

        <div className="hidden md:flex items-center justify-center space-x-8">
          {allLinks.map((task, index) => {
            return (
              <NavLink key={index} href={task.href}>
                {task.name}
              </NavLink>
            );
          })}
        </div>

        <div className="hidden md:flex items-center space-x-4">
          {isConnected ? (
            <appkit-button balance="show" size="md" label="Get Started" />
          ) : (
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => open({ view: "Connect" })}
            >
              Get Started
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-white"
          onClick={() => setShowMobileNav(!showMobileNav)}
        >
          <Menu className="w-6 h-6" />
        </Button>
      </motion.nav>

      {/* mobile nav */}
      <div
        className={`fixed top-0 z-[99] w-full h-[100dvh] bg-colors-primary/90 transition-all duration-[500ms] ease-[cubic-bezier(0.86,0,0.07,1)] lg:hidden flex justify-end ${
          showMobileNav ? "left-0" : "left-[100%]"
        }`}
      >
        <div
          className={`w-[80%] h-full bg-black/[0.96] flex flex-col gap-10 transition-all duration-[500ms] ease-[cubic-bezier(0.86,0,0.07,1)] px-8 py-8 delay-300 ${
            showMobileNav ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <header className="flex justify-between items-center w-full">
            <Link href="/" className="flex items-center space-x-2">
              <Bot className="w-8 h-8 text-purple-500" />
              <span className="text-white font-medium text-xl">
                GiG_Economy
              </span>
            </Link>
            <button
              type="button"
              className="text-2xl text-white"
              onClick={() => setShowMobileNav(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </header>

          <ul className="flex flex-col lg:hidden mt-10 items-start gap-6">
            {allLinks.map((link, index) => (
              <li
                className="block relative list-none hover:text-purple-700 group"
                key={index}
              >
                <Link
                  className={`text-sm font-bold uppercase text-white block leading-none relative tracking-[0.8px] z-[1] font-barlow before:content-[''] before:absolute before:w-[7px] before:h-[7px]
                                            before:rounded-full before:opacity-0 before:transition-all before:duration-[0.3s] before:ease-[ease-out] before:delay-[0s]  before:top-1 before:-left-3 before:bg-black/[0.96] hover:text-purple-700  group-hover:before:opacity-100`}
                  onClick={() => {
                    setShowMobileNav(false);
                  }}
                  href={link.href}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <Link
      href={href}
      className="text-gray-300 hover:text-white transition-colors relative group"
    >
      {children}
      <span
        className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-500 transition-all group-hover:w-full ${
          pathname === href ? "bg-purple-500 w-full" : ""
        }`}
      />
    </Link>
  );
}
