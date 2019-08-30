export interface DropdownMenuLink {
    title: string,
    href?: string | null,
    static?: boolean,
    onClick?: (event: Event | any) => void
}

export interface ComputedMenuLink extends DropdownMenuLink {
    event: string | null,
}
