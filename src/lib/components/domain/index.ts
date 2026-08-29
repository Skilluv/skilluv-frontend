/**
 * Surfaces that are the same in every domain.
 *
 * Both of these read a domain-parameterised endpoint — `/users/me/next-challenges`
 * and `/domains/{domain}/mentors/for-me` — and were written for design first,
 * which left cyber with two endpoints nothing called. They take the domain as a
 * required prop precisely so nobody can mount one and forget to say which.
 */
export { default as NextChallenges } from './NextChallenges.svelte';
export { default as MentorMatches } from './MentorMatches.svelte';
export { default as FeaturedTalent } from './FeaturedTalent.svelte';
