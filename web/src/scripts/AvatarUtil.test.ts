import {getRandomAvatar} from "@web/AvatarUtil";

test("random avatars", () => {
    expect(getRandomAvatar()).toBeDefined();
    expect(getRandomAvatar("neil+catus@cactus.app")).toEqual("/assets/images/avatars/greenTall.svg");
    expect(getRandomAvatar("neil+other@kinecho.com")).toEqual("/assets/images/avatars/dark.svg");
});