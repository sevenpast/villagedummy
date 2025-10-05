// ============================================
// FEATURE 1: PDF UPLOAD & ANALYSIS
// ============================================

// features/pdf-upload/types/pdf.ts
export interface PDFDocument {
  id: string;
  user_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  document_type?: 'passport' | 'employment_contract' | 'rental_agreement' | 'school_form' | 'other';
  task_id?: number;
  uploaded_at: string;
  analyzed: boolean;
  analysis_result?: PDFAnalysisResult;
}

export interface PDFAnalysisResult {
  is_fillable: boolean;
  detected_fields: PDFField[];
  detected_language: 'de' | 'fr' | 'it' | 'en';
  form_type?: string;
  municipality?: string;
  confidence_score: number;
}

export interface PDFField {
  field_name: string;
  field_type: 'text' | 'checkbox' | 'date' | 'signature';
  field_label?: string;
  field_value?: string;
  auto_fillable: boolean;
  confidence: number;
  position?: { x: number; y: number; width: number; height: number };
}

// features/pdf-upload/components/PDFUploader.tsx
import React, { useState } from 'react';
import { usePDFUpload } from '../hooks/usePDFUpload';

interface PDFUploaderProps {
  taskId?: number;
  documentType?: string;
  onUploadComplete?: (document: PDFDocument) => void;
}

export const PDFUploader: React.FC<PDFUploaderProps> = ({
  taskId,
  documentType,
  onUploadComplete
}) => {
  const { uploadPDF, analyzing, progress } = usePDFUpload();
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      const result = await uploadPDF(file, taskId, documentType);
      if (result && onUploadComplete) {
        onUploadComplete(result);
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const result = await uploadPDF(file, taskId, documentType);
      if (result && onUploadComplete) {
        onUploadComplete(result);
      }
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
          ${analyzing ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-blue-400'}
        `}
      >
        {analyzing ? (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Analyzing PDF... {progress}%</p>
          </div>
        ) : (
          <>
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drop your PDF here or click to upload
            </p>
            <p className="text-sm text-gray-500">
              We'll analyze the form and help you fill it out
            </p>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="pdf-upload"
            />
            <label
              htmlFor="pdf-upload"
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
            >
              Choose PDF
            </label>
          </>
        )}
      </div>
    </div>
  );
};

// features/pdf-upload/components/PDFAnalyzer.tsx
interface PDFAnalyzerProps {
  document: PDFDocument;
  onFieldsFilled?: (filledData: Record<string, any>) => void;
}

export const PDFAnalyzer: React.FC<PDFAnalyzerProps> = ({ document, onFieldsFilled }) => {
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [autoFillProgress, setAutoFillProgress] = useState<number>(0);

  const handleAutoFill = async () => {
    // Call API to auto-fill fields based on user profile
    const response = await fetch('/api/pdf/auto-fill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: document.id })
    });
    
    const { filledFields } = await response.json();
    setFieldValues(filledFields);
    if (onFieldsFilled) onFieldsFilled(filledFields);
  };

  if (!document.analysis_result) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">PDF analysis in progress...</p>
      </div>
    );
  }

  const { is_fillable, detected_fields, detected_language } = document.analysis_result;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">📄 PDF Analysis Results</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm text-gray-600">Form Type</p>
          <p className="font-medium">{is_fillable ? 'Fillable Form' : 'Flat PDF'}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm text-gray-600">Language</p>
          <p className="font-medium">{detected_language.toUpperCase()}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm text-gray-600">Detected Fields</p>
          <p className="font-medium">{detected_fields.length} fields</p>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm text-gray-600">Auto-Fill Ready</p>
          <p className="font-medium">
            {detected_fields.filter(f => f.auto_fillable).length} / {detected_fields.length}
          </p>
        </div>
      </div>

      {is_fillable ? (
        <div>
          <button
            onClick={handleAutoFill}
            className="w-full mb-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            🤖 Auto-fill with my profile data
          </button>
          
          <div className="space-y-3">
            {detected_fields.map((field, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    {field.field_label || field.field_name}
                  </label>
                  {field.auto_fillable && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Auto-fillable
                    </span>
                  )}
                </div>
                
                {field.field_type === 'text' || field.field_type === 'date' ? (
                  <input
                    type={field.field_type === 'date' ? 'date' : 'text'}
                    value={fieldValues[field.field_name] || ''}
                    onChange={(e) => setFieldValues({ ...fieldValues, [field.field_name]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Original: ${field.field_label}`}
                  />
                ) : field.field_type === 'checkbox' ? (
                  <input
                    type="checkbox"
                    checked={fieldValues[field.field_name] === 'true'}
                    onChange={(e) => setFieldValues({ ...fieldValues, [field.field_name]: e.target.checked.toString() })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              💾 Save Progress
            </button>
            <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              📥 Download Filled PDF
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 mb-3">
            This is a non-fillable PDF. We can help you understand what information is needed:
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            🔍 Show Required Information Checklist
          </button>
        </div>
      )}
    </div>
  );
};

// features/pdf-upload/services/pdf-service.ts
export class PDFService {
  async uploadAndAnalyze(
    file: File,
    userId: string,
    taskId?: number,
    documentType?: string
  ): Promise<PDFDocument> {
    // Upload to Supabase Storage
    const fileName = `${userId}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Analyze PDF with AI
    const analysisResult = await this.analyzePDF(file, userId);

    // Save to database
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: fileName,
        document_type: documentType,
        task_id: taskId,
        analyzed: true,
        analysis_result: analysisResult
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return document;
  }

  private async analyzePDF(file: File, userId: string): Promise<PDFAnalysisResult> {
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('userId', userId);

    const response = await fetch('/api/pdf/analyze', {
      method: 'POST',
      body: formData
    });

    return await response.json();
  }

  async autoFillPDF(documentId: string, userId: string): Promise<Record<string, string>> {
    const response = await fetch('/api/pdf/auto-fill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId, userId })
    });

    const { filledFields } = await response.json();
    return filledFields;
  }
}

// features/pdf-upload/hooks/usePDFUpload.ts
import { useState } from 'react';
import { PDFService } from '../services/pdf-service';

export function usePDFUpload() {
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const pdfService = new PDFService();

  const uploadPDF = async (
    file: File,
    taskId?: number,
    documentType?: string
  ): Promise<PDFDocument | null> => {
    setAnalyzing(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 10, 90));
      }, 200);

      const document = await pdfService.uploadAndAnalyze(
        file,
        'current-user-id', // Get from auth context
        taskId,
        documentType
      );

      clearInterval(progressInterval);
      setProgress(100);
      
      return document;
    } catch (error) {
      console.error('Upload failed:', error);
      return null;
    } finally {
      setAnalyzing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return { uploadPDF, analyzing, progress };
}

// ============================================
// FEATURE 2: EMAIL AUTOMATION
// ============================================

// features/email-automation/types/email.ts
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  language: 'de' | 'fr' | 'it' | 'en';
  category: 'municipality' | 'school' | 'employer' | 'landlord' | 'general';
  variables: string[]; // e.g., ['municipality_name', 'user_name']
}

export interface GeneratedEmail {
  subject: string;
  body: string;
  recipient: string;
  cc?: string;
  attachments?: string[];
  language: 'de' | 'fr' | 'it' | 'en';
}

// features/email-automation/components/EmailComposer.tsx
interface EmailComposerProps {
  taskId?: number;
  category: 'municipality' | 'school' | 'employer' | 'landlord' | 'general';
  recipientEmail?: string;
  onSend?: (email: GeneratedEmail) => void;
}

export const EmailComposer: React.FC<EmailComposerProps> = ({
  taskId,
  category,
  recipientEmail,
  onSend
}) => {
  const [generating, setGenerating] = useState(false);
  const [email, setEmail] = useState<GeneratedEmail | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    
    try {
      const response = await fetch('/api/email/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, category, recipientEmail })
      });
      
      const generatedEmail = await response.json();
      setEmail(generatedEmail);
      setShowPreview(true);
    } catch (error) {
      console.error('Email generation failed:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = () => {
    if (email && onSend) {
      onSend(email);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">📧 Email Generator</h3>

      {!showPreview ? (
        <div>
          <p className="text-gray-600 mb-4">
            We'll generate a professional email in the local language for you.
          </p>
          
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Generating...
              </span>
            ) : (
              '✨ Generate Email'
            )}
          </button>
        </div>
      ) : email ? (
        <EmailPreview
          email={email}
          onEdit={(updated) => setEmail(updated)}
          onSend={handleSend}
          onCancel={() => setShowPreview(false)}
        />
      ) : null}
    </div>
  );
};

// features/email-automation/components/EmailPreview.tsx
interface EmailPreviewProps {
  email: GeneratedEmail;
  onEdit: (email: GeneratedEmail) => void;
  onSend: () => void;
  onCancel: () => void;
}

export const EmailPreview: React.FC<EmailPreviewProps> = ({
  email,
  onEdit,
  onSend,
  onCancel
}) => {
  const [editing, setEditing] = useState(false);
  const [localEmail, setLocalEmail] = useState(email);

  return (
    <div>
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          📝 <strong>Language:</strong> {email.language.toUpperCase()} | 
          This email is ready to send. You can edit it if needed.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To:</label>
          <input
            type="email"
            value={localEmail.recipient}
            onChange={(e) => setLocalEmail({ ...localEmail, recipient: e.target.value })}
            disabled={!editing}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject:</label>
          <input
            type="text"
            value={localEmail.subject}
            onChange={(e) => setLocalEmail({ ...localEmail, subject: e.target.value })}
            disabled={!editing}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message:</label>
          <textarea
            value={localEmail.body}
            onChange={(e) => setLocalEmail({ ...localEmail, body: e.target.value })}
            disabled={!editing}
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 font-mono text-sm"
          />
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        {editing ? (
          <>
            <button
              onClick={() => {
                onEdit(localEmail);
                setEditing(false);
              }}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ✓ Save Changes
            </button>
            <button
              onClick={() => {
                setLocalEmail(email);
                setEditing(false);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ✏️ Edit
            </button>
            <button
              onClick={onSend}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              📤 Send Email
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ← Back
            </button>
          </>
        )}
      </div>

      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-xs text-gray-600">
          💡 Tip: The email will be sent with a CC to your email address for your records.
        </p>
      </div>
    </div>
  );
};

// features/email-automation/services/email-service.ts
export class EmailService {
  async generateEmail(
    taskId: number,
    category: string,
    recipientEmail?: string,
    userId?: string
  ): Promise<GeneratedEmail> {
    const response = await fetch('/api/email/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, category, recipientEmail, userId })
    });

    return await response.json();
  }

  async sendEmail(email: GeneratedEmail, userId: string): Promise<boolean> {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...email, userId })
    });

    const { success } = await response.json();
    return success;
  }
}

// ============================================
// FEATURE 3: DOCUMENT MANAGER
// ============================================

// features/document-manager/components/DocumentList.tsx
interface DocumentListProps {
  userId: string;
  taskId?: number;
  onDocumentSelect?: (document: PDFDocument) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  userId,
  taskId,
  onDocumentSelect
}) => {
  const [documents, setDocuments] = useState<PDFDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadDocuments();
  }, [userId, taskId, filter]);

  const loadDocuments = async () => {
    setLoading(true);
    
    let query = supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false });

    if (taskId) {
      query = query.eq('task_id', taskId);
    }

    if (filter !== 'all') {
      query = query.eq('document_type', filter);
    }

    const { data, error } = await query;
    
    if (!error && data) {
      setDocuments(data);
    }
    
    setLoading(false);
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    await supabase.from('documents').delete().eq('id', documentId);
    loadDocuments();
  };

  const getDocumentIcon = (type?: string) => {
    switch (type) {
      case 'passport': return '🛂';
      case 'employment_contract': return '📄';
      case 'rental_agreement': return '🏠';
      case 'school_form': return '🎓';
      default: return '📎';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">📁 My Documents</h3>
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Documents</option>
          <option value="passport">Passports</option>
          <option value="employment_contract">Employment</option>
          <option value="rental_agreement">Housing</option>
          <option value="school_form">School</option>
          <option value="other">Other</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No documents uploaded yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => onDocumentSelect && onDocumentSelect(doc)}
            >
              <div className="flex items-center space-x-3 flex-1">
                <span className="text-2xl">{getDocumentIcon(doc.document_type)}</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{doc.file_name}</p>
                  <p className="text-sm text-gray-500">
                    {(doc.file_size / 1024).toFixed(1)} KB • 
                    Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {doc.analyzed && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    ✓ Analyzed
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`/api/documents/${doc.id}/download`, '_blank');
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                >
                  ⬇️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(doc.id);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// FEATURE 4: REMINDER SYSTEM
// ============================================

// features/reminder/types/reminder.ts
export interface Reminder {
  id: string;
  user_id: string;
  task_id: number;
  reminder_date: string;
  reminder_type: 'email' | 'sms' | 'push';
  status: 'pending' | 'sent' | 'failed';
  sent_at?: string;
  created_at: string;
}

// features/reminder/components/ReminderSetter.tsx
interface ReminderSetterProps {
  taskId: number;
  taskTitle: string;
  onReminderSet?: (reminder: Reminder) => void;
}

export const ReminderSetter: React.FC<ReminderSetterProps> = ({
  taskId,
  taskTitle,
  onReminderSet
}) => {
  const [selectedDays, setSelectedDays] = useState<number>(7);
  const [customDate, setCustomDate] = useState<string>('');
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [setting, setSetting] = useState(false);

  const dayOptions = [1, 2, 3, 7, 14, 30];

  const handleSetReminder = async () => {
    setSetting(true);

    const reminderDate = useCustomDate 
      ? new Date(customDate)
      : new Date(Date.now() + selectedDays * 24 * 60 * 60 * 1000);

    try {
      const response = await fetch('/api/reminders/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          reminderDate: reminderDate.toISOString(),
          reminderType: 'email'
        })
      });

      const reminder = await response.json();
      if (onReminderSet) onReminderSet(reminder);
    } catch (error) {
      console.error('Failed to set reminder:', error);
    } finally {
      setSetting(false);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h4 className="font-semibold text-yellow-900 mb-3">⏰ Set a Reminder</h4>
      <p className="text-sm text-yellow-800 mb-4">
        We'll send you an email reminder for: <strong>{taskTitle}</strong>
      </p>

      <div className="mb-4">
        <div className="flex items-center mb-3">
          <input
            type="radio"
            id="quick-reminder"
            checked={!useCustomDate}
            onChange={() => setUseCustomDate(false)}
            className="mr-2"
          />
          <label htmlFor="quick-reminder" className="text-sm font-medium">
            Quick reminder in:
          </label>
        </div>

        {!useCustomDate && (
          <div className="flex flex-wrap gap-2 ml-6 mb-3">
            {dayOptions.map((days) => (
              <button
                key={days}
                onClick={() => setSelectedDays(days)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedDays === days
                    ? 'bg-yellow-500 text-white'
                    : 'bg-white border border-yellow-300 text-yellow-800 hover:bg-yellow-100'
                }`}
              >
                {days} {days === 1 ? 'day' : 'days'}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center mb-3">
          <input
            type="radio"
            id="custom-reminder"
            checked={useCustomDate}
            onChange={() => setUseCustomDate(true)}
            className="mr-2"
          />
          <label htmlFor="custom-reminder" className="text-sm font-medium">
            Custom date:
          </label>
        </div>

        {useCustomDate && (
          <input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="ml-6 px-3 py-2 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        )}
      </div>

      <button
        onClick={handleSetReminder}
        disabled={setting || (useCustomDate && !customDate)}
        className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {setting ? 'Setting reminder...' : '✓ Set Reminder'}
      </button>

      <p className="text-xs text-yellow-700 mt-3">
        💡 You can cancel or change the reminder anytime in your settings.
      </p>
    </div>
  );
};

// features/reminder/components/ReminderList.tsx
interface ReminderListProps {
  userId: string;
}

export const ReminderList: React.FC<ReminderListProps> = ({ userId }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReminders();
  }, [userId]);

  const loadReminders = async () => {
    const { data, error } = await supabase
      .from('reminders')
      .select('*, tasks(title)')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('reminder_date', { ascending: true });

    if (!error && data) {
      setReminders(data);
    }
    setLoading(false);
  };

  const handleCancel = async (reminderId: string) => {
    await supabase
      .from('reminders')
      .update({ status: 'cancelled' })
      .eq('id', reminderId);

    loadReminders();
  };

  if (loading) {
    return <div className="text-center py-4">Loading reminders...</div>;
  }

  if (reminders.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-600">No active reminders</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">⏰ Active Reminders</h3>
      <div className="space-y-3">
        {reminders.map((reminder) => (
          <div
            key={reminder.id}
            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
          >
            <div className="flex-1">
              <p className="font-medium">{reminder.tasks?.title}</p>
              <p className="text-sm text-gray-500">
                {new Date(reminder.reminder_date).toLocaleDateString()} at{' '}
                {new Date(reminder.reminder_date).toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => handleCancel(reminder.id)}
              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
            >
              Cancel
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// features/reminder/services/reminder-service.ts
export class ReminderService {
  async setReminder(
    userId: string,
    taskId: number,
    reminderDate: Date,
    reminderType: 'email' | 'sms' | 'push' = 'email'
  ): Promise<Reminder> {
    const { data, error } = await supabase
      .from('reminders')
      .insert({
        user_id: userId,
        task_id: taskId,
        reminder_date: reminderDate.toISOString(),
        reminder_type: reminderType,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async cancelReminder(reminderId: string): Promise<void> {
    const { error } = await supabase
      .from('reminders')
      .update({ status: 'cancelled' })
      .eq('id', reminderId);

    if (error) throw error;
  }

  async getPendingReminders(userId: string): Promise<Reminder[]> {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .lte('reminder_date', new Date().toISOString());

    if (error) throw error;
    return data || [];
  }
}

// ============================================
// USAGE EXAMPLE IN DASHBOARD
// ============================================

/*
// app/(dashboard)/dashboard/page.tsx

import { PDFUploader, PDFAnalyzer } from '@/features/pdf-upload/components';
import { EmailComposer } from '@/features/email-automation/components';
import { DocumentList } from '@/features/document-manager/components';
import { ReminderSetter, ReminderList } from '@/features/reminder/components';

export default function DashboardPage() {
  const [selectedDocument, setSelectedDocument] = useState<PDFDocument | null>(null);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Welcome to Village</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PDF Upload *\/}
        <div>
          <PDFUploader
            taskId={3}
            documentType="school_form"
            onUploadComplete={(doc) => setSelectedDocument(doc)}
          />
          
          {selectedDocument && (
            <div className="mt-6">
              <PDFAnalyzer document={selectedDocument} />
            </div>
          )}
        </div>

        {/* Email Generator *\/}
        <div>
          <EmailComposer
            category="municipality"
            recipientEmail="info@zuerich.ch"
            onSend={(email) => console.log('Sending email:', email)}
          />
        </div>

        {/* Document Manager *\/}
        <div>
          <DocumentList
            userId="user-123"
            onDocumentSelect={(doc) => setSelectedDocument(doc)}
          />
        </div>

        {/* Reminders *\/}
        <div>
          <ReminderSetter
            taskId={3}
            taskTitle="Register at Gemeinde"
            onReminderSet={(reminder) => console.log('Reminder set:', reminder)}
          />
          
          <div className="mt-6">
            <ReminderList userId="user-123" />
          </div>
        </div>
      </div>
    </div>
  );
}
*/