export const MOBILE_BREAKPOINT_PX = 600;

export function getDeviceDimensions(): {height:number, width:number}{
    const height = window.innerHeight;
    const width = window.innerWidth;

    return {height,width};

}