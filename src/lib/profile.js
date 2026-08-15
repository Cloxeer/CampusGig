/**
 * Barrel for the profile/data layer.
 * Implementation is split by domain; this file keeps the historical
 * `../lib/profile` import path stable for all consumers.
 */
export * from "./profileShared";
export * from "./avatar";
export * from "./users";
export * from "./reviews";
export * from "./rep";
export * from "./gigs";
export * from "./notifications";
