'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface Todo {
  id: number;
  title: string;
  completed: number;
  due_date: string | null;
  completed_by: string | null;
  created_at: string;
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [userName, setUserName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Load username from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('todoUserName');
    if (savedName) {
      setUserName(savedName);
    }
  }, []);

  // Save username to localStorage when it changes
  useEffect(() => {
    if (userName) {
      localStorage.setItem('todoUserName', userName);
    }
  }, [userName]);

  const fetchTodos = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/todos', {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch todos: ${response.statusText}`);
      }

      const data = await response.json();
      setTodos(data);
    } catch (error) {
      console.error('Failed to fetch todos:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch todos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  useEffect(() => {
    // Focus input on mount and whenever todos change
    inputRef.current?.focus();
  }, [todos]);

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTodo = newTodo.trim();
    if (!trimmedTodo) {
      setError('Please enter a todo item');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmedTodo,
          due_date: newDueDate || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create todo');
      }

      const newTodoItem = await response.json();
      setTodos([newTodoItem, ...todos]);
      setNewTodo('');
      setNewDueDate('');
    } catch (error) {
      console.error('Failed to add todo:', error);
      setError(error instanceof Error ? error.message : 'Failed to add todo');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTodo = async (id: number, completed: number) => {
    const previousTodos = [...todos];
    const isCompleting = !completed;
    const completedBy = isCompleting ? (userName.trim() || null) : null;

    // Optimistic update
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: completed ? 0 : 1, completed_by: completedBy } : todo
    ));

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completed: isCompleting,
          completed_by: completedBy
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update todo');
      }

      const updatedTodo = await response.json();
      setTodos(todos.map(todo =>
        todo.id === id ? updatedTodo : todo
      ));
    } catch (error) {
      console.error('Failed to toggle todo:', error);
      setTodos(previousTodos); // Revert on error
      setError('Failed to update todo');
    }
  };

  const deleteTodo = async (id: number) => {
    const previousTodos = [...todos];

    // Optimistic update
    setTodos(todos.filter(todo => todo.id !== id));

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete todo');
      }
    } catch (error) {
      console.error('Failed to delete todo:', error);
      setTodos(previousTodos); // Revert on error
      setError('Failed to delete todo');
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dueDate) < today;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Todo App</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          )}

          <div className="mb-4 p-3 bg-accent rounded-md">
            <label htmlFor="userName" className="text-sm font-medium mb-1 block">
              Your Name (for tracking completed todos)
            </label>
            <Input
              id="userName"
              type="text"
              placeholder="Enter your name..."
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="bg-background"
            />
          </div>

          <form onSubmit={addTodo} className="space-y-3 mb-6">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Add a new todo..."
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              disabled={submitting}
              autoFocus
            />
            <div className="flex gap-2">
              <Input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                disabled={submitting}
                className="flex-1"
                placeholder="Due date (optional)"
              />
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </form>

          <div className="space-y-2">
            {todos.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No todos yet. Add one to get started!
              </p>
            ) : (
              todos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <Checkbox
                    checked={Boolean(todo.completed)}
                    onCheckedChange={() => toggleTodo(todo.id, todo.completed)}
                  />
                  <div className="flex-1">
                    <span
                      className={`${
                        todo.completed ? 'line-through text-muted-foreground' : ''
                      }`}
                    >
                      {todo.title}
                    </span>
                    {todo.due_date && (
                      <div className={`text-xs mt-1 ${
                        isOverdue(todo.due_date) && !todo.completed
                          ? 'text-red-500 font-semibold'
                          : 'text-muted-foreground'
                      }`}>
                        Due: {new Date(todo.due_date).toLocaleDateString()}
                        {isOverdue(todo.due_date) && !todo.completed && ' (Overdue!)'}
                      </div>
                    )}
                    {todo.completed && todo.completed_by && (
                      <div className="text-xs mt-1 text-muted-foreground italic">
                        Completed by: {todo.completed_by}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteTodo(todo.id)}
                  >
                    Delete
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            {todos.length} {todos.length === 1 ? 'item' : 'items'} total
            {' • '}
            {todos.filter(t => !t.completed).length} active
            {' • '}
            {todos.filter(t => t.completed).length} completed
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
