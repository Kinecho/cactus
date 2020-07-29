export enum ExperimentType {
    redirect = "redirect"
}

export interface Variant {
    name: string
}

export interface RedirectVariant extends Variant {
    path: string;
}

export interface RedirectExperiment {
    variants: RedirectVariant[]
}

export interface ActivationResult {
    variant: string|null,

}