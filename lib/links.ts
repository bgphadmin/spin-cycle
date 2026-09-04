type NavLink = {
  href: string;
  label: string;
};

export const links: NavLink[] = [
  {
    href: 'dashboard/tenants',  
    label: 'Tenants',
  },
  {
    href: 'dashboard/tenants/${tenantId}/machines',  
    label: 'Machines',
  },
  {
    href: 'dashboard/tenants/${tenantId}/products',  
    label: 'Products',
  },
  {
    href: 'dashboard/tenants/${tenantId}/users',  
    label: 'Users',
  },
  {
    href: 'dashboard/tenants/${tenantId}/customers',  
    label: 'Customers',
  },
];

// export const adminLinks: NavLink[] = [
//   { href: '/inventory', label: 'Rice Inventory' },
//   { href: '/distribution', label: 'Rice Distribution' },
//   { href: '/users', label: 'Add User' },
// ];