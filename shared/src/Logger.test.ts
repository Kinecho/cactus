import Logger from "@shared/Logger";

const DATE_STRING = "2020-01-01_test";
beforeEach(() => {
    const origLog = console.log;
    const origWarn = console.warn;
    console.log = jest.fn((...args) => {
        origLog(...args);
    });

    console.warn = jest.fn((...args) => {
        origWarn(args);
    });
});


test("log outputs all params as expected", () => {
    const logger = new Logger({fileName: "LoggerTest"});
    logger.getDateString = () => DATE_STRING;
    logger.info("message", "second");
    expect(console.log).toHaveBeenCalledTimes((1));
    expect(console.log).toHaveBeenCalledWith(`${DATE_STRING} [LoggerTest]`, "message", "second");
});

test("prints objects", () => {
    const logger = new Logger({fileName: "LoggerTest"});
    logger.getDateString = () => DATE_STRING;
    logger.info({key: "value"});
    expect(console.log).toHaveBeenCalledTimes((1));
    expect(console.log).toHaveBeenCalledWith(`${DATE_STRING} [LoggerTest]`, {key: "value"});
});

test("warning", () => {
    const logger = new Logger({fileName: "LoggerTest"});
    logger.warn("first warning");
    logger.warn("second warning");
    expect(console.warn).toHaveBeenCalledTimes(2);
});