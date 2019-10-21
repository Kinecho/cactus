import {BaseModel, Collection} from "@shared/FirestoreBaseModels";
import {CactusElement} from "@shared/models/CactusElement";

export interface ElementAccumulation {
  [key: keyof typeof CactusElement]: number
};