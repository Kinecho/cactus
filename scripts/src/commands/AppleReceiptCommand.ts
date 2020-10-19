import { FirebaseCommand } from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import { CactusConfig } from "@admin/CactusConfig";
import { Project } from "@scripts/config";
import * as prompts from "prompts";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import AdminPaymentService from "@admin/services/AdminPaymentService";
import AppleService from "@admin/services/AppleService";

interface UserInput {
    email: string
}

export default class AppleReceiptCommand extends FirebaseCommand {
    name = "Apple Receipt Command";
    description = "";
    showInList = true;
    userInput!: UserInput;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);

        const userInput: UserInput = await prompts([{
            name: "email",
            message: "User email",
            type: "text"
        }]);
        console.log("Got user input", userInput);
        this.userInput = userInput;

        const member = await AdminCactusMemberService.getSharedInstance().getMemberByEmail(userInput.email);
        if (!member) {
            console.log('no member found');
            return;
        }

        const appleTransactionId = member.subscription?.appleOriginalTransactionId;
        if (!appleTransactionId) {
            console.log("No apple transaction id found on member")
            return;
        }

        console.log('Fetching payment record for apple transaction id = ', appleTransactionId);
        const [payment] = await AdminPaymentService.getSharedInstance().getByAppleOriginalTransactionId(appleTransactionId)

        if (!payment) {
            console.log('no payment found')
            return;
        }

        console.log()
        console.log()
        console.log(JSON.stringify(payment, null, 2));

        console.log('verifying latest receipt');
        const receiptRaw = payment.apple?.raw?.latest_receipt;
        if (!receiptRaw) {
            console.log('no raw receipt found')
            return;
        }
        const verificationResult = await AppleService.getSharedInstance().decodeAppleReceipt(receiptRaw)
        console.log('verification result', JSON.stringify(verificationResult))

        return;
    }

}