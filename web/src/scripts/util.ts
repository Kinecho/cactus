export function validateEmail(email:string)
{
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
}

function createElementFromString(htmlString:string):ChildNode{
    let div = document.createElement('div');
    div.innerHTML = htmlString.trim();

    // Change this to div.childNodes to support multiple top-level nodes
    return div.firstChild;
}



function addModalCloseListener(){
    let buttons = <HTMLCollectionOf<HTMLButtonElement>> document.getElementsByClassName("modal-close");
    Array.from(buttons).forEach(button => {
        button.addEventListener("click", () => {
            let modalId = button.dataset.for;
            let modal = <HTMLDivElement> document.getElementById(modalId);
            modal.classList.add("hidden");
            modal.classList.remove("open");
        })
    })
}

/**
 *
 * @param {string} modalId - the ID of the modal to close
 * @returns {boolean} success - if the modal was successfully closed
 */
export function closeModal(modalId:string): boolean{
    let modalDiv = <HTMLDivElement>document.getElementById(modalId);
    if (modalDiv) {
        modalDiv.classList.remove("open");
        return true;
    }
    return false;
}

export function showModal(modalId: string){
    let modalDiv = <HTMLDivElement>document.getElementById(modalId);
    if (modalDiv) {
        modalDiv.classList.add("open");
        return true;
    }
    return false;
}

export function addModal(modalId: string, options: {
    title?: string,
    message?: string,
    imageUrl?: string,
}): ChildNode {

    let existingModal = <HTMLDivElement>document.getElementById("signup-success-modal");
    if (existingModal){
        console.warn(`a modal with id ${modalId} already exists, removing it`);
        existingModal.remove()
    }

    let $button = createElementFromString(`<button title="Close" class="modal-close secondary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <path fill="#33CCAB" d="M13.8513053,12 L21.6125213,19.7612161 C22.1291596,20.2778543 22.1291596,21.0958831 21.6125213,21.6125213 C21.3643894,21.8606532 21.0334408,22 20.6868687,22 C20.3402966,22 20.009348,21.8606532 19.7612161,21.6125213 L12,13.8513053 L4.23878394,21.6125213 C3.99065203,21.8606532 3.65970345,22 3.31313131,22 C2.96655918,22 2.63561059,21.8606532 2.38747868,21.6125213 C1.87084044,21.0958831 1.87084044,20.2778543 2.38747868,19.7612161 L10.1486947,12 L2.38747868,4.23878394 C1.87084044,3.7221457 1.87084044,2.90411693 2.38747868,2.38747868 C2.90411693,1.87084044 3.7221457,1.87084044 4.23878394,2.38747868 L12,10.1486947 L19.7612161,2.38747868 C20.2778543,1.87084044 21.0958831,1.87084044 21.6125213,2.38747868 C22.1291596,2.90411693 22.1291596,3.7221457 21.6125213,4.23878394 L13.8513053,12 Z"/>
    </svg>
    </button>`);

    let $illustration = createElementFromString(`<img src="assets/images/success.svg" alt="Success!" />`);

    $button.addEventListener("click", () => {
        closeModal(modalId);
    });

    let $content = document.createElement("div");
    $content.append($button);
    $content.append($illustration);

    let $title = null;
    let $message = null;

    if (options.title){
        $title = document.createElement("h2");
        $title.innerText = options.title;
        $content.append($title);
    }

    if (options.message){
        $message = document.createElement("div");
        $message.innerText = options.message;
        $content.append($message);
    }

    let modal = document.createElement("div");
    modal.id = modalId;
    modal.classList.add("modal-window");
    modal.appendChild($content);


    return document.body.appendChild(modal);
}
