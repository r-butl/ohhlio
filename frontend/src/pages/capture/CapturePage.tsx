import { useState, useRef } from 'react';
import { uploadAsset } from '@/services/assetService';
import { createNote } from '@/services/noteService';

type Mode = 'home' | 'note';
type Status = 'idle' | 'uploading' | 'success' | 'error';

export default function CapturePage() {
  const [mode, setMode] = useState<Mode>('home');
  const [noteText, setNoteText] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);

  const flash = (result: 'success' | 'error', msg = '') => {
    setErrorMsg(msg);
    setStatus(result);
    setTimeout(() => setStatus('idle'), 2000);
  };

  const handleImageFile = async (file: File) => {
    setStatus('uploading');
    try {
      await uploadAsset(file);
      flash('success');
    } catch {
      flash('error', 'Upload failed');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
    e.target.value = '';
  };

  const handleNoteSubmit = async () => {
    if (!noteText.trim()) return;
    setStatus('uploading');
    try {
      await createNote(noteText.trim());
      setNoteText('');
      setMode('home');
      flash('success');
    } catch {
      flash('error', 'Failed to save note');
    }
  };

  if (mode === 'note') {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col">
        <div className="flex items-center px-4 pt-12 pb-4">
          <button
            onClick={() => { setMode('home'); setNoteText(''); }}
            className="text-zinc-400 text-sm mr-4"
          >
            Cancel
          </button>
          <span className="text-white font-medium flex-1 text-center">New Note</span>
          <button
            onClick={handleNoteSubmit}
            disabled={!noteText.trim() || status === 'uploading'}
            className="text-white text-sm font-semibold disabled:text-zinc-600"
          >
            {status === 'uploading' ? 'Saving…' : 'Save'}
          </button>
        </div>
        <textarea
          autoFocus
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="What's on your mind?"
          className="flex-1 bg-transparent text-white text-lg px-6 py-4 resize-none outline-none placeholder:text-zinc-600"
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center gap-6 px-8">
      <h1 className="text-white text-2xl font-semibold tracking-tight mb-4">Capture</h1>

      {/* hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={libraryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        onClick={() => cameraInputRef.current?.click()}
        disabled={status === 'uploading'}
        className="w-full py-5 rounded-2xl bg-zinc-800 text-white text-lg font-medium active:scale-95 transition-transform disabled:opacity-50"
      >
        📷 Camera
      </button>

      <button
        onClick={() => libraryInputRef.current?.click()}
        disabled={status === 'uploading'}
        className="w-full py-5 rounded-2xl bg-zinc-800 text-white text-lg font-medium active:scale-95 transition-transform disabled:opacity-50"
      >
        🖼 Library
      </button>

      <button
        onClick={() => setMode('note')}
        disabled={status === 'uploading'}
        className="w-full py-5 rounded-2xl bg-zinc-800 text-white text-lg font-medium active:scale-95 transition-transform disabled:opacity-50"
      >
        📝 Note
      </button>

      {status === 'uploading' && (
        <p className="text-zinc-400 text-sm">Uploading…</p>
      )}
      {status === 'success' && (
        <p className="text-green-400 text-sm">Saved to bucket</p>
      )}
      {status === 'error' && (
        <p className="text-red-400 text-sm">{errorMsg}</p>
      )}
    </div>
  );
}
