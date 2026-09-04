
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { AlignLeft } from 'lucide-react';
import Link from 'next/link';
import { links } from '@/lib/links';
// import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/nextjs';
// import SignOutLi?nk from './auth/SignOutLink';
// import UserIcon from './auth/UserIcon';
// import verifyUser from '@/utils/userValidation';

async function LinksDropdown() {
  // const isSuperUser = await verifyUser("SUPERUSER");
  // const isAdmin = await verifyUser("ADMIN");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger >
        <div className='border border-gray-300 px-2 py-1 rounded-md flex gap-4 max-w-25'>
          <AlignLeft className='w-6 h-6' />
          {/* <UserIcon /> */}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-40 bg-white' align='start' sideOffset={10}>
        {/* <SignedOut> */}
          <DropdownMenuItem>
            {/* <SignInButton mode='modal'> */}
              <button className='w-full text-left'>Login</button>
            {/* </SignInButton> */}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            {/* <SignUpButton mode='modal'> */}
              <button className='w-full text-left'>Register</button>
            {/* </SignUpButton> */}
          </DropdownMenuItem>
        {/* </SignedOut> */}
        {/* <SignedIn> */}
          {links.map(async (link) => {
            // if (!isSuperUser && link.label === 'Users') return null;
            // if (!isAdmin && !isSuperUser && link.label === 'Inventory') return null;
            // if (!isAdmin && !isSuperUser && link.label === 'Distribution') return null;
            return (
              <DropdownMenuItem key={link.href}>
                <Link href={link.href} className='capitalize w-full'>
                  {link.label}
                </Link>
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            {/* <SignOutLink /> */}
          </DropdownMenuItem>
        {/* </SignedIn> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export default LinksDropdown;