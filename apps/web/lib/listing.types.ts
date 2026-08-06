/** Shape shared by every read of a listing's physical/categorical attributes — cabinet form, catalog list, catalog detail. */
export interface ListingAttributes {
  name: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  breastSize: number | null;
  type: string | null;
  figure: string | null;
  temperament: string | null;
  hairColor: string | null;
  eyeColor: string | null;
  country: string | null;
  city: string | null;
  /** Rubles. */
  priceHour: number | null;
  priceNight: number | null;
}
