import { useState, useEffect } from "react";
import { api } from "../utils/api";

export default function SmartNotes({ addToast }) {
  const [subjects, setSubjects] = useState([]);
  const [savedNotes, setSavedNotes] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(true);

  // Notes parameters
  const [selectedSubject, setSelectedSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [lectureNotes, setLectureNotes] = useState("");
  
  // Local settings for Gemini key
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("studyflow-gemini-key") || "");
  const [showKeyInput, setShowKeyInput] = useState(!localStorage.getItem("studyflow-gemini-key"));

  // State
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [currentViewNote, setCurrentViewNote] = useState(null);

  useEffect(() => {
    // Load subjects
    api.getSubjects()
      .then(setSubjects)
      .catch((err) => addToast(err.message || "Failed to load subjects", "error"))
      .finally(() => setLoadingSubjects(false));

    // Load saved notes
    loadSavedNotes();
  }, []);

  const loadSavedNotes = () => {
    setLoadingSaved(true);
    api.getNotes()
      .then(setSavedNotes)
      .catch((err) => addToast(err.message || "Failed to load saved notes", "error"))
      .finally(() => setLoadingSaved(false));
  };

  const saveApiKey = () => {
    localStorage.setItem("studyflow-gemini-key", apiKey.trim());
    addToast("Gemini API Key saved locally", "success");
    setShowKeyInput(false);
  };

  const clearApiKey = () => {
    localStorage.removeItem("studyflow-gemini-key");
    setApiKey("");
    setShowKeyInput(true);
    addToast("Gemini API Key removed", "info");
  };

  const handleGenerateNotes = async (e) => {
    e.preventDefault();
    if (!topic.trim()) {
      addToast("Please enter a topic", "warning");
      return;
    }

    setLoading(true);
    setGeneratedContent("");
    setCurrentViewNote(null);

    try {
      const data = await api.generateNotes({
        subject: selectedSubject || "General Study",
        topic,
        lectureNotes
      });
      if (data && data.content) {
        setGeneratedContent(data.content);
      } else {
        throw new Error("Invalid response received from Gemini");
      }
    } catch (err) {
      addToast(err.message || "Failed to generate notes. Check your API Key.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!generatedContent) return;
    try {
      const matchSubject = subjects.find(s => s.name === selectedSubject);
      await api.saveNotes({
        subjectId: matchSubject ? matchSubject.id : null,
        subjectName: selectedSubject || "General Study",
        topic,
        content: generatedContent
      });
      addToast("Study notes saved successfully to cloud database!", "success");
      loadSavedNotes();
    } catch (err) {
      addToast(err.message || "Failed to save notes", "error");
    }
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm("Are you sure you want to delete this study note?")) return;
    try {
      await api.deleteNote(id);
      addToast("Study note deleted", "info");
      if (currentViewNote && currentViewNote.id === id) {
        setCurrentViewNote(null);
      }
      loadSavedNotes();
    } catch (err) {
      addToast(err.message || "Failed to delete note", "error");
    }
  };

  // Safe client-side Markdown to HTML renderer helper
  const renderMarkdown = (md) => {
    if (!md) return "";
    let html = md
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Replace headings
    html = html.replace(/^### (.*$)/gim, '<h4 class="text-sm font-bold mt-4 mb-2 text-[var(--accent-primary)]">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 class="text-md font-bold mt-5 mb-2 text-[var(--accent-primary)]">$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2 class="text-lg font-extrabold mt-6 mb-3 text-[var(--accent-primary)]">$1</h2>');

    // Replace bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-[var(--text-primary)]">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

    // Replace bullet points
    html = html.replace(/^\s*-\s+(.*$)/gim, '<li class="ml-4 list-disc text-xs text-[var(--text-secondary)] leading-relaxed">$1</li>');
    html = html.replace(/^\s*\*\s+(.*$)/gim, '<li class="ml-4 list-disc text-xs text-[var(--text-secondary)] leading-relaxed">$1</li>');

    // Replace linebreaks
    html = html.split("\n").join("<br />");

    return { __html: html };
  };

  return (
    <div className="notes-page-container max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left Settings & Form Panel */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        {/* API Settings card */}
        <div className="card p-4">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-sm">Gemini Settings</h4>
            <button 
              type="button" 
              className="text-link text-xs font-semibold"
              onClick={() => setShowKeyInput(!showKeyInput)}
            >
              {showKeyInput ? "Hide" : "Edit"}
            </button>
          </div>
          {showKeyInput && (
            <div className="mt-3 flex flex-col gap-2">
              <input
                type="password"
                placeholder="Gemini API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full p-2 text-xs bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-md text-[var(--text-primary)] focus:outline-none"
              />
              <div className="flex gap-2">
                <button onClick={saveApiKey} className="innovative-submit-btn !m-0 !py-1 !px-3 !w-auto text-xs">
                  Save
                </button>
                {localStorage.getItem("studyflow-gemini-key") && (
                  <button onClick={clearApiKey} className="back-btn !m-0 !py-1 !px-3 !w-auto text-xs border border-[var(--border)] rounded-md">
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Generator Form */}
        <div className="card">
          <h3 className="section-title mb-4">🔮 Smart Notes Generator</h3>
          <form onSubmit={handleGenerateNotes} className="innovative-form">
            <div className="field-group">
              <label>Select Subject</label>
              <div className="input-wrapper">
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full p-[10px] bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-md text-[var(--text-primary)]"
                >
                  <option value="">General Study</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.name}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field-group">
              <label>Topic / Concept</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  required
                  placeholder="e.g. Photosynthesis vs Cellular Respiration"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full p-[10px] bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-md text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div className="field-group">
              <label>Raw Lecture Notes / Text (Optional)</label>
              <div className="input-wrapper">
                <textarea
                  placeholder="Paste lecture outlines, transcriptions, raw textbooks, or key sentences to summarize."
                  value={lectureNotes}
                  onChange={(e) => setLectureNotes(e.target.value)}
                  rows={6}
                  className="w-full p-[10px] bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-md text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] text-xs leading-relaxed"
                />
              </div>
            </div>

            <button type="submit" className="innovative-submit-btn">
              Generate Study Notes
            </button>
          </form>
        </div>

        {/* Saved Notes History List */}
        <div className="card flex-1 min-h-[300px]">
          <h3 className="section-title mb-4">Saved Library ({savedNotes.length})</h3>
          {loadingSaved ? (
            <div className="flex flex-col gap-2">
              <div className="skeleton h-8"></div>
              <div className="skeleton h-8"></div>
              <div className="skeleton h-8"></div>
            </div>
          ) : savedNotes.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)] text-center py-8">No saved notes found. Generate notes and save them to build your cloud library!</p>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[350px]">
              {savedNotes.map((note) => (
                <div 
                  key={note.id}
                  className={`p-3 border rounded-xl flex justify-between items-center gap-3 transition cursor-pointer ${
                    currentViewNote?.id === note.id 
                      ? "bg-[rgba(99,102,241,0.08)] border-[var(--accent-primary)]"
                      : "bg-[rgba(255,255,255,0.02)] border-[var(--border)] hover:bg-[rgba(255,255,255,0.04)]"
                  }`}
                  onClick={() => {
                    setCurrentViewNote(note);
                    setGeneratedContent("");
                  }}
                >
                  <div className="min-w-0">
                    <span className="text-[10px] text-[var(--accent-primary)] font-semibold tracking-wider block uppercase">{note.subject_name || "General"}</span>
                    <h4 className="font-bold text-xs truncate text-[var(--text-primary)]">{note.topic}</h4>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                    className="p-1 hover:text-[var(--accent-rose)] text-[var(--text-muted)] transition"
                    title="Delete Note"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Generated Content Panel */}
      <div className="lg:col-span-2 flex flex-col min-h-[500px]">
        {loading ? (
          <div className="card flex-1 flex flex-col gap-4 items-center justify-center text-center p-8">
            <div className="loading-spinner !w-10 !height-10" />
            <h3 className="font-bold text-lg">Gemini AI is digesting your study materials...</h3>
            <p className="text-sm text-[var(--text-secondary)] max-w-md">Building key outlines, structured summaries, and active-recall test questions.</p>
            <div className="w-full mt-6 flex flex-col gap-3">
              <div className="skeleton h-6 w-1/3"></div>
              <div className="skeleton h-24 w-full"></div>
              <div className="skeleton h-6 w-1/4"></div>
              <div className="skeleton h-32 w-full"></div>
            </div>
          </div>
        ) : generatedContent ? (
          <div className="card flex-1 flex flex-col">
            <div className="flex justify-between items-center border-b border-[var(--border)] pb-4 mb-4 flex-wrap gap-2">
              <div>
                <span className="text-xs text-[var(--accent-primary)] font-bold tracking-wider block uppercase">GENERATED NOTE</span>
                <h3 className="text-xl font-bold">{topic}</h3>
              </div>
              <button 
                onClick={handleSaveNotes}
                className="innovative-submit-btn !m-0 !w-auto px-6"
              >
                💾 Save to Library
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[600px] pr-2 text-xs text-[var(--text-secondary)] leading-relaxed space-y-3" dangerouslySetInnerHTML={renderMarkdown(generatedContent)} />
          </div>
        ) : currentViewNote ? (
          <div className="card flex-1 flex flex-col">
            <div className="flex justify-between items-center border-b border-[var(--border)] pb-4 mb-4 flex-wrap gap-2">
              <div>
                <span className="text-xs text-[var(--accent-primary)] font-bold tracking-wider block uppercase">{currentViewNote.subject_name || "General Study"}</span>
                <h3 className="text-xl font-bold">{currentViewNote.topic}</h3>
              </div>
              <button 
                onClick={() => handleDeleteNote(currentViewNote.id)}
                className="back-btn !m-0 border border-[var(--accent-rose)] text-[var(--accent-rose)] hover:bg-[rgba(244,63,94,0.06)] rounded-md px-4 py-2"
              >
                Delete Note
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[600px] pr-2 text-xs text-[var(--text-secondary)] leading-relaxed space-y-3" dangerouslySetInnerHTML={renderMarkdown(currentViewNote.content)} />
          </div>
        ) : (
          <div className="card flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="text-5xl mb-4">📓</div>
            <h3 className="font-bold text-lg mb-2">No active study notes selected</h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm">Use the form on the left to generate new notes or select a previously saved study note from the Library list.</p>
          </div>
        )}
      </div>

    </div>
  );
}