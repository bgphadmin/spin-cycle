import Link from "next/link";
import Image from "next/image";
import settingsIcon from "@/public/settings-icon.png"; // save the icon here

export default function SettingsButton({ tenantId }: { tenantId: string }) {
  return (
    <Link href={`/dashboard/tenants/${tenantId}/settings`}>
      <Image
        src={settingsIcon}
        alt="Settings"
        width={30}
        height={30}
        className="hover:opacity-80 transition"
      />
    </Link>
  );
}