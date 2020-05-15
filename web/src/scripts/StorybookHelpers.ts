import { select } from "@storybook/addon-knobs";
import { CactusElement } from "@shared/models/CactusElement";
import { IconByName, SvgIconName } from "@shared/types/IconTypes";

export const cactusElementSelect = () => select("Element", [CactusElement.energy,
    CactusElement.meaning,
    CactusElement.experience,
    CactusElement.relationships,
    CactusElement.emotions], CactusElement.meaning);


export const svgIconSelect = (icon: SvgIconName = "flame") => select<SvgIconName>("SVG Icon", Object.values(IconByName), icon)