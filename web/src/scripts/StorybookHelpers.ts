import { select } from "@storybook/addon-knobs";
import { CactusElement } from "@shared/models/CactusElement";
import { IconByName, SvgIconName } from "@shared/types/IconTypes";

type NullableElement = CactusElement | null

export const cactusElementSelect = () => select<CactusElement|string>("Element", [CactusElement.energy,
    CactusElement.meaning,
    CactusElement.experience,
    CactusElement.relationships,
    CactusElement.emotions,
    'null'], CactusElement.emotions);


export const svgIconSelect = (icon: SvgIconName = "flame") => select<SvgIconName>("SVG Icon", Object.values(IconByName), icon)