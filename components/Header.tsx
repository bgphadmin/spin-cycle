import Image from 'next/image'
import Link from 'next/link'
import logo from '@/public/spin-cycle-logo.png'
import React from 'react'
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { Button } from './ui/button'

const Header = () => {
    return (
        <header className="bg-#EDEDED">
            <div className="container mx-auto flex flex-wrap items-center justify-between px-6 lg:px-28 -pb-1 -mb-3">
                <Link href="/" className="flex items-center">
                    <Image
                        src={logo}
                        alt="Spin Cycle Logo"
                        width={80}
                        height={80} // increased size
                        className="cursor-pointer"
                        priority   // ensures preload
                        loading="eager" // ensures eager load
                    />
                </Link>
                <SignedIn>
                    <UserButton />
                </SignedIn>
                <SignedOut>
                    <div className="md:flex text-teal-700 font-semibold">
                        <Button asChild className='cursor-pointer font-semibold text-lg'>
                            <SignInButton
                                mode="modal">
                                Login
                            </SignInButton>
                        </Button>
                        <Button asChild className='cursor-pointer font-semibold text-lg'>
                            <SignUpButton
                                signInForceRedirectUrl="/"
                                mode="modal">
                                Register
                            </SignUpButton>
                        </Button>
                    </div>
                </SignedOut>
            </div>
            {/* Engraved divider line */}
            <div className="mx-auto lg:w-10/13 h-0.5 bg-gray-300 shadow-inner rounded-full" />
        </header>
    )
}
export default Header