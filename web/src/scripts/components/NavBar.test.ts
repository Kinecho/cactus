import {mount, shallowMount} from "@vue/test-utils";
import NavBar from "@components/NavBar.vue";
import {mockauth, mockFirebase} from "@test/jestsetup";
import CactusMember from "@shared/models/CactusMember";
import {SocialActivityFeedEvent, SocialActivityFeedResponse, SocialActivityType} from "@shared/types/SocialTypes";

const jest = require("jest");

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

jest.mock("@web/social", () => {
    return {
        getSocialActivity: async (member: CactusMember): Promise<SocialActivityFeedResponse> => {
            const event1: SocialActivityFeedEvent = {
                eventType: SocialActivityType.ReflectionResponse,
                occurredAt: new Date(),
                eventId: "123",
            };
            return {success: true, results: [event1]}
        }
    }
});

jest.mock("@web/services/CactusMemberService", () => {
    return {
        sharedInstance: {
            observeCurrentMember: () => {
                return;
            }
        },
    }
});


jest.mock("@web/services/MemberProfileService", () => {
    return {
        sharedInstance: {
            observeByMemberId: (memberId?: string) => {
                console.log("mocked observe method", memberId)
            }
        },
    }
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



    test.skip("signup button is visible", () => {

        mockFirebase.auth().changeAuthState({uid: "124"});
        // mockFirebase.auth().onIdTokenChanged()
        // mockFirebase.auth().idTokenC
        mockFirebase.auth().changeAuthState(null);
        const props = {
            showSignup: true,
            forceTransparent: false,
        };
        const wrapper = mount(NavBar, {
            propsData: props
        });

        mockFirebase.auth().flush();

        const signupButton = wrapper.find("[data-test='signup-button']");
        console.log("signup button", signupButton);
        expect(signupButton.isVisible()).toBeTruthy();
    });

    test.skip("badge count is visible", () => {

        mockFirebase.auth().changeAuthState({});
        // mockFirebase.auth().changeAuthState(null);
        const props = {
            showSignup: true,
        };
        const wrapper = shallowMount(NavBar, {
            propsData: props,
        });

        wrapper.setData({...wrapper.vm.$data, activityBadgeCount: 1});

        mockFirebase.auth().flush();

        const signupButton = wrapper.find("[data-test='signup-button']");
        const badge = wrapper.find("[data-test='badge']");
        console.log("signup button", signupButton);
        expect(signupButton.exists()).toBeFalsy();
        expect(badge.exists()).toBeTruthy();
    });
});

