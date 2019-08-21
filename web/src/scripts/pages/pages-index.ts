import "@styles/pages-index.scss"
import {setupNavigation} from "@web/util";

setupNavigation({showSignupButton: false});

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        console.error("Error accepting hot reload", error);
    })
}