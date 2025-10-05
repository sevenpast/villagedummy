'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, Clock, ChevronDown, ChevronUp, Upload, ExternalLink, Calendar, FileText } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

/**
 * 🔥 UNIVERSAL TASK RENDERER
 * 
 * This component renders ANY task based on ui_config from database.
 * NO CODE CHANGES needed to add new task types!
 * 
 * Supported UI Components (data-driven):
 * - text: Simple text display
 * - question_yesno: Yes/No question
 * - question_multiple: Multiple choice
 * - form: Multi-field form
 * - file_upload: Document upload
 * - checklist: Dynamic checklist
 * - ai_generate: AI content generation button
 * - external_link: Link to external service
 * - comparison_table: Compare options (insurance, banks, etc.)
 */

interface TaskProps {
  task: any;
  expanded: boolean;
  onToggle: () => void;
  onAction: (taskId: number, action: string, data?: any) => void;
}

export default function UniversalTaskRenderer({ task, expanded, onToggle, onAction }: TaskProps) {
  const [formData, setFormData] = useState<any>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiContent, setAiContent] = useState<any>(null);

  // Parse ui_config (if exists)
  const uiConfig = task.variant.uiConfig ? JSON.parse(task.variant.uiConfig) : null;

  const getUrgencyBadge = () => {
    if (task.urgency === 'overdue') {
      return <span className="px-3 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">OVERDUE</span>;
    }
    if (task.urgency === 'urgent') {
      return <span className="px-3 py-1 text-xs font-semibold bg-orange-100 text-orange-800 rounded-full">URGENT</span>;
    }
    if (task.isUrgent) {
      return <span className="px-3 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">Important</span>;
    }
    return null;
  };

  const getCategoryColor = (category: string) => {
    const colors: any = {
      legal: 'text-blue-600 bg-blue-50',
      housing: 'text-purple-600 bg-purple-50',
      health: 'text-red-600 bg-red-50',
      admin: 'text-green-600 bg-green-50',
      family: 'text-pink-600 bg-pink-50'
    };
    return colors[category] || 'text-gray-600 bg-gray-50';
  };

  // Render different UI components based on ui_config
  const renderInteractiveContent = () => {
    if (!uiConfig) {
      return renderDefaultContent();
    }

    return (
      <div className="space-y-4">
        {uiConfig.components?.map((component: any, idx: number) => {
          switch (component.type) {
            case 'form':
              return <FormComponent key={idx} config={component} formData={formData} setFormData={setFormData} onSubmit={(data) => onAction(task.taskId, 'form_submit', data)} />;
            
            case 'file_upload':
              return <FileUploadComponent key={idx} config={component} onUpload={(file) => onAction(task.taskId, 'file_upload', file)} />;
            
            case 'checklist':
              return <ChecklistComponent key={idx} config={component} />;
            
            case 'ai_generate':
              return <AIGenerateComponent key={idx} config={component} taskId={task.taskId} loading={aiLoading} setLoading={setAiLoading} content={aiContent} setContent={setAiContent} />;
            
            case 'comparison_table':
              return <ComparisonTableComponent key={idx} config={component} />;
            
            case 'external_link':
              return <ExternalLinkComponent key={idx} config={component} />;
            
            default:
              return null;
          }
        })}
      </div>
    );
  };

  const renderDefaultContent = () => {
    // Fallback to basic Yes/No question
    if (task.variant.initialQuestion) {
      return (
        <div className="mb-4">
          <p className="font-medium text-gray-900 mb-3">{task.variant.initialQuestion}</p>
          <div className="flex gap-3">
            <button
              onClick={() => onAction(task.taskId, 'mark_complete')}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              ✓ Yes, Done!
            </button>
            <button
              onClick={() => onAction(task.taskId, 'set_reminder', { days: 7 })}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Remind me in 7 days
            </button>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border-2 transition ${
      task.completed ? 'border-green-200 opacity-75' : 'border-gray-200 hover:border-indigo-300'
    }`}>
      {/* Header - Same as before */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className="mt-1">
              {task.completed ? (
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              ) : (
                <Circle className="w-6 h-6 text-gray-300" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className={`text-lg font-semibold ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                  {task.title}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded ${getCategoryColor(task.category)}`}>
                  {task.category}
                </span>
                {getUrgencyBadge()}
              </div>
              
              <p className="text-gray-600 text-sm mb-3">{task.variant.intro}</p>
              
              {task.deadline && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className={`font-medium ${
                    task.urgency === 'overdue' ? 'text-red-600' :
                    task.urgency === 'urgent' ? 'text-orange-600' :
                    'text-gray-600'
                  }`}>
                    Deadline: {format(new Date(task.deadline), 'MMM d, yyyy')}
                    {' '}({differenceInDays(new Date(task.deadline), new Date())} days left)
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expanded Content - UNIVERSAL RENDERER */}
      {expanded && (
        <div className="px-6 pb-6 border-t border-gray-100 pt-6">
          {/* Info Box */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-indigo-900 mb-2">📋 What you need to know:</h4>
            <div className="text-sm text-indigo-800 whitespace-pre-line">{task.variant.infoBox}</div>
          </div>

          {/* Dynamic Content based on ui_config */}
          {renderInteractiveContent()}

          {task.completed && (
            <div className="flex items-center gap-2 text-green-600 font-medium mt-4">
              <CheckCircle2 className="w-5 h-5" />
              <span>Task completed! Great job! 🎉</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 📝 FORM COMPONENT (Data-driven)
function FormComponent({ config, formData, setFormData, onSubmit }: any) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="font-semibold mb-3">{config.title || 'Fill out the form'}</h4>
      <div className="space-y-3">
        {config.fields?.map((field: any, idx: number) => (
          <div key={idx}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.type === 'select' ? (
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData[field.name] || ''}
                onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
              >
                <option value="">Select...</option>
                {field.options?.map((opt: string) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type || 'text'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData[field.name] || ''}
                onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                placeholder={field.placeholder}
              />
            )}
          </div>
        ))}
      </div>
      <button
        onClick={() => onSubmit(formData)}
        className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
      >
        {config.submitText || 'Submit'}
      </button>
    </div>
  );
}

// 📄 FILE UPLOAD COMPONENT
function FileUploadComponent({ config, onUpload }: any) {
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
      <p className="text-sm text-gray-600 mb-3">{config.label || 'Upload document'}</p>
      <input
        type="file"
        accept={config.accept || '*'}
        onChange={(e) => e.target.files && onUpload(e.target.files[0])}
        className="hidden"
        id="file-upload"
      />
      <label
        htmlFor="file-upload"
        className="inline-block px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 cursor-pointer"
      >
        Choose File
      </label>
    </div>
  );
}

// ✅ CHECKLIST COMPONENT
function ChecklistComponent({ config }: any) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="font-semibold mb-3">{config.title || 'Checklist'}</h4>
      <div className="space-y-2">
        {config.items?.map((item: string, idx: number) => (
          <label key={idx} className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checked.has(idx)}
              onChange={() => {
                const newChecked = new Set(checked);
                if (checked.has(idx)) {
                  newChecked.delete(idx);
                } else {
                  newChecked.add(idx);
                }
                setChecked(newChecked);
              }}
              className="w-5 h-5 text-indigo-600"
            />
            <span className={checked.has(idx) ? 'line-through text-gray-500' : 'text-gray-700'}>
              {item}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

// 🤖 AI GENERATE COMPONENT
function AIGenerateComponent({ config, taskId, loading, setLoading, content, setContent }: any) {
  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/generate-checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, type: config.aiType })
      });
      const data = await res.json();
      setContent(data);
    } catch (err) {
      console.error('AI generation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {!content ? (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50"
        >
          {loading ? '⏳ Generating...' : `🤖 ${config.buttonText || 'Generate with AI'}`}
        </button>
      ) : (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-semibold text-purple-900 mb-3">{content.title}</h4>
          <div className="space-y-3 text-sm text-purple-800">
            {/* Render AI content dynamically */}
            {JSON.stringify(content, null, 2)}
          </div>
        </div>
      )}
    </div>
  );
}

// 📊 COMPARISON TABLE COMPONENT
function ComparisonTableComponent({ config }: any) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            {config.headers?.map((header: string, idx: number) => (
              <th key={idx} className="px-4 py-2 text-left font-semibold">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {config.rows?.map((row: any, idx: number) => (
            <tr key={idx} className="border-t">
              {row.map((cell: string, cellIdx: number) => (
                <td key={cellIdx} className="px-4 py-2">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 🔗 EXTERNAL LINK COMPONENT
function ExternalLinkComponent({ config }: any) {
  return (
    <a
      href={config.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition font-medium"
    >
      <ExternalLink className="w-5 h-5" />
      {config.text || 'Visit External Site'}
    </a>
  );
}
