import "@styles/pages/payment_cancel.scss"


document.addEventListener('DOMContentLoaded', function() {
    console.log("payment cancel loaded")
});

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        console.error("Error accepting hot reload", error);
    })
}