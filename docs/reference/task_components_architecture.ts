// ============================================
// SHARED TYPES & INTERFACES
// ============================================

// types/tasks.ts
export interface TaskVariant {
  id: string;
  task_id: number;
  target_audience: string[]; // ["eu_efta", "with_kids", ...]
  intro: string;
  info_box: string;
  initial_question?: string;
  answer_options?: string[];
  ui_config: UIConfig;
}

export interface UIConfig {
  has_form?: boolean;
  form_fields?: FormField[];
  ai_features?: {
    fetch_municipality_requirements?: boolean;
    generate_inquiry_email?: boolean;
    show_office_hours?: boolean;
    auto_fill_pdf_forms?: boolean;
    property_suggestions?: boolean;
  };
}

export interface FormField {
  name: string;
  type: 'text' | 'number' | 'select' | 'date';
  label: string;
  options?: string[];
  required: boolean;
}

export interface UserProfile {
  country_of_origin: string;
  nationality_category: 'eu_efta' | 'non_eu_visa_exempt' | 'non_eu_visa_required';
  municipality?: string;
  canton?: string;
  has_kids: boolean;
  num_children?: number;
}

// ============================================
// SHARED COMPONENTS
// ============================================

// components/tasks/shared/TaskCard.tsx
import React from 'react';

interface TaskCardProps {
  title: string;
  intro: string;
  isUrgent?: boolean;
  children: React.ReactNode;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  title, 
  intro, 
  isUrgent,
  children 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      {isUrgent && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4">
          <p className="text-red-700 text-sm font-medium">
            ⚠️ URGENT - Action required within 14 days
          </p>
        </div>
      )}
      
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-gray-600 mb-6">{intro}</p>
      
      {children}
    </div>
  );
};

// components/tasks/shared/InfoBox.tsx
interface InfoBoxProps {
  content: string;
}

export const InfoBox: React.FC<InfoBoxProps> = ({ content }) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <h3 className="font-semibold text-blue-900 mb-2">📋 Important Information</h3>
      <div className="text-sm text-blue-800 whitespace-pre-line">
        {content}
      </div>
    </div>
  );
};

// components/tasks/shared/QuestionPrompt.tsx
interface QuestionPromptProps {
  question: string;
  options: string[];
  onAnswer: (answer: string) => void;
  selectedAnswer?: string;
}

export const QuestionPrompt: React.FC<QuestionPromptProps> = ({
  question,
  options,
  onAnswer,
  selectedAnswer
}) => {
  return (
    <div className="mb-6">
      <p className="font-medium mb-3">{question}</p>
      <div className="flex gap-3">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onAnswer(option)}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              selectedAnswer === option
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

// components/tasks/shared/ReminderPrompt.tsx
interface ReminderPromptProps {
  onSetReminder: (days: number) => void;
}

export const ReminderPrompt: React.FC<ReminderPromptProps> = ({ onSetReminder }) => {
  const options = [3, 7, 14];
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <p className="font-medium mb-3">⏰ Shall we remind you to check on this?</p>
      <div className="flex gap-2">
        {options.map((days) => (
          <button
            key={days}
            onClick={() => onSetReminder(days)}
            className="px-4 py-2 bg-white border border-yellow-300 rounded-lg hover:bg-yellow-100 text-sm"
          >
            {days} days
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================
// TASK 1: RESIDENCE PERMIT
// ============================================

// components/tasks/Task1ResidencePermit/Task1ResidencePermit.tsx
import { useState } from 'react';
import { TaskCard, InfoBox, QuestionPrompt, ReminderPrompt } from '../shared';

interface Task1Props {
  variant: TaskVariant;
  userProfile: UserProfile;
  onComplete: () => void;
  onSetReminder: (days: number) => void;
}

export const Task1ResidencePermit: React.FC<Task1Props> = ({
  variant,
  userProfile,
  onComplete,
  onSetReminder
}) => {
  const [answer, setAnswer] = useState<string>();
  const [showReminder, setShowReminder] = useState(false);

  const handleAnswer = (ans: string) => {
    setAnswer(ans);
    
    if (ans === 'Yes') {
      onComplete();
    } else {
      setShowReminder(true);
    }
  };

  return (
    <TaskCard title={variant.title} intro={variant.intro}>
      <InfoBox content={variant.info_box} />
      
      {variant.initial_question && (
        <QuestionPrompt
          question={variant.initial_question}
          options={variant.answer_options || []}
          onAnswer={handleAnswer}
          selectedAnswer={answer}
        />
      )}
      
      {showReminder && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-3">
            Check the status of your permit application with your Swiss employer. 
            You cannot start work until it's approved.
          </p>
          <ReminderPrompt onSetReminder={onSetReminder} />
        </div>
      )}
    </TaskCard>
  );
};

// ============================================
// TASK 3: MUNICIPALITY REGISTRATION
// ============================================

// components/tasks/Task3Municipality/Task3Municipality.tsx
import { useState } from 'react';
import { TaskCard, InfoBox, QuestionPrompt, ReminderPrompt } from '../shared';
import { MunicipalityInfo } from './MunicipalityInfo';

interface Task3Props {
  variant: TaskVariant;
  userProfile: UserProfile;
  onComplete: () => void;
  onSetReminder: (days: number) => void;
}

export const Task3Municipality: React.FC<Task3Props> = ({
  variant,
  userProfile,
  onComplete,
  onSetReminder
}) => {
  const [answer, setAnswer] = useState<string>();
  const [showMunicipalityInfo, setShowMunicipalityInfo] = useState(false);

  const handleAnswer = (ans: string) => {
    setAnswer(ans);
    
    if (ans === 'Yes') {
      onComplete();
    } else {
      setShowMunicipalityInfo(true);
    }
  };

  return (
    <TaskCard 
      title="Register at your Gemeinde (municipality)" 
      intro={variant.intro}
      isUrgent={true}
    >
      <InfoBox content={variant.info_box} />
      
      <QuestionPrompt
        question={variant.initial_question || "Have you already registered yourself?"}
        options={variant.answer_options || ['Yes', 'Not yet']}
        onAnswer={handleAnswer}
        selectedAnswer={answer}
      />
      
      {showMunicipalityInfo && userProfile.municipality && (
        <MunicipalityInfo
          municipality={userProfile.municipality}
          canton={userProfile.canton || ''}
          aiFeatures={variant.ui_config.ai_features || {}}
        />
      )}
      
      {showMunicipalityInfo && (
        <div className="mt-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700 font-semibold">
              ⚠️ Don't delay! Registration is mandatory within 14 days.
            </p>
          </div>
          <ReminderPrompt onSetReminder={onSetReminder} />
        </div>
      )}
    </TaskCard>
  );
};

// components/tasks/Task3Municipality/MunicipalityInfo.tsx
interface MunicipalityInfoProps {
  municipality: string;
  canton: string;
  aiFeatures: {
    fetch_municipality_requirements?: boolean;
    generate_inquiry_email?: boolean;
    show_office_hours?: boolean;
  };
}

export const MunicipalityInfo: React.FC<MunicipalityInfoProps> = ({
  municipality,
  canton,
  aiFeatures
}) => {
  const [requirements, setRequirements] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchRequirements = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tasks/municipality-requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ municipality, canton })
      });
      const data = await res.json();
      setRequirements(data);
    } catch (error) {
      console.error('Failed to fetch requirements', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6 mb-4">
      <h3 className="font-semibold text-lg mb-4">
        📍 Requirements for {municipality}
      </h3>
      
      {aiFeatures.fetch_municipality_requirements && (
        <button
          onClick={fetchRequirements}
          disabled={loading}
          className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Fetching...' : 'Check specific requirements'}
        </button>
      )}
      
      {requirements && (
        <div className="bg-white rounded-lg p-4 mb-4">
          <h4 className="font-medium mb-2">Required Documents:</h4>
          <ul className="list-disc list-inside text-sm text-gray-700">
            {requirements.documents?.map((doc: string, i: number) => (
              <li key={i}>{doc}</li>
            ))}
          </ul>
          
          {requirements.fees && (
            <p className="mt-3 text-sm">
              <strong>Fees:</strong> {requirements.fees}
            </p>
          )}
          
          {requirements.office_hours && (
            <p className="mt-2 text-sm">
              <strong>Office Hours:</strong> {requirements.office_hours}
            </p>
          )}
        </div>
      )}
      
      {aiFeatures.generate_inquiry_email && (
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          📧 Generate inquiry email (in local language)
        </button>
      )}
    </div>
  );
};

// ============================================
// TASK 4: SCHOOL REGISTRATION
// ============================================

// components/tasks/Task4School/Task4School.tsx
import { useState } from 'react';
import { TaskCard, InfoBox, QuestionPrompt, ReminderPrompt } from '../shared';
import { SchoolInfo } from './SchoolInfo';

interface Task4Props {
  variant: TaskVariant;
  userProfile: UserProfile;
  onComplete: () => void;
  onSetReminder: (days: number) => void;
}

export const Task4School: React.FC<Task4Props> = ({
  variant,
  userProfile,
  onComplete,
  onSetReminder
}) => {
  const [answer, setAnswer] = useState<string>();
  const [showSchoolInfo, setShowSchoolInfo] = useState(false);

  const handleAnswer = (ans: string) => {
    setAnswer(ans);
    
    if (ans === 'Yes') {
      onComplete();
    } else {
      setShowSchoolInfo(true);
    }
  };

  return (
    <TaskCard 
      title="Register for school/kindergarten" 
      intro={variant.intro}
      isUrgent={true}
    >
      <InfoBox content={variant.info_box} />
      
      <QuestionPrompt
        question={variant.initial_question || "Have you already registered your child(ren) for school yet?"}
        options={variant.answer_options || ['Yes', 'Not yet']}
        onAnswer={handleAnswer}
        selectedAnswer={answer}
      />
      
      {showSchoolInfo && (
        <SchoolInfo
          municipality={userProfile.municipality || ''}
          canton={userProfile.canton || ''}
          numChildren={userProfile.num_children || 0}
          aiFeatures={variant.ui_config.ai_features || {}}
        />
      )}
      
      {showSchoolInfo && (
        <div className="mt-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700 font-semibold">
              ⚠️ Don't delay! School registration is mandatory immediately after arrival.
            </p>
          </div>
          <ReminderPrompt onSetReminder={onSetReminder} />
        </div>
      )}
    </TaskCard>
  );
};

// components/tasks/Task4School/SchoolInfo.tsx
interface SchoolInfoProps {
  municipality: string;
  canton: string;
  numChildren: number;
  aiFeatures: {
    fetch_school_requirements?: boolean;
    auto_fill_pdf_forms?: boolean;
    generate_inquiry_email?: boolean;
  };
}

export const SchoolInfo: React.FC<SchoolInfoProps> = ({
  municipality,
  canton,
  numChildren,
  aiFeatures
}) => {
  const [requirements, setRequirements] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchSchoolRequirements = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tasks/school-requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ municipality, canton })
      });
      const data = await res.json();
      setRequirements(data);
    } catch (error) {
      console.error('Failed to fetch requirements', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6 mb-4">
      <h3 className="font-semibold text-lg mb-4">
        🏫 School Registration for {municipality}
      </h3>
      
      <p className="text-sm text-gray-600 mb-4">
        Registering {numChildren} {numChildren === 1 ? 'child' : 'children'}
      </p>
      
      {aiFeatures.fetch_school_requirements && (
        <button
          onClick={fetchSchoolRequirements}
          disabled={loading}
          className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Fetching...' : 'Check specific requirements'}
        </button>
      )}
      
      {requirements && (
        <div className="bg-white rounded-lg p-4 mb-4">
          <h4 className="font-medium mb-2">Required Documents:</h4>
          <ul className="list-disc list-inside text-sm text-gray-700">
            {requirements.documents?.map((doc: string, i: number) => (
              <li key={i}>{doc}</li>
            ))}
          </ul>
          
          {requirements.forms && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Registration Forms:</h4>
              {requirements.forms.map((form: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">{form.name}</span>
                  <button className="text-blue-600 hover:text-blue-800 text-sm">
                    Download PDF
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div className="flex gap-3">
        {aiFeatures.auto_fill_pdf_forms && (
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            🤖 Auto-fill forms (English overlay)
          </button>
        )}
        
        {aiFeatures.generate_inquiry_email && (
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            📧 Generate inquiry email
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================
// USAGE IN DASHBOARD
// ============================================

// Example: How to use in dashboard
/*
import { Task1ResidencePermit } from '@/components/tasks/Task1ResidencePermit';
import { Task3Municipality } from '@/components/tasks/Task3Municipality';
import { Task4School } from '@/components/tasks/Task4School';

function DashboardPage() {
  const { userProfile, tasks } = useTaskEngine();
  
  return (
    <div>
      {tasks.map(task => {
        if (task.task_number === 1) {
          return (
            <Task1ResidencePermit
              key={task.id}
              variant={task.variant}
              userProfile={userProfile}
              onComplete={() => completeTask(task.id)}
              onSetReminder={(days) => setReminder(task.id, days)}
            />
          );
        }
        
        if (task.task_number === 3) {
          return (
            <Task3Municipality
              key={task.id}
              variant={task.variant}
              userProfile={userProfile}
              onComplete={() => completeTask(task.id)}
              onSetReminder={(days) => setReminder(task.id, days)}
            />
          );
        }
        
        // etc...
      })}
    </div>
  );
}
*/