
interface Navigator {
    share: (options: {title?: string, url?: string, text?: string}) => Promise<void|any>
}

interface Window {
    branch: any,
}