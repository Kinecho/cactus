export interface NavBarProps {
    showSignup?: boolean;
    signOutRedirectUrl?: string | null
    redirectOnSignOut?: boolean;
    signupFormAnchorId?: string;
    largeLogoOnDesktop?: boolean;
    isSticky?: boolean;
    whiteLogo?: boolean;
    showLogin?: boolean;
    forceTransparent?: boolean;
    loginRedirectUrl?: string | null
    showLinks?: boolean;
    useCurrentRouteAfterLogin?: boolean;
}