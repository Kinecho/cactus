import {Config} from 'scripts/config'

let _gtag = null;

/**
 * set up the analytics function
 *
 * returns function
 */
export function init(){
    console.log("setting up analytics")
    createGTag()
    gtag('js', new Date());
    gtag('config', Config.googleAnalyticsID);
}

function createGTag(){
    console.log("calling create gtag")
    if (!_gtag){
        console.log("setting up gtag")
        window.dataLayer = window.dataLayer || [];
        _gtag = function(){
            console.log("pushing arguments to datalayer", arguments)
            dataLayer.push(arguments)
        }
    } else {
        console.log("gtag already created")
    }
    return _gtag
}


/**
 * gtag('event', <action>, {
      'event_category': <category>,
      'event_label': <label>,
      'value': <value>
    });
 * @type {_gtag|*}
 */
export const gtag = createGTag()