import Link from 'next/link';

export default function NotAllowed() {
  return (
    <main className="grid min-h-screen place-items-center bg-teal-50 px-6 py-24 sm:py-32 lg:px-8">
      {/* Decorative background glow */}
      <div className="absolute inset-0 -z-10 overflow-hidden bg-slate-950">
        <div className="absolute -top-40 left-1/2 -z-10 h-250 w-250 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08),transparent_60%)]" />
      </div>

      <div className="text-center relative z-10 max-w-md">
        {/* Animated badge or label */}
        <p className="inline-flex items-center rounded-full bg-indigo-500/10 px-3 py-1 text-sm font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
          403 Error
        </p>

        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-black sm:text-5xl">
          We're watching you!
        </h1>

        <p className="mt-6 text-base leading-7 text-slate-400">
          You are not allowed to access this page!
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex items-center justify-center gap-x-4">
          <Link
            href="/"
            className="rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
          >
            Go back home
          </Link>

          <Link
            href="/support"
            className="rounded-md border border-slate-800 bg-slate-900/50 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
          >
            Contact support if you believe you have the right to access this page.
          </Link>
        </div>

        {/* Helpful links shortcut */}
        <div className="mt-12 border-t border-slate-900 pt-8">
          <p className="text-xs text-slate-500">Popular links</p>
          <div className="mt-3 flex justify-center space-x-6 text-sm font-medium text-slate-400">
            <Link href="/blog" className="hover:text-indigo-400 transition-colors">Blog</Link>
            <span className="text-slate-800">|</span>
            <Link href="/pricing" className="hover:text-indigo-400 transition-colors">Pricing</Link>
            <span className="text-slate-800">|</span>
            <Link href="/dashboard" className="hover:text-indigo-400 transition-colors">Dashboard</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
