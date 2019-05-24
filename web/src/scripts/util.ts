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

    let $button = createElementFromString(`<button  title="Close" class="modal-close">Close</button>`);

    $button.addEventListener("click", () => {
        closeModal(modalId);
    });

    let $content = document.createElement("div");
    $content.append($button);

    let $title = null;
    let $message = null;

    if (options.title){
        $title = document.createElement("h1");
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