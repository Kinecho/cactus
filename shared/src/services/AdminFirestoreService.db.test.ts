import {getAdmin} from "@shared/test/testHelpers";
import {Collection} from "@shared/FirestoreBaseModels";
import AdminFirestoreService from "@shared/services/AdminFirestoreService";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";


test("get reflection prompt from db using admin firestore service", async () => {
    const mockData = {
        [`${Collection.reflectionPrompt}/1`]: {
            question: "Hello?"
        }
    };
    const {app} = await getAdmin(mockData);

    AdminFirestoreService.initialize(app);
    const model = await AdminFirestoreService.getSharedInstance().getById("1", ReflectionPrompt);
    expect(model).toBeDefined();

});