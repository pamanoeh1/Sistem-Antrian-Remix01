import React, { useState, useEffect } from 'react';
import { MediaSettings, SlideItem } from '../../types/queue';
import { Play, Pause, Volume2, VolumeX, ChevronLeft, ChevronRight, Film, Image as ImageIcon } from 'lucide-react';

interface MediaPlayerProps {
  settings: MediaSettings;
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({ settings }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);

  const slides = Array.isArray(settings?.slides) && settings.slides.length > 0 ? settings.slides : [];

  // Slideshow auto-advance timer
  useEffect(() => {
    if (settings.type !== 'slideshow' || isPaused || slides.length === 0) return;

    const durationMs = (settings.slideDurationSec || 6) * 1000;
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, durationMs);

    return () => clearInterval(timer);
  }, [settings.type, settings.slideDurationSec, slides.length, isPaused]);

  const handlePrevSlide = () => {
    if (slides.length === 0) return;
    setCurrentSlideIndex((prev) =>
      prev === 0 ? slides.length - 1 : prev - 1
    );
  };

  const handleNextSlide = () => {
    if (slides.length === 0) return;
    setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
  };

  const currentSlide = slides[currentSlideIndex] || slides[0] || {
    id: 'slide-fallback',
    title: 'Selamat Datang',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    caption: 'Budayakan mengantre dengan tertib demi kenyamanan bersama.',
  };

  return (
    <div className="relative w-full h-full min-h-[300px] md:min-h-[360px] bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col justify-between">
      {settings.type === 'video' ? (
        // Video Player Mode
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          <video
            key={settings.videoUrl}
            src={settings.videoUrl}
            autoPlay
            loop
            muted={isVideoMuted}
            playsInline
            className="w-full h-full object-cover max-h-[480px]"
          />

          {/* Video Control Bar Overlay */}
          <div className="absolute top-3 right-3 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/60 z-10">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Film className="w-3.5 h-3.5 text-blue-400" />
              <span>Video Informasi</span>
            </span>
            <button
              type="button"
              onClick={() => setIsVideoMuted(!isVideoMuted)}
              className="p-1 rounded-full text-slate-300 hover:text-white transition"
              title={isVideoMuted ? 'Nyalakan Audio Video' : 'Bisukan Audio Video'}
              aria-label={isVideoMuted ? 'Nyalakan Audio Video' : 'Bisukan Audio Video'}
            >
              {isVideoMuted ? (
                <VolumeX className="w-4 h-4 text-amber-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>
          </div>
        </div>
      ) : (
        // Photo Slideshow Mode
        <div className="relative w-full h-full min-h-[320px] flex items-center justify-center bg-slate-900 overflow-hidden">
          {currentSlide && (
            <div className="absolute inset-0 transition-opacity duration-700 ease-in-out">
              <img
                src={currentSlide.url}
                alt={currentSlide.title}
                className="w-full h-full object-cover brightness-90 transform scale-105 transition-transform duration-10000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

              {/* Caption Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 text-white z-10">
                <span className="inline-flex items-center gap-1.5 bg-blue-600/90 backdrop-blur-xs text-white text-xs font-bold px-3 py-1 rounded-full mb-2">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Info Layanan #{currentSlideIndex + 1}</span>
                </span>
                <h3 className="text-lg md:text-xl font-bold tracking-tight text-white mb-1 drop-shadow-sm">
                  {currentSlide.title}
                </h3>
                <p className="text-xs md:text-sm text-slate-200 line-clamp-2 max-w-xl drop-shadow-sm">
                  {currentSlide.caption}
                </p>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 z-20">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlideIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentSlideIndex ? 'w-6 bg-blue-500' : 'w-2 bg-white/40'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="absolute top-3 right-3 flex items-center gap-1 bg-slate-900/70 backdrop-blur-md px-2 py-1 rounded-full border border-slate-700/60 z-20">
            <button
              type="button"
              onClick={handlePrevSlide}
              className="p-1 rounded-full text-slate-300 hover:text-white transition"
              aria-label="Slide sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className="p-1 rounded-full text-slate-300 hover:text-white transition"
              aria-label={isPaused ? 'Lanjutkan slide' : 'Jeda slide'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={handleNextSlide}
              className="p-1 rounded-full text-slate-300 hover:text-white transition"
              aria-label="Slide berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
