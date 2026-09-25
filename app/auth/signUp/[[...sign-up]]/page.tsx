import { SignUp } from "@clerk/nextjs";

export default function SignupPage() {
  return (
    <div className="flex justify-center">
      <SignUp />
    </div>
  );
}
