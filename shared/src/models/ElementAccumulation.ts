import {BaseModel, Collection} from "@shared/FirestoreBaseModels";
import CactusElement from "@shared/models/PromptContent";

export default interface ElementAccumulation {
  [key: CactusElement]: number};
};