import { Route, RouteConfig } from "vue-router";
import Logger from "@shared/Logger";
import { RouteConfigSingleView } from "vue-router/types/router";
import { NavBarProps } from "@components/NavBarTypes";

const logger = new Logger("router-meta");

export interface MetaTagName {
    name: string,
    content: string
}

export interface MetaTagProperty {
    property: string,
    content: string,
}

export type MetaTag = MetaTagName | MetaTagProperty

export interface RoutePageMeta {
    title?: string,
    description?: string,
    image?: MetaImage,
    metaTags?: MetaTag[],
    usePrevious?: boolean,
    passMember?: boolean,
    passUser?: boolean,
    passSettings?: boolean,
    authRequired?: boolean,
    authContinueMessage?: string,
    navBar?: Partial<NavBarProps>|boolean,
}

export interface MetaImage {
    url: string,
    height: number,
    width: number,
    type: string,
}

export const DEFAULT_IMAGE_META: MetaImage = {
    url: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/static%2Fog-wall-of-blobs-big.png?alt=media&token=9c2ec0c0-3e76-4603-a5a4-8a79e1373574",
    height: 630,
    width: 1200,
    type: "image/png",
}

export interface MetaRouteConfig extends RouteConfigSingleView {
    meta?: RoutePageMeta
}

const META_DESCRIPTION = "Questions designed to improve how you think about work, life, relationships, and emotions"

const baseMetaTags = (params: RoutePageMeta): MetaTag[] => {
    const { title = "Cactus", description = META_DESCRIPTION, image = DEFAULT_IMAGE_META } = params;

    const tags: MetaTag[] = [
        { name: "description", content: description },
        { property: "og:description", content: description },
        { name: "og:site_name", content: "Cactus" },
        { name: "og:title", content: title },

        { name: "twitter:title", content: title },
        { name: "twitter:site", content: "@itscalledcactus" },
        { name: "twitter:description", content: description },
    ]

    if (image) {
        tags.push(
        { property: "og:image", content: image.url },
        { property: "og:image:width", content: `${ image.width }` },
        { property: "og:image:height", content: `${ image.height }` },
        { property: "og:image:type", content: image.type },
        { name: "twitter:image", content: image.url },
        { name: "twitter:card", content: "summary_large_image" }
        )
    }

    return tags;
}

interface PageMetaInfo {
    title: string,
    metaTags: MetaTag[]
}


function buildRouteMeta(routeMeta?: RoutePageMeta | null, routeTitle?: string): PageMetaInfo {
    const title = routeMeta?.title ?? routeTitle ?? "Cactus"

    const tags = baseMetaTags({ ...routeMeta, title: title });
    return {
        title,
        metaTags: [...tags, ...(routeMeta?.metaTags ?? [])],
    }
}

export function updateRouteMeta(to: Route, from?: Route): PageMetaInfo | null {
    // This goes through the matched routes from last to first, finding the closest route with a title.
    // eg. if we have /some/deep/nested/route and /some, /deep, and /nested have titles, nested's will be chosen.
    const nearestWithTitle = to.matched.slice().reverse().find(r => r.meta && r.meta.title);

    // Find the nearest route element with meta tags.
    // const nearestWithMeta = to.matched.slice().reverse().find(r => r.meta && r.meta.metaTags);
    // const nearestWithMeta = to;

    // If a route with a title was found, set the document (page) title to that value.
    const title = nearestWithTitle?.meta?.title ?? to.name;

    const routeConfig = to as MetaRouteConfig
    let routeMeta = routeConfig.meta;

    if (to.meta?.usePrevious === true && from) {
        logger.info("Using previous meta")
        const previousWithMeta = from.matched.slice().reverse().find(r => r.meta && !r.meta.usePrevious);
        routeMeta = previousWithMeta?.meta ?? to.meta;
    }

    return setPageMeta(routeMeta, title);
}

export function isAuthRequired(route: Route): boolean {
    return route.meta.authRequired || route.matched.slice().reverse().find(r => r.meta?.authRequired === true);
}

export function doPassMember(route: Route): boolean {
    return route.meta.passMember || route.matched.slice().reverse().find(r => r.meta?.passMember === true);
}

export function doPassUser(route: Route): boolean {
    return route.meta.passUser || route.matched.slice().reverse().find(r => r.meta?.passUser === true);
}

export function doPassSettings(route: Route): boolean {
    return route.meta.passSettings || route.matched.slice().reverse().find(r => r.meta?.passSettings === true);
}

export function setPageMeta(routeMeta?: RoutePageMeta | null, title?: string): PageMetaInfo | null {
    // Turn the meta tag definitions into actual elements in the head.
    const meta = buildRouteMeta(routeMeta, title);
    if (title) document.title = title;

    // Remove any stale meta tags from the document using the key attribute we set below.
    Array.from(document.querySelectorAll('[data-vue-router-controlled]')).map((el) => el?.parentNode?.removeChild(el));

    meta?.metaTags?.map(tagDef => {
        const tag = document.createElement('meta');

        Object.keys(tagDef).forEach(key => {
            tag.setAttribute(key, (tagDef as any)[key]);
        });

        // We use this to track which meta tags we create, so we don't interfere with other ones.
        tag.setAttribute('data-vue-router-controlled', '');

        return tag;
    })
    // Add the meta tags to the document head.
    .forEach(tag => document.head.appendChild(tag));
    return meta;
}