declare namespace jest {
    interface Matchers<R> {
        toHaveTextContent: (htmlElement: string) => object;
        toBeInTheDOM: () => void;
        toAllow: () => Promise<any>
        toDeny: () => Promise<any>
    }

    interface Expect {
        toHaveTextContent: (htmlElement: string) => object;
        toBeInTheDOM: () => void;
    }
}