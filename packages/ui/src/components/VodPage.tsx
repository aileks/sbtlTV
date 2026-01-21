import { useState, useCallback, useEffect, useMemo } from 'react';
import { HeroSection } from './vod/HeroSection';
import { HorizontalCarousel } from './vod/HorizontalCarousel';
import { HorizontalCategoryStrip } from './vod/HorizontalCategoryStrip';
import { VodBrowse } from './vod/VodBrowse';
import { MovieDetail } from './vod/MovieDetail';
import { SeriesDetail } from './vod/SeriesDetail';
import { useRecentMovies, useRecentSeries, useVodCategories } from '../hooks/useVod';
import {
  useTrendingMovies,
  usePopularMovies,
  useLocalPopularMovies,
  useMoviesByGenre,
  useTrendingSeries,
  usePopularSeries,
  useLocalPopularSeries,
  useSeriesByGenre,
  useFeaturedContent,
  useTmdbApiKey,
  useMovieGenres,
  useTvGenres,
} from '../hooks/useTmdbLists';
import {
  useMoviesCategory,
  useSetMoviesCategory,
  useSeriesCategory,
  useSetSeriesCategory,
} from '../stores/uiStore';
import type { StoredMovie, StoredSeries } from '../db';
import './VodPage.css';

type VodType = 'movie' | 'series';
type VodItem = StoredMovie | StoredSeries;

interface VodPageProps {
  type: VodType;
  onPlay?: (url: string, title: string) => void;
  onClose?: () => void;
}

export function VodPage({ type, onPlay, onClose }: VodPageProps) {
  const [selectedItem, setSelectedItem] = useState<VodItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Category state - use the appropriate store based on type
  const moviesCategory = useMoviesCategory();
  const setMoviesCategory = useSetMoviesCategory();
  const seriesCategory = useSeriesCategory();
  const setSeriesCategory = useSetSeriesCategory();

  const selectedCategoryId = type === 'movie' ? moviesCategory : seriesCategory;
  const setSelectedCategoryId = type === 'movie' ? setMoviesCategory : setSeriesCategory;

  // API key for TMDB
  const tmdbApiKey = useTmdbApiKey();

  // Genres from TMDB
  const { genres: movieGenres } = useMovieGenres(type === 'movie' ? tmdbApiKey : null);
  const { genres: tvGenres } = useTvGenres(type === 'series' ? tmdbApiKey : null);
  const genres = type === 'movie' ? movieGenres : tvGenres;

  // Featured content for hero
  const { items: featuredItems } = useFeaturedContent(tmdbApiKey, type === 'movie' ? 'movies' : 'series', 5);

  // Trending and popular from TMDB (if API key available)
  const { movies: trendingMovies, loading: trendingMoviesLoading } = useTrendingMovies(type === 'movie' ? tmdbApiKey : null);
  const { series: trendingSeries, loading: trendingSeriesLoading } = useTrendingSeries(type === 'series' ? tmdbApiKey : null);
  const { movies: popularMovies, loading: popularMoviesLoading } = usePopularMovies(type === 'movie' ? tmdbApiKey : null);
  const { series: popularSeries, loading: popularSeriesLoading } = usePopularSeries(type === 'series' ? tmdbApiKey : null);

  // Select the right data based on type
  const trendingItems = type === 'movie' ? trendingMovies : trendingSeries;
  const trendingLoading = type === 'movie' ? trendingMoviesLoading : trendingSeriesLoading;
  const popularItems = type === 'movie' ? popularMovies : popularSeries;
  const popularLoading = type === 'movie' ? popularMoviesLoading : popularSeriesLoading;

  // Fallback: local popularity
  const { movies: localPopularMovies } = useLocalPopularMovies(type === 'movie' ? 20 : 0);
  const { series: localPopularSeries } = useLocalPopularSeries(type === 'series' ? 20 : 0);
  const localPopularItems = type === 'movie' ? localPopularMovies : localPopularSeries;

  // Recently added
  const { movies: recentMovies, loading: recentMoviesLoading } = useRecentMovies(type === 'movie' ? 20 : 0);
  const { series: recentSeries, loading: recentSeriesLoading } = useRecentSeries(type === 'series' ? 20 : 0);
  const recentItems = type === 'movie' ? recentMovies : recentSeries;
  const recentLoading = type === 'movie' ? recentMoviesLoading : recentSeriesLoading;

  // VOD categories
  const { categories } = useVodCategories(type);

  // Get selected category name for VodBrowse
  const selectedCategory = categories.find(c => c.category_id === selectedCategoryId);

  // Genre-based list (show first genre if available)
  const firstGenre = genres[0];
  const { movies: genreMovies } = useMoviesByGenre(type === 'movie' ? tmdbApiKey : null, firstGenre?.id ?? null);
  const { series: genreSeries } = useSeriesByGenre(type === 'series' ? tmdbApiKey : null, firstGenre?.id ?? null);
  const genreItems = type === 'movie' ? genreMovies : genreSeries;

  const handleItemClick = useCallback((item: VodItem) => {
    setSelectedItem(item);
  }, []);

  const handlePlay = useCallback((url: string, title: string) => {
    if (onPlay) {
      onPlay(url, title);
    }
  }, [onPlay]);

  const handleCloseDetail = useCallback(() => {
    setSelectedItem(null);
  }, []);

  // Handle category selection - also close detail view
  const handleCategorySelect = useCallback((id: string | null) => {
    setSelectedCategoryId(id);
    setSelectedItem(null);
  }, [setSelectedCategoryId]);

  // Handle mouse back button and browser back - close detail view
  useEffect(() => {
    const handleMouseBack = (e: MouseEvent) => {
      if (e.button === 3 && selectedItem) {
        e.preventDefault();
        setSelectedItem(null);
      }
    };

    const handlePopState = () => {
      if (selectedItem) {
        setSelectedItem(null);
      }
    };

    window.addEventListener('mousedown', handleMouseBack);
    window.addEventListener('popstate', handlePopState);

    // Push state when opening detail so back button works
    if (selectedItem) {
      window.history.pushState({ vodDetail: true }, '');
    }

    return () => {
      window.removeEventListener('mousedown', handleMouseBack);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [selectedItem]);

  // Determine which items to show in carousels
  const showTmdbContent = tmdbApiKey && (trendingItems.length > 0 || popularItems.length > 0);

  // Labels
  const typeLabel = type === 'movie' ? 'Movies' : 'Series';
  const browseType = type === 'movie' ? 'movies' : 'series';

  return (
    <div className="vod-page">
      {/* Unified header: back + categories + search */}
      <HorizontalCategoryStrip
        categories={categories.map(c => ({ id: c.category_id, name: c.name }))}
        selectedId={selectedCategoryId}
        onSelect={handleCategorySelect}
        type={type}
        onBack={onClose}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={() => {
          if (searchQuery.trim() && selectedCategoryId === null) {
            setSelectedCategoryId('all');
          }
        }}
      />

      {/* Main content */}
      <main className="vod-page__content">
        {selectedCategoryId === 'all' ? (
          // All items: Virtualized grid with no filter
          <VodBrowse
            type={browseType}
            categoryId={null}
            categoryName={`All ${typeLabel}`}
            search={searchQuery || undefined}
            onItemClick={handleItemClick}
          />
        ) : selectedCategoryId && selectedCategory ? (
          // Category view: Virtualized grid filtered by category
          <VodBrowse
            type={browseType}
            categoryId={selectedCategoryId}
            categoryName={selectedCategory.name}
            search={searchQuery || undefined}
            onItemClick={handleItemClick}
          />
        ) : (
          // Home view: Hero + carousels
          <>
            {/* Hero section */}
            <HeroSection
              items={featuredItems.length > 0 ? featuredItems : localPopularItems.slice(0, 5)}
              type={type}
              onPlay={(item) => {
                if (type === 'movie') {
                  const movie = item as StoredMovie;
                  handlePlay(movie.direct_url, movie.name);
                } else {
                  // Series needs to navigate to detail to pick episode
                  setSelectedItem(item);
                }
              }}
              onMoreInfo={(item) => handleItemClick(item)}
              apiKey={tmdbApiKey}
            />

            {/* Carousels */}
            <div className="vod-page__carousels">
              {showTmdbContent ? (
                <>
                  {trendingItems.length > 0 && (
                    <HorizontalCarousel
                      title="Trending Now"
                      items={trendingItems}
                      type={type}
                      onItemClick={handleItemClick}
                      loading={trendingLoading}
                    />
                  )}

                  {popularItems.length > 0 && (
                    <HorizontalCarousel
                      title="Popular"
                      items={popularItems}
                      type={type}
                      onItemClick={handleItemClick}
                      loading={popularLoading}
                    />
                  )}

                  {firstGenre && genreItems.length > 0 && (
                    <HorizontalCarousel
                      title={firstGenre.name}
                      items={genreItems}
                      type={type}
                      onItemClick={handleItemClick}
                    />
                  )}
                </>
              ) : (
                // Fallback without TMDB
                <HorizontalCarousel
                  title="Popular"
                  items={localPopularItems}
                  type={type}
                  onItemClick={handleItemClick}
                />
              )}

              <HorizontalCarousel
                title="Recently Added"
                items={recentItems}
                type={type}
                onItemClick={handleItemClick}
                loading={recentLoading}
              />
            </div>
          </>
        )}
      </main>

      {/* Detail modal */}
      {selectedItem && type === 'movie' && (
        <MovieDetail
          movie={selectedItem as StoredMovie}
          onClose={handleCloseDetail}
          onPlay={(movie) => handlePlay(movie.direct_url, movie.name)}
          apiKey={tmdbApiKey}
        />
      )}
      {selectedItem && type === 'series' && (
        <SeriesDetail
          series={selectedItem as StoredSeries}
          onClose={handleCloseDetail}
          onPlayEpisode={handlePlay}
          apiKey={tmdbApiKey}
        />
      )}
    </div>
  );
}

export default VodPage;
