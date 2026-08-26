import { ExtensionBuild, PackagedExtension, ProductCandidate } from "../types.js";

export interface PlatformAdapter {
  readonly platform: "chrome";
  build(candidate: ProductCandidate): Promise<ExtensionBuild>;
  package(build: ExtensionBuild, outputDir: string): Promise<PackagedExtension>;
  submit(packageInfo: PackagedExtension, listing: ExtensionBuild["storeListing"]): Promise<{ submissionId: string; status: string }>;
}
