import {BaseModel, Collection} from "@shared/FirestoreBaseModels";
import {CactusElement} from "@shared/models/CactusElement";

export type ElementAccumulation = {
  [key in CactusElement]: number;
};