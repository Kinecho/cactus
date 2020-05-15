import { select } from "@storybook/addon-knobs";
import { CactusElement } from "@shared/models/CactusElement";

export const cactusElementSelect = () => select("Element", [CactusElement.energy,
    CactusElement.meaning,
    CactusElement.experience,
    CactusElement.relationships,
    CactusElement.emotions], CactusElement.meaning);