'use client';

import { useState } from 'react';
import { TaskContent, TaskStatus } from '@/data/mockData';

interface TaskCardProps {
  taskId: string;
  basicInfo: {
    title: string;
    category: string;
    estimated_duration: string;
  };
  content: TaskContent;
  status: TaskStatus;
  onStatusUpdate: (taskId: string, newStatus: string) => void;
}

export function TaskCard({ taskId, basicInfo, content, status, onStatusUpdate }: TaskCardProps) {
  const [updating, setUpdating] = useState(false);

  const updateTaskStatus = async (newStatus: string) => {
    setUpdating(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    onStatusUpdate(taskId, newStatus);
    setUpdating(false);
  };

  const isCompleted = status.status === 'completed';

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 mb-4 border-l-4 ${
      isCompleted ? 'border-green-500' : 'border-blue-500'
    }`}>
      {/* Task Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            {content.content_structure.title}
          </h3>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <span className="bg-gray-100 px-2 py-1 rounded">
              {basicInfo.category}
            </span>
            <span>{basicInfo.estimated_duration}</span>
          </div>
        </div>
        
        <TaskStatusBadge status={status.status} />
      </div>

      {/* Task Intro */}
      <p className="text-gray-700 mb-4">
        {content.content_structure.intro}
      </p>

      {/* Detailed Info Box */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <div className="whitespace-pre-line text-sm text-gray-700">
          {content.content_structure.info_box}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!isCompleted && (
          <>
            <button
              onClick={() => updateTaskStatus('completed')}
              disabled={updating}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {updating ? 'Updating...' : content.content_structure.action_options.primary}
            </button>
            
            <button
              onClick={() => updateTaskStatus('in_progress')}
              disabled={updating}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
            >
              {content.content_structure.action_options.secondary}
            </button>
          </>
        )}
        
        {isCompleted && (
          <button
            onClick={() => updateTaskStatus('pending')}
            className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
          >
            Mark as Incomplete
          </button>
        )}
      </div>

      {/* Task-specific components */}
      {taskId === 'find_housing' && <HousingTaskExtras />}
      {taskId === 'register_gemeinde' && <GemeindeTaskExtras />}
    </div>
  );
}

// Task Status Badge Component
interface TaskStatusBadgeProps {
  status: string;
}

function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
      {getStatusText(status)}
    </span>
  );
}

// Housing Task Extras
function HousingTaskExtras() {
  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <h4 className="font-medium mb-2">Quick Tools:</h4>
      <div className="space-y-2">
        <a 
          href="https://homegate.ch" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline block"
        >
          → Search on Homegate.ch
        </a>
        <a 
          href="https://immoscout24.ch" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline block"
        >
          → Search on ImmoScout24.ch
        </a>
        <a 
          href="https://ronorp.ch" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline block"
        >
          → Search on RonOrp.ch
        </a>
      </div>
    </div>
  );
}

// Gemeinde Task Extras
function GemeindeTaskExtras() {
  const [loading, setLoading] = useState(false);
  const [emailGenerated, setEmailGenerated] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<string>('');

  const generateEmail = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Generate email asking about registration requirements for a new resident',
          task_type: 'email_generation',
          user_data: {
            municipality: 'Zurich',
            citizenship: 'United States',
            has_family: true
          }
        })
      });
      
      const data = await response.json();
      
      if (data.generated_text) {
        setGeneratedEmail(data.generated_text);
        setEmailGenerated(true);
      } else {
        console.error('Error generating email:', data.error);
        alert('Error generating email: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error generating email:', error);
      alert('Error generating email. Please try again.');
    }
    setLoading(false);
  };

  const downloadEmail = () => {
    if (generatedEmail) {
      const blob = new Blob([generatedEmail], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'zurich_registration_inquiry.txt';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <h4 className="font-medium mb-2">Need Help?</h4>
      
      {!emailGenerated ? (
        <button
          onClick={generateEmail}
          disabled={loading}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Generating...' : 'Generate Email to Municipality'}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="bg-white p-3 rounded border">
            <h5 className="font-medium text-sm mb-2">Generated Email:</h5>
            <div className="text-xs text-gray-700 whitespace-pre-line max-h-40 overflow-y-auto">
              {generatedEmail}
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={downloadEmail}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
            >
              Download Email
            </button>
            <button
              onClick={() => {
                setEmailGenerated(false);
                setGeneratedEmail('');
              }}
              className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
            >
              Generate New
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
