import React from 'react';
import ChatWidget from './ChatWidget';

export default function App() {
  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <header className="h-[64px] shrink-0 border-b flex items-center justify-between px-8" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h1 className="text-[20px] font-normal tracking-[1px] m-0" style={{ fontFamily: 'var(--f-serif)' }}>
            VOX <span style={{ opacity: 0.5 }}>INTELLIGENCE</span>
          </h1>
        </div>
        <div className="flex items-center text-[10px] uppercase tracking-[2px]" style={{ color: 'var(--accent)' }}>
          <div className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: 'var(--accent)' }}></div>
          System Active
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side (Sidebar) */}
        <aside className="w-full lg:w-[320px] shrink-0 p-6 flex flex-col gap-6 border-b lg:border-b-0 lg:border-r overflow-y-auto" style={{ borderColor: 'var(--border)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <div>
            <div className="text-[11px] uppercase font-semibold tracking-[1.5px] mb-3" style={{ color: 'var(--text-dim)' }}>
              Integration Config
            </div>
            <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
              <div style={{ fontSize: '12px', marginBottom: '10px' }}>HuggingFace API Token</div>
              <div style={{ height: '32px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: '4px', display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '12px', color: 'var(--text-dim)' }}>
                •••••••••••••••••••••
              </div>
            </div>
          </div>

          <div>
            <div className="text-[11px] uppercase font-semibold tracking-[1.5px] mb-3" style={{ color: 'var(--text-dim)' }}>
              Embed Snippet
            </div>
            <div className="font-mono text-[11px] bg-black p-3 rounded overflow-x-auto text-[#88b0d0]">
import {'{'} InferenceClient {'}'} from "@huggingface/inference";<br/><br/>
const vox = new InferenceClient(HF_TOKEN);
            </div>
          </div>
          
          <div>
            <div className="text-[11px] uppercase font-semibold tracking-[1.5px] mb-3" style={{ color: 'var(--text-dim)' }}>
              Voice Model
            </div>
            <div className="text-[13px] mt-2">ResembleAI / Chatterbox-Turbo</div>
            <div className="text-[11px] mt-1" style={{ color: 'var(--text-dim)' }}>Latency: ~120ms (Edge)</div>
          </div>
        </aside>

        {/* Right Side (Chat Area) */}
        <main className="flex-1 flex flex-col relative overflow-hidden" style={{ background: 'radial-gradient(circle at center, #111 0%, #050505 100%)' }}>
          <ChatWidget />
        </main>
      </div>
    </div>
  );
}
