'use client';

import { useSignIn, useSignUp } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';

export default function AcceptInvitationPage() {
    const { signUp, isLoaded: isSignUpLoaded, setActive: setSignUpActive } = useSignUp();
    const { signIn, isLoaded: isSignInLoaded, setActive: setSignInActive } = useSignIn();

    const searchParams = useSearchParams();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const ticket = searchParams.get('__clerk_ticket');
    const status = searchParams.get('__clerk_status');

    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');

    if (!ticket) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                <div className="w-full max-w-md rounded-xl border border-red-100 bg-white p-6 text-center shadow-md">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                        <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900">Invalid Invitation</h2>
                    <p className="mt-1 text-sm text-slate-500">This link is either expired, broken, or has already been used.</p>
                </div>
            </div>
        );
    }

    // 1. Submit email/password using the invitation ticket correctly
    // 1. Submit email/password using the invitation ticket correctly
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        startTransition(async () => {
            try {
                if (status === 'sign_in') {
                    if (!isSignInLoaded) return;

                    // Step A: Initialize the sign-in session using ONLY the ticket token
                    const signInAttempt = await signIn.create({
                        strategy: 'ticket',
                        ticket: ticket,
                    });

                    // Step B: Authenticate via first factor check (Password setup validation)
                    if (signInAttempt.status === 'needs_first_factor') {
                        const result = await signIn.attemptFirstFactor({
                            strategy: 'password',
                            password: password,
                        });

                        if (result.status === 'complete') {
                            await setSignInActive({ session: result.createdSessionId });
                            router.push('/dashboard');
                        }
                    } else if (signInAttempt.status === 'complete') {
                        await setSignInActive({ session: signInAttempt.createdSessionId });
                        router.push('/dashboard');
                    }
                } else {
                    if (!isSignUpLoaded) return;

                    // Sign-up handles the ticket directly during compilation creation
                    const signUpAttempt = await signUp.create({
                        strategy: 'ticket',
                        ticket: ticket,
                        password: password,
                    });

                    // 💡 FIX: Check if Clerk automatically verified the email via the ticket
                    if (
                        signUpAttempt.status === 'complete' ||
                        signUpAttempt.verifications.emailAddress.status === 'verified'
                    ) {
                        // If already verified by the ticket context, activate session immediately
                        const sessionId = signUpAttempt.createdSessionId || signUp.createdSessionId;
                        if (sessionId) {
                            await setSignUpActive({ session: sessionId });
                            router.push('/dashboard');
                        } else {
                            // Fallback if session activation needs a reload nudge
                            router.push('/dashboard');
                        }
                    } else {
                        // Only prompt for OTP if Clerk indicates verification is still explicitly needed
                        await signUp.prepareEmailAddressVerification();
                        setVerifying(true);
                    }
                }
            } catch (err: any) {
                setError(err.errors?.[0]?.message || 'An unexpected error occurred.');
            }
        });
    };


    // 2. Verify OTP code (Ensures the ticket isn't lost during email validation)
    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isSignUpLoaded) return;
        setError('');

        startTransition(async () => {
            try {
                const result = await signUp.attemptEmailAddressVerification({ code });
                if (result.status === 'complete') {
                    await setSignUpActive({ session: result.createdSessionId });
                    router.push('/dashboard');
                }
            } catch (err: any) {
                setError(err.errors?.[0]?.message || 'Invalid or expired verification code.');
            }
        });
    };

    // OTP Verification View
    if (verifying) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
                <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-100 bg-white p-8 shadow-xl">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Verify your email</h2>
                        <p className="mt-2 text-sm text-slate-500">We sent a verification code to your email inbox.</p>
                    </div>

                    <form onSubmit={handleVerify} className="space-y-4">
                        {error && (
                            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                                {error}
                            </div>
                        )}
                        <div>
                            <label htmlFor="code" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                Verification Code
                            </label>
                            <input
                                id="code"
                                type="text"
                                maxLength={6}
                                placeholder="000000"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-lg font-bold tracking-widest text-slate-800 placeholder-slate-300 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                required
                                disabled={isPending}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50"
                        >
                            {isPending ? 'Verifying...' : 'Verify & Join Workspace'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Initial Signup / Login View
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-100 bg-white p-8 shadow-xl">
                <div className="text-center">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                        {status === 'sign_in' ? 'Welcome back' : 'Create your account'}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                        {status === 'sign_in'
                            ? 'Log in to securely accept your staff organization invite.'
                            : 'Fill in your details below to join your team workspace.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                            Email Address
                        </label>
                        on this view
                        <input
                            id="email"
                            type="email"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                            required
                            disabled={isPending}
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                            required
                            disabled={isPending}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50"
                    >
                        {isPending ? 'Processing...' : status === 'sign_in' ? 'Sign In & Join' : 'Continue'}
                    </button>
                </form>
            </div>
        </div>
    );
}