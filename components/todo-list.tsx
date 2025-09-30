'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await fetch('/api/todos');
      const data = await response.json();
      setTodos(data);
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTodo }),
      });
      const todo = await response.json();
      setTodos([todo, ...todos]);
      setNewTodo('');
    } catch (error) {
      console.error('Failed to add todo:', error);
    }
  };

  const toggleTodo = async (id: number, completed: boolean) => {
    try {
      await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      });
      setTodos(todos.map(todo =>
        todo.id === id ? { ...todo, completed: !completed } : todo
      ));
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      await fetch(`/api/todos/${id}`, { method: 'DELETE' });
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Todo App</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addTodo} className="flex gap-2 mb-6">
            <Input
              type="text"
              placeholder="Add a new todo..."
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">Add</Button>
          </form>

          <div className="space-y-2">
            {todos.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No todos yet. Add one to get started!</p>
            ) : (
              todos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <Checkbox
                    checked={todo.completed}
                    onCheckedChange={() => toggleTodo(todo.id, todo.completed)}
                  />
                  <span className={`flex-1 ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                    {todo.title}
                  </span>
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
        </CardContent>
      </Card>
    </div>
  );
}