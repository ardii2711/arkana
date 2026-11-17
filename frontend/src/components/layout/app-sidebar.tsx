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
  UserRoundIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { UserAvatar } from '@/features/profile/user-avatar';
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
import { getDisplayName } from '@/lib/display-name';

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

export function AppSidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const logout = useLogout();
  const { setOpenMobile } = useSidebar();
  const items = user.role === 'ADMIN' ? adminNav : userNav;
  const displayName = getDisplayName(user);

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
                  aria-label={`Buka menu akun ${displayName}`}
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <UserAvatar user={user} />
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-medium">{displayName}</span>
                    <span className="text-muted-foreground truncate text-xs">{user.email}</span>
                  </div>
                  <ChevronsUpDownIcon className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" sideOffset={8} className="min-w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex items-center gap-3 py-1">
                    <UserAvatar user={user} size="lg" />
                    <div className="grid min-w-0 flex-1">
                      <span className="truncate text-sm font-medium text-foreground">
                        {displayName}
                      </span>
                      <span className="text-muted-foreground truncate text-xs">{user.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profil">
                    <UserRoundIcon />
                    Profil
                  </Link>
                </DropdownMenuItem>
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
