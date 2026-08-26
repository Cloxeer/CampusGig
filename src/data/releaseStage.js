/**
 * Product stage shown under the GetCampusGig.com wordmark.
 * Flip this one value: "alpha" → "beta" → null (full launch, badge hidden).
 */
export const RELEASE_STAGE = "alpha";

export function releaseStageLabel(stage = RELEASE_STAGE) {
  switch (stage) {
    case "alpha":
      return "Alpha Stage";
    case "beta":
      return "Beta Stage";
    case null:
      return null;
    default:
      return null;
  }
}
