import {BaseModel, Collection} from "@shared/FirestoreBaseModels";
import {CactusElement} from "@shared/models/CactusElement";

export interface ElementAccumulation {
  energy: number,
  experience: number,
  relationships: number,
  emotions: number,
  meaning: number
};