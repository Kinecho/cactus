interface AndroidAppInterface {
    showToast: (message: string) => void
    startCheckout: (androidProductId: string, memberId: string) => void
}


