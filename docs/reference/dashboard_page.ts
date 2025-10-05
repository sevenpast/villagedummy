'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function Dashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'urgent' | 'completed'>('all');

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      const res = await fetch('/api/tasks/personalized');
      const data = await res.json();
      setUser(data.user);
      setTasks(data.tasks);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleTaskAction(taskId: number, action: string) {
    if (action === 'mark_complete') {
      await fetch('/api/tasks/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, status: 'completed' })
      });
      loadTasks();
    }
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'urgent') return task.isUrgent || task.urgency;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your personalized tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome to Switzerland, {user?.first_name || 'Friend'}! 🇨🇭
              </h1>
              <p className="text-gray-600 mt-1">
                Your first 90 days roadmap • {user?.municipality || 'Switzerland'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-indigo-600">{progress}%</div>
              <div className="text-sm text-gray-600">{completedCount}/{tasks.length} completed</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            All Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setFilter('urgent')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'urgent'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Urgent ({tasks.filter(t => t.isUrgent || t.urgency).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'completed'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.map(task => (
            <TaskCard
              key={task.taskId}
              task={task}
              expanded={expandedTask === task.taskId}
              onToggle={() => setExpandedTask(expandedTask === task.taskId ? null : task.taskId)}
              onAction={handleTaskAction}
            />
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-gray-500 text-lg">No tasks found in this category</p>
          </div>
        )}
      </main>
    </div>
  );
}

function TaskCard({ task, expanded, onToggle, onAction }: any) {
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

  return (
    <div className={`bg-white rounded-xl shadow-sm border-2 transition ${
      task.completed ? 'border-green-200 opacity-75' : 'border-gray-200 hover:border-indigo-300'
    }`}>
      {/* Header */}
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

      {/* Expanded Content */}
      {expanded && (
        <div className="px-6 pb-6 border-t border-gray-100 pt-6">
          {/* Info Box */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-indigo-900 mb-2">📋 What you need to know:</h4>
            <div className="text-sm text-indigo-800 whitespace-pre-line">{task.variant.infoBox}</div>
          </div>

          {/* Question & Actions */}
          {task.variant.initialQuestion && (
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
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Not Yet
                </button>
              </div>
            </div>
          )}

          {task.completed && (
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <CheckCircle2 className="w-5 h-5" />
              <span>Task completed! Great job! 🎉</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
