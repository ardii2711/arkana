'use client';

import {
  ArchiveIcon,
  CalendarDaysIcon,
  ChevronsUpDownIcon,
  ClipboardListIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  StickyNoteIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import type { SessionUser } from '@/features/auth/auth.api';
import { useLogout } from '@/features/auth/use-auth';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const userNav: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboardIcon },
  { href: '/kegiatan', label: 'Kegiatan', icon: ClipboardListIcon },
  { href: '/arsip', label: 'Arsip', icon: ArchiveIcon },
  { href: '/laporan', label: 'Laporan', icon: FileTextIcon },
  { href: '/agenda', label: 'Agenda', icon: CalendarDaysIcon },
  { href: '/catatan', label: 'Catatan', icon: StickyNoteIcon },
];

const adminNav: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboardIcon },
  { href: '/akun', label: 'Akun', icon: UsersIcon },
];

function isActivePath(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'A'
  );
}

export function AppSidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const logout = useLogout();
  const { setOpenMobile } = useSidebar();
  const items = user.role === 'ADMIN' ? adminNav : userNav;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="ARKANA">
              <Link href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground font-heading flex aspect-square size-8 items-center justify-center rounded-lg text-sm font-semibold">
                  A
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="font-heading truncate font-semibold">ARKANA</span>
                  <span className="text-muted-foreground truncate text-xs">
                    Arsip, Rekam Kinerja, Agenda
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigasi</SidebarGroupLabel>
          <SidebarGroupContent>
            <nav aria-label="Navigasi utama">
              <SidebarMenu>
                {items.map((item) => {
                  const active = isActivePath(pathname, item.href);

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                        <Link
                          href={item.href}
                          aria-current={active ? 'page' : undefined}
                          onClick={() => setOpenMobile(false)}
                        >
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </nav>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  aria-label={`Buka menu akun ${user.name}`}
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar>
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="text-muted-foreground truncate text-xs">{user.email}</span>
                  </div>
                  <ChevronsUpDownIcon className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" sideOffset={8} className="min-w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex items-center gap-3 py-1">
                    <Avatar size="lg">
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="grid min-w-0 flex-1">
                      <span className="truncate text-sm font-medium text-foreground">
                        {user.name}
                      </span>
                      <span className="text-muted-foreground truncate text-xs">{user.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled={logout.isPending} onSelect={() => logout.mutate()}>
                  <LogOutIcon />
                  {logout.isPending ? 'Keluar…' : 'Keluar'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
