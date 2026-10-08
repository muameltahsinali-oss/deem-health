/**
 * Product claims shown as badges on the product page.
 *
 * "منتج حلال" is shown on every product (store policy).
 * "خالٍ من المواد الحيوانية" is shown ONLY for the products listed here — add a slug only after
 * checking the package: collagen is usually from cows or fish, gelatin from animals and protein
 * shakes often contain milk protein, so those must not carry the claim unless the label confirms it.
 */
export const ANIMAL_FREE_SLUGS: ReadonlySet<string> = new Set([
  "nutriplus-chamomile-extract", // herbal extracts + natural lemon flavour
  "nutriplus-recharge", // guarana, vitamins, taurine
]);

export function isAnimalFree(slug: string): boolean {
  return ANIMAL_FREE_SLUGS.has(slug);
}
