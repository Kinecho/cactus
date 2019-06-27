import {getAllCommandFilenames, validateCommandExists} from "@scripts/run";

test("getAllCommands", async () => {
    const commands = await getAllCommandFilenames();
    expect(commands.length).toBeGreaterThan(0);
    commands.forEach(cmd => expect(cmd.endsWith(".ts")).toBeTruthy())
});

test("validate command exists", async () => {
    const commands = await getAllCommandFilenames();
    const first = commands[0];
    expect(validateCommandExists(first)).toBeTruthy();
    expect(validateCommandExists("_THIS_WILL_NOT_EXIST.ts")).toBeTruthy();
});