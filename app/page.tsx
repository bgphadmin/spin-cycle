import { Button, buttonVariants } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import logo from "@/public/spin-cycle-logo.png";

export default function LandingPage() {

  return (
    <section className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      {/* Bigger Logo */}
      <div>
        <Image
          src={logo}
          alt="Spin Cycle Logo"
          width={350}
          height={350} // larger size for landing page
          className="drop-shadow-xl w-auto h-auto"
          loading="eager"
          priority
        />
      </div>
      <div className="-mt-24 mb-6 mx-8">
        <h2 className="text-4xl font-bold text-teal-700 mb-4">
          Laundro-App
        </h2>
        <p className="text-lg text-gray-600 mb-2 max-w-xl">
          Manage your sales, expenses, and inventory with ease.
        </p>
      </div>
      <div className="space-x-4">
        <Button asChild size="lg" className={buttonVariants({ size: "lg", className: "bg-teal-600 hover:bg-teal-700 px-8 py-6 text-white" })}>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </section>
  );
}