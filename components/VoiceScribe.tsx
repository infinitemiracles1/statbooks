
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';
import { Mic, MicOff, Square } from 'lucide-react';
import { encode } from '../utils/audio';

interface VoiceScribeProps {
  setManuscript: (updater: (prev: string) => string) => void;
}

// Per Gemini API guidelines for Live API audio encoding.
function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    // The supported audio MIME type is 'audio/pcm'. Do not use other types.
    mimeType: 'audio/pcm;rate=16000',
  };
}

const VoiceScribe: React.FC<VoiceScribeProps> = ({ setManuscript }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('Idle. Press Start to begin dictation.');
  const [transcript, setTranscript] = useState('');
  
  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const stopRecording = useCallback(() => {
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => session.close());
      sessionPromiseRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
     if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    setIsRecording(false);
    setStatus('Recording stopped. Press Start to begin again.');
  }, []);
  
  const startRecording = async () => {
    if (isRecording) return;
    setIsRecording(true);
    setTranscript('');
    setStatus('Connecting to AI Scribe...');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus('Connected. Start speaking...');
            // FIX: Cast window to any to access webkitAudioContext for broader browser compatibility.
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const source = audioContextRef.current.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              // FIX: Use helper function to create blob according to Gemini API guidelines.
              const pcmBlob = createBlob(inputData);
              if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              }
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current.destination);
          },
          onmessage: (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              setTranscript(prev => prev + message.serverContent.inputTranscription.text);
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Session error:', e);
            setStatus(`Error: ${e.message}. Please try again.`);
            stopRecording();
          },
          onclose: (e: CloseEvent) => {
            setStatus('Connection closed.');
            // Note: stopRecording is already called on error and here. 
            // If the component unmounts it will also be called.
          },
        },
        config: {
          // FIX: The responseModalities config is required and must contain Modality.AUDIO.
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
        },
      });

    } catch (error) {
      console.error('Failed to start recording:', error);
      setStatus('Could not start recording. Please ensure microphone access is allowed.');
      setIsRecording(false);
    }
  };

  const handleFinalize = () => {
    if (transcript.trim()) {
        setManuscript(prev => prev + '\n\n' + transcript.trim());
        setTranscript('');
        setStatus('Transcript added to manuscript. Ready for next dictation.');
    }
  };

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return (
    <div className="p-4 md:p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md h-full flex flex-col">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center"><Mic className="mr-2 text-blue-500" /> AI Voice Scribe</h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400 mb-6">Dictate your manuscript and let the AI transcribe it for you in real time.</p>

      <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
        {!isRecording ? (
          <button onClick={startRecording} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-all">
            <Mic /> Start Dictation
          </button>
        ) : (
          <button onClick={stopRecording} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all">
            <MicOff /> Stop Dictation
          </button>
        )}
        <div className="flex-grow text-center sm:text-left text-sm text-gray-600 dark:text-gray-400">{status}</div>
      </div>

      <div className="flex-grow flex flex-col border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
        <h3 className="font-semibold mb-2">Live Transcript:</h3>
        <div className="flex-grow overflow-y-auto p-2 rounded bg-white dark:bg-gray-800 min-h-[200px]">
          {transcript || <span className="text-gray-400">Your transcribed text will appear here...</span>}
        </div>
        <button 
          onClick={handleFinalize} 
          disabled={!transcript.trim()}
          className="mt-4 w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
          Add to Manuscript
        </button>
      </div>
    </div>
  );
};

export default VoiceScribe;
