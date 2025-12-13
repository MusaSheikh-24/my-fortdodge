"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type MenuItem = {
  label: string;
  href: string;
  icon?: string;
  children?: { label: string; href: string; tabId?: string }[];
};

const menuItems: MenuItem[] = [
  { label: "Home", href: "/admin/home" },
  { label: "About", href: "/admin/about" },
  { label: "Donate", href: "/admin/donate" },
  { label: "New Muslim", href: "/admin/new-muslim" },
  { label: "Ramadan", href: "/admin/ramadan" },
  { label: "Report a Death", href: "/admin/report-death" },
  {
    label: "Resources",
    href: "/admin/resources",
    children: [
      { label: "Request a Speaker", href: "/admin/request-a-speaker" },
      { label: "Request a Visit", href: "/admin/request-a-visit" },
      { label: "Visitors Guide", href: "/admin/visitors-guide" },
      { label: "Islamic Prayer", href: "/admin/islamic-prayer" },
      { label: "Islamic School", href: "/admin/islamic-school" },
      { label: "Elections & Nominations", href: "/admin/elections-nominations" },
      { label: "Apply/Renew Membership", href: "/admin/apply-renew-membership" },
      // { label: "By Laws", href: "/admin/by-laws" },
      // { label: "Fundraising Policy", href: "/admin/fundraising-policy" },
      // { label: "Meeting Minutes", href: "/admin/meeting-minutes" },
      { label: "Financial Assistance", href: "/admin/financial-assistance" },
      { label: "Request Door Access", href: "/admin/request-door-access" },
      { label: "Reserve Basement", href: "/admin/reserve-basement" },

      { label: "Contact", href: "/admin/contact" },
    ],
  },
];

type AdminSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  // Determine if any Resources child route is currently active so that
  // the Resources dropdown is automatically opened when editing them.
  const isOnResourcesChildPage =
    menuItems
      .find((item) => item.label === "Resources")
      ?.children?.some((child) => pathname === child.href) || false;

  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({
    resources: pathname === "/admin/resources" || isOnResourcesChildPage,
  });

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  const toggleDropdown = (label: string) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [label.toLowerCase()]: !prev[label.toLowerCase()],
    }));
  };

  return (
    <aside
      className={`fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 transform border-r border-gray-200 bg-white overflow-y-auto transition-transform duration-200 ease-in-out
      ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      aria-hidden={!isOpen}
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 lg:hidden">
        <h2 className="text-base font-semibold text-sky-900">Page Editors</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close admin menu"
          className="cursor-pointer rounded-md p-2 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="p-4 pt-3 lg:pt-4">
        <h2 className="text-lg font-bold text-sky-900 mb-4">Page Editors</h2>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const active = isActive(item.href);
            const hasChildren = item.children && item.children.length > 0;
            const isDropdownOpen = openDropdowns[item.label.toLowerCase()] || false;

            if (hasChildren) {
              return (
                <div key={item.label}>
                  <div
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-md transition-colors duration-200 relative ${active
                      ? "bg-blue-100 text-sky-900 font-bold border-l-4 border-blue-600"
                      : "text-sky-900 hover:bg-gray-100 font-semibold"
                      }`}
                  >
                    <Link href={item.href} className="flex-1 text-left">
                      {item.label}
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleDropdown(item.label)}
                      className="cursor-pointer ml-2 p-1 rounded hover:bg-gray-200 text-gray-700"
                      aria-label={`Toggle ${item.label} submenu`}
                    >
                      <svg
                        className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  {isDropdownOpen && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-2">
                      {item.children!.map((child) => {
                        const childActive = pathname === child.href;
                        return (
                          <Link
                            key={child.label}
                            href={child.href}
                            className={`block px-4 py-2 rounded-md text-sm transition-colors duration-200 ${childActive
                              ? "text-sky-900 font-semibold bg-blue-50"
                              : "text-gray-700 hover:text-sky-900 hover:bg-gray-50"
                              }`}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`block px-4 py-2.5 rounded-md transition-colors duration-200 relative ${active
                  ? "bg-blue-100 text-sky-900 font-bold border-l-4 border-blue-600"
                  : "text-sky-900 hover:bg-gray-100 font-semibold"
                  }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
