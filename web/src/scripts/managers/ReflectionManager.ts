export default class ReflectionManager {
    static shared = new ReflectionManager();

    async createFreeformReflection(params: CreateFreeformParms): Promise<CreateFreeformResult> {
        return new Promise<CreateFreeformResult>(async resolve => {
            window.setTimeout(() => {
                resolve({ success: false, error: "Not saving thigns yet" })
            }, 2000)
        });
    }
}