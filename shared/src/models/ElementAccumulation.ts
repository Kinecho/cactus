import {CactusElement} from "@shared/models/CactusElement";

export type ElementAccumulation = {
    [key in CactusElement]: number;
};

export function createElementAccumulation(): ElementAccumulation {
    return {
        emotions: 0,
        energy: 0,
        experience: 0,
        meaning: 0,
        relationships: 0
    }
}