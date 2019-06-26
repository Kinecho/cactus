import {Config} from './config'
import {QueryParam} from "@web/queryParams";
import {getQueryParam} from "@web/util";

declare global {
    interface Window { dataLayer: Array<any>; }
}

let _gtag = null;

// window.dataLayer = window.dataLayer || {};

/**
 * gtag('event', <action>, {
      'event_category': <category>,
      'event_label': <label>,
      'value': <value>
    });
 * @type {_gtag|*}
 */
export const gtag = createGTag();

/**
 * set up the analytics function
 *
 * returns function
 */
export function init(){
    console.log("setting up analytics");
    createGTag();
    gtag('js', new Date());
    gtag('config', Config.googleAnalyticsID);

    const mailchimpUserId = getQueryParam(QueryParam.MAILCHIMP_EMAIL_ID);
    if (mailchimpUserId) {
        setUserId(`mcuid_${mailchimpUserId}`);
    }
}

export function setUserId(userId:string) {
    console.log("setting userId to:", userId);
    gtag('set', {'user_id': userId}); // Set the user ID using signed-in user_id.}
}

function createGTag(){
    console.log("calling create gtag");
    if (!_gtag){
        console.log("setting up gtag");
        window.dataLayer = window.dataLayer || [];
        _gtag = function(){
            window.dataLayer.push(arguments)
        }
    } else {
        console.log("gtag already created")
    }
    return _gtag
}


// tslint:disable
export function startFullstory(){

    if (!Config.fullStoryTeamId){
        console.log("Full story is disabled. Not loading full story.");
        return;
    }

    // console.log("Fullstory is enabled. Starting FullStory");

    const _fs_host = 'fullstory.com';
    // noinspection UseOfBracketNotationInspection
    window['_fs_debug'] = false;
    // noinspection UseOfBracketNotationInspection
    window['_fs_host'] = _fs_host;
    // noinspection UseOfBracketNotationInspection
    window['_fs_org'] = Config.fullStoryTeamId;
    // noinspection UseOfBracketNotationInspection
    window['_fs_namespace'] = 'FS';

    (function(m,n,e,t,l,o,g,y){
        if (e in m) {if(m.console && m.console.log) { m.console.log('FullStory namespace conflict. Please set window["_fs_namespace"].');} return;}
        g=m[e]=function(a,b,s){g.q?g.q.push([a,b,s]):g._api(a,b,s);};g.q=[];
        o=n.createElement(t);o.async=1;o.crossOrigin='anonymous';o.src='https://'+_fs_host+'/s/fs.js';
        y=n.getElementsByTagName(t)[0];y.parentNode.insertBefore(o,y);
        g.identify=function(i,v,s){g(l,{uid:i},s);if(v)g(l,v,s)};g.setUserVars=function(v,s){g(l,v,s)};g.event=function(i,v,s){g('event',{n:i,p:v},s)};
        g.shutdown=function(){g("rec",!1)};g.restart=function(){g("rec",!0)};
        g.consent=function(a){g("consent",!arguments.length||a)};

        g.identifyAccount=function(i,v){o='account';v=v||{};v.acctId=i;g(o,v)};
        g.clearUserCookie=function(){};
    })(window,document,window['_fs_namespace'],'script','user');
}
// tslint:enable