'use client';

import { useState, useEffect } from 'react';
import { TaskCard } from './TaskCard';
import { mockTasks, getMockTaskContent, mockTaskStatuses, Task, TaskContent, TaskStatus } from '@/data/mockData';

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskStatuses, setTaskStatuses] = useState<Record<string, TaskStatus>>(mockTaskStatuses);

  useEffect(() => {
    // Simulate loading tasks
    const loadTasks = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTasks(mockTasks);
      setLoading(false);
    };

    loadTasks();
  }, []);

  const handleStatusUpdate = (taskId: string, newStatus: string) => {
    setTaskStatuses(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        status: newStatus as 'pending' | 'in_progress' | 'completed',
        metadata: {
          ...prev[taskId].metadata,
          updated_date: new Date().toISOString()
        }
      }
    }));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <TaskSkeleton key={i} />)}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">No tasks available for your profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Your Tasks</h2>
      
      {tasks.map(task => {
        const content = getMockTaskContent(task.task_id);
        const status = taskStatuses[task.task_id] || { status: 'pending', current_step: 1, metadata: {} };
        
        return (
          <TaskCard
            key={task.task_id}
            taskId={task.task_id}
            basicInfo={task.basic_info}
            content={content}
            status={status}
            onStatusUpdate={handleStatusUpdate}
          />
        );
      })}
    </div>
  );
}

// Task Skeleton Component for loading state
function TaskSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="h-6 bg-gray-200 rounded w-20"></div>
      </div>
      
      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
      
      <div className="bg-gray-100 p-4 mb-6">
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
      
      <div className="flex gap-3">
        <div className="h-10 bg-gray-200 rounded w-32"></div>
        <div className="h-10 bg-gray-200 rounded w-24"></div>
      </div>
    </div>
  );
}
