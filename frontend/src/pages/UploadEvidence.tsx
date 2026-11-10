import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { UploadCloud, ArrowLeft, Check, FileVideo, Shield, Cpu } from 'lucide-react';
import { api } from '../services/api';
import { Case } from '../types';
import { useNotification } from '../contexts/NotificationContext';

export const UploadEvidence: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCaseId = searchParams.get('case_id') || '';
  const { notify } = useNotification();

  const [cases, setCases] = useState<Case[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [caseId, setCaseId] = useState(preselectedCaseId);
  const [sourceDevice, setSourceDevice] = useState('CAM-04-NORTH-GATE');
  const [sourceVendor, setSourceVendor] = useState('Hikvision DVR-9000');
  const [recordingStart, setRecordingStart] = useState('');
  const [recordingEnd, setRecordingEnd] = useState('');
  const [acquisitionNotes, setAcquisitionNotes] = useState('');
  const [autoProcess, setAutoProcess] = useState(true);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    api.listCases().then(setCases).catch(console.error);
  }, []);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    const allowed = ['.mp4', '.avi', '.mov', '.mkv', '.webm'];
    if (!allowed.includes(ext)) {
      notify('error', 'Unsupported Extension', `Supported formats: ${allowed.join(', ')}`);
      return;
    }
    if (selectedFile.size > 500 * 1024 * 1024) {
      notify('error', 'File Size Limit', 'Video size exceeds 500 MB maximum threshold');
      return;
    }
    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      notify('error', 'File Missing', 'Please select or drag a video file to ingest');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    if (caseId) formData.append('case_id', caseId);
    formData.append('source_device', sourceDevice);
    formData.append('source_vendor', sourceVendor);
    if (recordingStart) formData.append('recording_start', recordingStart);
    if (recordingEnd) formData.append('recording_end', recordingEnd);
    if (acquisitionNotes) formData.append('acquisition_notes', acquisitionNotes);
    formData.append('auto_process', autoProcess ? 'true' : 'false');

    try {
      const res = await api.uploadEvidence(formData, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });

      notify(
        'success',
        'Evidence Ingestion Successful',
        `File ${res.original_filename} ingested with reference SHA-256: ${res.sha256_hash.substring(0, 16)}...`
      );
      navigate(`/evidence/${res.id}`);
    } catch (err: any) {
      notify('error', 'Ingestion Failed', err.response?.data?.detail || 'An error occurred during evidence upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          to="/evidence"
          className="inline-flex items-center gap-2 text-sm text-[#796C60] hover:text-[#443126] transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Evidence Repository
        </Link>
      </div>

      <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-7 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3.5 pb-6 border-b border-[#E8DED0]">
          <div className="w-12 h-12 rounded-xl bg-[#EFE5D8] border border-[#D9CBBB] flex items-center justify-center text-[#604735] shadow-2xs">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#342A23]">Ingest Video Evidence</h1>
            <p className="text-sm text-[#796C60] mt-0.5">
              Streams media file, calculates bitwise SHA-256 hash, and logs initial chain of custody
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Drag & Drop File Zone */}
          <div>
            <label className="block text-sm font-semibold text-[#443126] mb-2 uppercase tracking-wider font-mono">
              Target Surveillance Video Media *
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleFileDrop}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all cursor-pointer relative ${
                dragActive
                  ? 'border-[#604735] bg-[#EFE5D8]'
                  : file
                  ? 'border-[#47765B] bg-[#EAF2EC]'
                  : 'border-[#D9CBBB] hover:border-[#8B684D] bg-[#F5F0E8]/50'
              }`}
            >
              <input
                type="file"
                accept=".mp4,.avi,.mov,.mkv,.webm"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />

              {file ? (
                <div className="flex flex-col items-center">
                  <FileVideo className="w-12 h-12 text-[#47765B] mb-2" />
                  <span className="text-base font-bold text-[#342A23]">{file.name}</span>
                  <span className="text-sm font-mono text-[#47765B] mt-1 font-semibold">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || 'video media'}
                  </span>
                  <span className="text-xs text-[#796C60] mt-2 underline">Click or drop different file to replace</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <UploadCloud className="w-12 h-12 text-[#8B684D] mb-2" />
                  <span className="text-base font-semibold text-[#342A23]">
                    Drag and drop CCTV video file, or <span className="text-[#604735] underline font-bold">browse</span>
                  </span>
                  <span className="text-xs text-[#796C60] mt-1.5 font-mono">
                    Supported formats: MP4, AVI, MOV, MKV, WEBM (Max: 500 MB)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="p-4 bg-[#EFE5D8] border border-[#D9CBBB] rounded-xl space-y-2">
              <div className="flex justify-between text-xs font-mono text-[#342A23]">
                <span className="text-[#443126] font-bold">STREAMING & HASHING INGESTION...</span>
                <span className="font-bold">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2.5 bg-[#D9CBBB] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#604735] transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Metadata Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#443126] mb-2 uppercase tracking-wider font-mono">
                Associate Investigation Case
              </label>
              <select
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                className="w-full form-input"
              >
                <option value="">-- Unassigned Evidence --</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} — {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#443126] mb-2 uppercase tracking-wider font-mono">
                Source Device / Camera Identifier *
              </label>
              <input
                type="text"
                required
                value={sourceDevice}
                onChange={(e) => setSourceDevice(e.target.value)}
                placeholder="e.g. CAM-04-NORTH-GATE"
                className="w-full form-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#443126] mb-2 uppercase tracking-wider font-mono">
                Source DVR/NVR Vendor
              </label>
              <input
                type="text"
                value={sourceVendor}
                onChange={(e) => setSourceVendor(e.target.value)}
                placeholder="e.g. Hikvision DVR-9000"
                className="w-full form-input"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#443126] mb-2 uppercase tracking-wider font-mono">
                Est. Recording Start
              </label>
              <input
                type="datetime-local"
                value={recordingStart}
                onChange={(e) => setRecordingStart(e.target.value)}
                className="w-full form-input"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#443126] mb-2 uppercase tracking-wider font-mono">
                Est. Recording End
              </label>
              <input
                type="datetime-local"
                value={recordingEnd}
                onChange={(e) => setRecordingEnd(e.target.value)}
                className="w-full form-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#443126] mb-2 uppercase tracking-wider font-mono">
              Acquisition Chain Notes
            </label>
            <textarea
              rows={2}
              value={acquisitionNotes}
              onChange={(e) => setAcquisitionNotes(e.target.value)}
              placeholder="e.g. Requisitioned by Sub-Inspector from on-site DVR USB export. Physical custody sealed in tamper bag."
              className="w-full form-input resize-y"
            />
          </div>

          {/* Auto-Process Option */}
          <div className="p-4 bg-[#EFE5D8] border border-[#D9CBBB] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Cpu className="w-5 h-5 text-[#604735]" />
              <div>
                <span className="text-sm font-bold text-[#342A23]">Automated Pipeline & Candidate Detection</span>
                <p className="text-xs text-[#796C60]">
                  Immediately extract OpenCV metadata, sample representative keyframes, and flag motion candidates.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoProcess}
              onChange={(e) => setAutoProcess(e.target.checked)}
              className="w-5 h-5 accent-[#604735] cursor-pointer"
            />
          </div>

          {/* Forensic Disclaimer Box */}
          <div className="p-4 bg-[#EFE5D8]/70 border border-[#D9CBBB] text-xs text-[#534335] rounded-xl flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#604735] shrink-0 mt-0.5" />
            <span>
              <strong>FORENSIC INGESTION STANDARD:</strong> TRACE X calculates bitwise SHA-256 hashes immediately upon file reception.
              Files are written directly into restricted forensic storage using safe UUID keys to prevent file path traversal.
            </span>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E8DED0]">
            <Link
              to="/evidence"
              className="btn-secondary"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={uploading || !file}
              className="btn-primary"
            >
              <Check className="w-4 h-4" />
              <span>{uploading ? `Ingesting (${uploadProgress}%)...` : 'Confirm & Ingest Evidence'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
