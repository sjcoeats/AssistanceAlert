import { useState, useRef, useEffect } from "react";

export function useSound(audioBase64: string) {
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element when the hook is first used
    const audio = new Audio();
    audio.src = audioBase64;
    audio.preload = "auto";
    audioRef.current = audio;

    // Clean up on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioBase64]);

  const play = () => {
    if (audioRef.current && !isMuted) {
      // Reset and play
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
    }
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
    if (audioRef.current && !isMuted) {
      stop();
    }
  };

  return {
    play,
    stop,
    isMuted,
    toggleMute
  };
}
