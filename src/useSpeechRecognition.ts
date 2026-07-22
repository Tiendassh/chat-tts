import { useState, useEffect, useCallback } from 'react';

export function useSpeechRecognition(language: string = 'es-ES') {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = language;
        
        rec.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
             currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
        };

        rec.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        setRecognition(rec);
      } else {
        console.warn('Speech recognition not supported in this browser.');
      }
    }
  }, [language]);

  const startListening = useCallback(() => {
    if (recognition) {
      setTranscript('');
      setIsListening(true);
      recognition.start();
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition]);

  const resetTranscript = useCallback(() => {
      setTranscript('');
  }, []);

  return { isListening, transcript, startListening, stopListening, isSupported: !!recognition, resetTranscript };
}
