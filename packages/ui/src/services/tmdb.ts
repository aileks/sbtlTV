/**
 * TMDB Service
 *
 * Wrapper around tmdb-ts for fetching movie/series metadata,
 * trending lists, and search functionality.
 */

import { TMDB } from 'tmdb-ts';

// TMDB image base URLs
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
export const TMDB_POSTER_SIZES = {
  small: 'w185',
  medium: 'w342',
  large: 'w500',
  original: 'original',
} as const;
export const TMDB_BACKDROP_SIZES = {
  small: 'w300',
  medium: 'w780',
  large: 'w1280',
  original: 'original',
} as const;

// Helper to build full image URL
export function getTmdbImageUrl(
  path: string | null | undefined,
  size: string = TMDB_POSTER_SIZES.medium
): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

// Singleton instance
let tmdbInstance: TMDB | null = null;
let currentApiKey: string | null = null;

/**
 * Initialize or get TMDB client
 */
export function getTmdb(apiKey: string): TMDB {
  if (!tmdbInstance || currentApiKey !== apiKey) {
    tmdbInstance = new TMDB(apiKey);
    currentApiKey = apiKey;
  }
  return tmdbInstance;
}

/**
 * Check if TMDB is configured
 */
export function isTmdbConfigured(): boolean {
  return tmdbInstance !== null && currentApiKey !== null;
}

/**
 * Clear TMDB instance (for logout/key change)
 */
export function clearTmdb(): void {
  tmdbInstance = null;
  currentApiKey = null;
}

// ===========================================================================
// Movie endpoints
// ===========================================================================

export interface TmdbMovieResult {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  adult: boolean;
}

export interface TmdbMovieDetails extends TmdbMovieResult {
  imdb_id: string | null;
  runtime: number;
  genres: Array<{ id: number; name: string }>;
  tagline: string;
  status: string;
  budget: number;
  revenue: number;
}

/**
 * Get trending movies
 */
export async function getTrendingMovies(
  apiKey: string,
  timeWindow: 'day' | 'week' = 'week'
): Promise<TmdbMovieResult[]> {
  const tmdb = getTmdb(apiKey);
  const response = await tmdb.trending.trending('movie', timeWindow);
  return response.results as unknown as TmdbMovieResult[];
}

/**
 * Get popular movies
 */
export async function getPopularMovies(
  apiKey: string,
  page = 1
): Promise<TmdbMovieResult[]> {
  const tmdb = getTmdb(apiKey);
  const response = await tmdb.movies.popular({ page });
  return response.results as TmdbMovieResult[];
}

/**
 * Get top rated movies
 */
export async function getTopRatedMovies(
  apiKey: string,
  page = 1
): Promise<TmdbMovieResult[]> {
  const tmdb = getTmdb(apiKey);
  const response = await tmdb.movies.topRated({ page });
  return response.results as TmdbMovieResult[];
}

/**
 * Search movies
 */
export async function searchMovies(
  apiKey: string,
  query: string,
  year?: number
): Promise<TmdbMovieResult[]> {
  const tmdb = getTmdb(apiKey);
  const response = await tmdb.search.movies({ query, year });
  return response.results as TmdbMovieResult[];
}

/**
 * Get movie details
 */
export async function getMovieDetails(
  apiKey: string,
  movieId: number
): Promise<TmdbMovieDetails> {
  const tmdb = getTmdb(apiKey);
  const details = await tmdb.movies.details(movieId);
  return details as unknown as TmdbMovieDetails;
}

// ===========================================================================
// TV Show endpoints
// ===========================================================================

export interface TmdbTvResult {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
}

export interface TmdbTvDetails extends TmdbTvResult {
  number_of_seasons: number;
  number_of_episodes: number;
  genres: Array<{ id: number; name: string }>;
  status: string;
  tagline: string;
  episode_run_time: number[];
  external_ids?: {
    imdb_id: string | null;
  };
}

/**
 * Get trending TV shows
 */
export async function getTrendingTvShows(
  apiKey: string,
  timeWindow: 'day' | 'week' = 'week'
): Promise<TmdbTvResult[]> {
  const tmdb = getTmdb(apiKey);
  const response = await tmdb.trending.trending('tv', timeWindow);
  return response.results as unknown as TmdbTvResult[];
}

/**
 * Get popular TV shows
 */
export async function getPopularTvShows(
  apiKey: string,
  page = 1
): Promise<TmdbTvResult[]> {
  const tmdb = getTmdb(apiKey);
  const response = await tmdb.tvShows.popular({ page });
  return response.results as TmdbTvResult[];
}

/**
 * Get top rated TV shows
 */
export async function getTopRatedTvShows(
  apiKey: string,
  page = 1
): Promise<TmdbTvResult[]> {
  const tmdb = getTmdb(apiKey);
  const response = await tmdb.tvShows.topRated({ page });
  return response.results as TmdbTvResult[];
}

/**
 * Search TV shows
 */
export async function searchTvShows(
  apiKey: string,
  query: string,
  firstAirDateYear?: number
): Promise<TmdbTvResult[]> {
  const tmdb = getTmdb(apiKey);
  const response = await tmdb.search.tvShows({ query, first_air_date_year: firstAirDateYear });
  return response.results as TmdbTvResult[];
}

/**
 * Get TV show details
 */
export async function getTvShowDetails(
  apiKey: string,
  tvId: number
): Promise<TmdbTvDetails> {
  const tmdb = getTmdb(apiKey);
  const details = await tmdb.tvShows.details(tvId);
  return details as unknown as TmdbTvDetails;
}

// ===========================================================================
// Genre endpoints
// ===========================================================================

export interface TmdbGenre {
  id: number;
  name: string;
}

/**
 * Get movie genres
 */
export async function getMovieGenres(apiKey: string): Promise<TmdbGenre[]> {
  const tmdb = getTmdb(apiKey);
  const response = await tmdb.genres.movies();
  return response.genres;
}

/**
 * Get TV genres
 */
export async function getTvGenres(apiKey: string): Promise<TmdbGenre[]> {
  const tmdb = getTmdb(apiKey);
  const response = await tmdb.genres.tvShows();
  return response.genres;
}

// ===========================================================================
// Discovery endpoints
// ===========================================================================

/**
 * Discover movies by genre
 */
export async function discoverMoviesByGenre(
  apiKey: string,
  genreId: number,
  page = 1
): Promise<TmdbMovieResult[]> {
  const tmdb = getTmdb(apiKey);
  const response = await tmdb.discover.movie({
    with_genres: String(genreId),
    page,
    sort_by: 'popularity.desc',
  });
  return response.results as TmdbMovieResult[];
}

/**
 * Discover TV shows by genre
 */
export async function discoverTvShowsByGenre(
  apiKey: string,
  genreId: number,
  page = 1
): Promise<TmdbTvResult[]> {
  const tmdb = getTmdb(apiKey);
  const response = await tmdb.discover.tvShow({
    with_genres: String(genreId),
    page,
    sort_by: 'popularity.desc',
  });
  return response.results as TmdbTvResult[];
}

// ===========================================================================
// Validation
// ===========================================================================

/**
 * Validate TMDB API key
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const tmdb = new TMDB(apiKey);
    // Try to fetch a simple endpoint
    await tmdb.genres.movies();
    return true;
  } catch {
    return false;
  }
}

// ===========================================================================
// GitHub Cache (fallback for users without API key)
// ===========================================================================

// URL to the raw cached TMDB data from GitHub
// TODO: Update this to your actual GitHub repo once published
const GITHUB_CACHE_URL = 'https://raw.githubusercontent.com/your-username/sbtlTV/main/data/tmdb-cache.json';

// Cache the fetched data in memory
let cachedTmdbData: TmdbCacheData | null = null;
let cacheLastFetched: number = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour in-memory cache

interface TmdbCacheData {
  generated_at: string;
  movies: {
    trending_day?: TmdbMovieResult[];
    trending_week?: TmdbMovieResult[];
    popular?: TmdbMovieResult[];
    top_rated?: TmdbMovieResult[];
    now_playing?: TmdbMovieResult[];
    genres?: TmdbGenre[];
    by_genre?: Record<string, TmdbMovieResult[]>;
  };
  tv: {
    trending_day?: TmdbTvResult[];
    trending_week?: TmdbTvResult[];
    popular?: TmdbTvResult[];
    top_rated?: TmdbTvResult[];
    genres?: TmdbGenre[];
  };
}

/**
 * Fetch cached TMDB data from GitHub
 * Returns null if cache is unavailable
 */
async function fetchCachedTmdbData(): Promise<TmdbCacheData | null> {
  // Return in-memory cache if still valid
  if (cachedTmdbData && Date.now() - cacheLastFetched < CACHE_TTL_MS) {
    return cachedTmdbData;
  }

  try {
    const response = await fetch(GITHUB_CACHE_URL);
    if (!response.ok) {
      console.warn('[TMDB Cache] GitHub cache not available:', response.status);
      return null;
    }
    cachedTmdbData = await response.json();
    cacheLastFetched = Date.now();
    console.log('[TMDB Cache] Loaded from GitHub, generated:', cachedTmdbData?.generated_at);
    return cachedTmdbData;
  } catch (err) {
    console.warn('[TMDB Cache] Failed to fetch from GitHub:', err);
    return null;
  }
}

/**
 * Get trending movies with cache fallback
 * Tries GitHub cache first if no API key, falls back to direct API
 */
export async function getTrendingMoviesWithCache(
  apiKey?: string,
  timeWindow: 'day' | 'week' = 'week'
): Promise<TmdbMovieResult[]> {
  // Try cache first if no API key
  if (!apiKey) {
    const cache = await fetchCachedTmdbData();
    const cacheKey = timeWindow === 'day' ? 'trending_day' : 'trending_week';
    if (cache?.movies[cacheKey]) {
      return cache.movies[cacheKey]!;
    }
    return [];
  }
  return getTrendingMovies(apiKey, timeWindow);
}

/**
 * Get popular movies with cache fallback
 */
export async function getPopularMoviesWithCache(apiKey?: string): Promise<TmdbMovieResult[]> {
  if (!apiKey) {
    const cache = await fetchCachedTmdbData();
    if (cache?.movies.popular) {
      return cache.movies.popular;
    }
    return [];
  }
  return getPopularMovies(apiKey);
}

/**
 * Get top rated movies with cache fallback
 */
export async function getTopRatedMoviesWithCache(apiKey?: string): Promise<TmdbMovieResult[]> {
  if (!apiKey) {
    const cache = await fetchCachedTmdbData();
    if (cache?.movies.top_rated) {
      return cache.movies.top_rated;
    }
    return [];
  }
  return getTopRatedMovies(apiKey);
}

/**
 * Get trending TV with cache fallback
 */
export async function getTrendingTvShowsWithCache(
  apiKey?: string,
  timeWindow: 'day' | 'week' = 'week'
): Promise<TmdbTvResult[]> {
  if (!apiKey) {
    const cache = await fetchCachedTmdbData();
    const cacheKey = timeWindow === 'day' ? 'trending_day' : 'trending_week';
    if (cache?.tv[cacheKey]) {
      return cache.tv[cacheKey]!;
    }
    return [];
  }
  return getTrendingTvShows(apiKey, timeWindow);
}

/**
 * Get popular TV with cache fallback
 */
export async function getPopularTvShowsWithCache(apiKey?: string): Promise<TmdbTvResult[]> {
  if (!apiKey) {
    const cache = await fetchCachedTmdbData();
    if (cache?.tv.popular) {
      return cache.tv.popular;
    }
    return [];
  }
  return getPopularTvShows(apiKey);
}

/**
 * Get movie genres with cache fallback
 */
export async function getMovieGenresWithCache(apiKey?: string): Promise<TmdbGenre[]> {
  if (!apiKey) {
    const cache = await fetchCachedTmdbData();
    if (cache?.movies.genres) {
      return cache.movies.genres;
    }
    return [];
  }
  return getMovieGenres(apiKey);
}

/**
 * Get TV genres with cache fallback
 */
export async function getTvGenresWithCache(apiKey?: string): Promise<TmdbGenre[]> {
  if (!apiKey) {
    const cache = await fetchCachedTmdbData();
    if (cache?.tv.genres) {
      return cache.tv.genres;
    }
    return [];
  }
  return getTvGenres(apiKey);
}
