import {getIntegerFromStringBetween} from "@shared/util/StringUtil";

const avatarUrls = [
    "/assets/images/avatars/cactusOG.svg",
    "/assets/images/avatars/dark.svg",
    "/assets/images/avatars/greenFat.svg",
    "/assets/images/avatars/greenTall.svg",
    "/assets/images/avatars/yellowFat.svg"
];

export function getRandomAvatar(id?: string) {
    let index = 0;
    if (id) {
        index = getIntegerFromStringBetween(id, avatarUrls.length - 1);
    } else {
        index = Math.floor(Math.random() * avatarUrls.length);
    }

    return avatarUrls[index];
}