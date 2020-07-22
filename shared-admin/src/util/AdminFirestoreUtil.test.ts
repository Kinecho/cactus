import { DocumentSnapshot } from "@admin/services/AdminFirestoreService";
import { Change } from "firebase-functions";
import { AnyChange, ChangeType, getChangeType, getDocumentChangeType } from "@admin/util/AdminFirestoreUtil";

describe("GEt Document Change Type", () => {
    test("Document Change - Deleted", () => {
        const change: Change<DocumentSnapshot> = {
            before: { exists: true } as DocumentSnapshot,
            after: { exists: false } as DocumentSnapshot
        }

        expect(getDocumentChangeType(change)).toEqual(ChangeType.DELETED);
    })


    test("Document Change - neither exists - DELETED", () => {
        const change: Change<DocumentSnapshot> = {
            before: { exists: false } as DocumentSnapshot,
            after: { exists: false } as DocumentSnapshot
        }

        expect(getDocumentChangeType(change)).toEqual(ChangeType.DELETED);
    })


    test("Document Change - Created", () => {
        const change: Change<DocumentSnapshot> = {
            before: { exists: false } as DocumentSnapshot,
            after: { exists: true } as DocumentSnapshot
        }

        expect(getDocumentChangeType(change)).toEqual(ChangeType.CREATED);
    })


    test("Document Change - UPDATED", () => {
        const change: Change<DocumentSnapshot> = {
            before: { exists: true } as DocumentSnapshot,
            after: { exists: true } as DocumentSnapshot
        }

        expect(getDocumentChangeType(change)).toEqual(ChangeType.UPDATED);
    })
})


describe("get Any change type", () => {
    test("before is null, after exists", () => {
        let change: AnyChange = { before: null, after: "exists" }
        expect(getChangeType(change)).toEqual(ChangeType.CREATED)

        change = { after: "exists" }
        expect(getChangeType(change)).toEqual(ChangeType.CREATED)
    })

    test("before exists, after is null", () => {
        let change: AnyChange = { before: "exists", after: null }
        expect(getChangeType(change)).toEqual(ChangeType.DELETED)

        change = { before: "exists" }
        expect(getChangeType(change)).toEqual(ChangeType.DELETED)
    })

    test("both exists", () => {
        const change: AnyChange = { before: "exists", after: "exists" }
        expect(getChangeType(change)).toEqual(ChangeType.UPDATED)
    })

    test("neither exist", () => {
        let change: AnyChange = { before: null, after: null }
        expect(getChangeType(change)).toEqual(ChangeType.DELETED)

        change = {}
        expect(getChangeType(change)).toEqual(ChangeType.DELETED)
    })
})