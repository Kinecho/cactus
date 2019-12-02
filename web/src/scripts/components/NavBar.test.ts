import {shallowMount} from "@vue/test-utils";

const jest = require("jest");
import NavBar from "@components/NavBar.vue";
import {mockFirebase, mockauth} from "@test/jestsetup";

jest.mock("@web/auth", () => {
    return {
        logout: () => undefined,
    }
});

jest.mock("@web/analytics", () => {
    return {
        gtag() {
            console.log("gtag called with args", arguments);
        }
    }
});

jest.mock("@web/firebase", () => {
    return {
        getAuth: () => mockauth,
        initializeFirebase: () => mockFirebase
    };
});

describe("NavBar.vue test", () => {
    test("header is visible after mounting", () => {
        const props = {
            showSignup: true,
        };
        const wrapper = shallowMount(NavBar, {
            propsData: props
        });

        const signupButton = wrapper.find("[data-test='signup-button']");
        const header = wrapper.find("header");
        console.log("signup button", signupButton);
        expect(header.isVisible()).toBeTruthy();
    });


    test("signup button is visible", () => {

        mockFirebase.auth().changeAuthState({});
        mockFirebase.auth().changeAuthState(null);
        const props = {
            showSignup: true,
        };
        const wrapper = shallowMount(NavBar, {
            propsData: props
        });

        mockFirebase.auth().flush();

        const signupButton = wrapper.find("[data-test='signup-button']");
        console.log("signup button", signupButton);
        expect(signupButton.isVisible()).toBeTruthy();
    });
});

