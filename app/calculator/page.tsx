import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Calculator from "@/features/calculator/Calculator";

export default async function CalculatorPage() {
  const { userId } = await auth();
  if (!userId) redirect("/auth/signIn");

  return (
    <main className="mx-auto mb-24 w-full max-w-xl px-6 py-8">
      <h1 className="mb-2 text-3xl font-bold text-teal-800">Calculator</h1>
      <p className="mb-6 text-sm text-gray-600">
        Add, subtract, multiply, or divide two numbers.
      </p>
      <Calculator />
    </main>
  );
}
