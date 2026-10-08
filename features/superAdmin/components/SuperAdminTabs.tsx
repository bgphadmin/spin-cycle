import Link from "next/link";

const tabs = [
  { href: "/super-admin", label: "Dashboard", id: "dashboard" },
  { href: "/super-admin/tenants", label: "Tenants Management", id: "tenants" },
] as const;

export default function SuperAdminTabs({
  activeTab,
}: {
  activeTab: (typeof tabs)[number]["id"];
}) {
  return (
    <nav
      aria-label="Super Admin sections"
      className="flex gap-1 border-b border-teal-200"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              isActive
                ? "border-teal-700 text-teal-800"
                : "border-transparent text-gray-600 hover:border-teal-300 hover:text-teal-700"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
