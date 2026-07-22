import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Volume2, Loader2, Bot, User, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSpeechRecognition } from './useSpeechRecognition';
import { Message } from './types';

export default function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: 'Greetings. I am ready to transcribe and vocalize your requests. How may I assist your development today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState<string | null>(null);
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isListening, transcript, startListening, stopListening, isSupported, resetTranscript } = useSpeechRecognition();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isListening && transcript) {
      setInput(transcript);
    }
  }, [transcript, isListening]);

  const playTTS = async (text: string, messageId: string) => {
    if (isAudioLoading) return;
    setIsAudioLoading(messageId);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (!res.ok) {
        throw new Error('TTS failed');
      }
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
    } catch (err) {
      console.error("Failed to play audio:", err);
      alert("Error al generar el audio. Verifica que HF_TOKEN esté configurado correctamente.");
    } finally {
      setIsAudioLoading(null);
    }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    resetTranscript();
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.text,
          history: messages.map(m => ({ role: m.role, text: m.text }))
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to fetch chat response');
      }

      const data = await res.json();
      const modelMessageId = (Date.now() + 1).toString();
      const modelMessage: Message = {
        id: modelMessageId,
        role: 'model',
        text: data.response
      };

      setMessages(prev => [...prev, modelMessage]);

      if (autoPlayAudio) {
        playTTS(modelMessage.text, modelMessageId);
      }
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: `Error: ${err.message}. Asegúrate de que las variables de entorno GEMINI_API_KEY y HF_TOKEN estén configuradas.`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListen = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header controls */}
      <div className="absolute top-4 right-8 z-10">
        <button 
          onClick={() => setAutoPlayAudio(!autoPlayAudio)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-colors border"
          style={{ 
            borderColor: autoPlayAudio ? 'var(--accent)' : 'var(--border)',
            color: autoPlayAudio ? 'var(--accent)' : 'var(--text-dim)',
            backgroundColor: autoPlayAudio ? 'rgba(192, 160, 128, 0.1)' : 'transparent'
          }}
          title={autoPlayAudio ? "Desactivar auto-reproducción" : "Activar auto-reproducción"}
        >
          {autoPlayAudio ? <Volume2 size={14} /> : <VolumeX size={14} />}
          <span>Auto-TTS</span>
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col max-w-[85%] md:max-w-[70%] text-[14px] leading-[1.6] ${msg.role === 'user' ? 'self-end' : 'self-start'}`}
            >
              <div 
                className="p-4 rounded-[12px]"
                style={msg.role === 'user' ? {
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderTopRightRadius: 0
                } : {
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderTopLeftRadius: 0
                }}
              >
                {msg.role === 'model' && (
                  <div className="mb-2 italic" style={{ fontFamily: 'var(--f-serif)', color: '#fff' }}>
                    Vox-01
                  </div>
                )}
                <div>
                  {msg.text}
                </div>
                
                {msg.role === 'model' && (
                  <div className="mt-3 flex items-center justify-between">
                    <button
                      onClick={() => playTTS(msg.text, msg.id)}
                      disabled={isAudioLoading === msg.id}
                      className="text-[12px] flex items-center gap-1.5 transition-colors"
                      style={{ color: 'var(--text-dim)' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
                    >
                      {isAudioLoading === msg.id ? (
                        <><Loader2 size={14} className="animate-spin" /> Transmitting...</>
                      ) : (
                        <><Volume2 size={14} /> Vocalize</>
                      )}
                    </button>
                    {isAudioLoading === msg.id && (
                       <div className="voice-wave">
                         <div className="wave-bar animate-pulse" style={{ height: '12px', animationDelay: '0ms' }}></div>
                         <div className="wave-bar animate-pulse" style={{ height: '18px', animationDelay: '100ms' }}></div>
                         <div className="wave-bar animate-pulse" style={{ height: '14px', animationDelay: '200ms' }}></div>
                         <div className="wave-bar animate-pulse" style={{ height: '20px', animationDelay: '300ms' }}></div>
                         <div className="wave-bar animate-pulse" style={{ height: '16px', animationDelay: '400ms' }}></div>
                       </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col max-w-[85%] md:max-w-[70%] text-[14px] self-start"
            >
              <div 
                className="p-4 rounded-[12px]"
                style={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderTopLeftRadius: 0
                }}
              >
                <div className="mb-2 italic" style={{ fontFamily: 'var(--f-serif)', color: '#fff' }}>
                  Vox-01
                </div>
                <div className="flex items-center gap-1 h-4 px-2">
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s]" style={{ backgroundColor: 'var(--accent)' }}></div>
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ backgroundColor: 'var(--accent)' }}></div>
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'var(--accent)' }}></div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div className="h-[100px] border-t px-8 flex items-center gap-4 shrink-0" style={{ borderColor: 'var(--border)' }}>
        <form onSubmit={sendMessage} className="flex-1 flex items-center gap-4">
          {isSupported && (
            <button
              type="button"
              onClick={toggleListen}
              className={`action-btn ${isListening ? 'action-btn-primary animate-pulse' : ''} shrink-0`}
              style={isListening ? { backgroundColor: 'red', borderColor: 'red', color: 'white' } : {}}
              title={isListening ? "Stop listening" : "Voice input"}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          )}
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Listening..." : "Ask something..."}
            className="flex-1 rounded-[30px] h-[48px] px-6 outline-none text-[14px]"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.05)', 
              border: '1px solid var(--border)',
              color: '#fff'
            }}
          />
          
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`action-btn ${input.trim() && !isLoading ? 'action-btn-primary' : ''} shrink-0`}
          >
            <Send size={18} className="ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
}
