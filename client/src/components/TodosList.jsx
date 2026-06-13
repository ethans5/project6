import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

const API_URL = 'http://localhost:3000';

async function apiRequest(path, options) {
  const response = await fetch(`${API_URL}${path}`, options);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Request failed');
  }

  return result.data;
}

const TodosList = () => {
  const { user } = useOutletContext();
  const [todos, setTodos] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadTodos = async () => {
    if (!user) return;

    setIsLoading(true);
    setError('');
    try {
      const data = await apiRequest(`/todos?userId=${user.id}`);
      setTodos(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTodos();
  }, [user]);

  const handleAddTodo = async (event) => {
    event.preventDefault();
    if (!newTitle.trim()) return;

    setError('');
    try {
      const createdData = await apiRequest('/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: newTitle,
          completed: false
        })
      });
      // Pessimistic UI: Update state ONLY after successful response
      setTodos((prev) => [...prev, createdData]);
      setNewTitle('');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleCompletedChange = async (todo) => {
    setError('');
    try {
      const updatedData = await apiRequest(`/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !todo.completed })
      });
      // Pessimistic UI: Update state ONLY after successful response
      setTodos((prev) => prev.map(t => t.id === todo.id ? updatedData : t));
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const startEditing = (todo) => {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
  };

  const handleEditTodo = async (event, id) => {
    event.preventDefault();
    if (!editingTitle.trim()) return;

    setError('');
    try {
      const updatedData = await apiRequest(`/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingTitle })
      });
      // Pessimistic UI: Update state ONLY after successful response
      setTodos((prev) => prev.map(t => t.id === id ? updatedData : t));
      setEditingId(null);
      setEditingTitle('');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleDeleteTodo = async (id) => {
    setError('');
    try {
      await apiRequest(`/todos/${id}`, { method: 'DELETE' });
      // Pessimistic UI: Remove from state ONLY after successful response
      setTodos((prev) => prev.filter(t => t.id !== id));
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <section className="todos-card">
      <div className="todos-heading">
        <div>
          <h2>My Todos</h2>
          <p>{todos.length} task{todos.length === 1 ? '' : 's'}</p>
        </div>
        <button className="secondary-btn" onClick={loadTodos}>Refresh</button>
      </div>

      <form className="add-todo-form" onSubmit={handleAddTodo}>
        <input
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="Add a new todo"
          maxLength="255"
          required
        />
        <button className="primary-action" type="submit">Add Todo</button>
      </form>

      {error && <div className="todo-error">{error}</div>}
      {isLoading ? (
        <p className="list-message">Loading todos...</p>
      ) : todos.length === 0 ? (
        <p className="list-message">No todos yet. Add your first task above.</p>
      ) : (
        <ul className="todo-list">
          {todos.map((todo, index) => (
            <li className="todo-item" key={todo.id}>
              <input
                className="todo-checkbox"
                type="checkbox"
                checked={Boolean(todo.completed)}
                onChange={() => handleCompletedChange(todo)}
                aria-label={`Mark Tâche ${index + 1} as ${todo.completed ? 'incomplete' : 'completed'}`}
              />
              <span className="todo-id">#{index + 1} :</span>
              {editingId === todo.id ? (
                <form className="edit-todo-form" onSubmit={(event) => handleEditTodo(event, todo.id)}>
                  <input
                    value={editingTitle}
                    onChange={(event) => setEditingTitle(event.target.value)}
                    maxLength="255"
                    autoFocus
                    required
                  />
                  <button className="small-btn save-btn" type="submit">Save</button>
                  <button className="small-btn" type="button" onClick={() => setEditingId(null)}>Cancel</button>
                </form>
              ) : (
                <>
                  <span className={`todo-title ${todo.completed ? 'completed' : ''}`}>{todo.title}</span>
                  <div className="todo-actions">
                    <button className="small-btn" onClick={() => startEditing(todo)}>Edit</button>
                    <button className="small-btn delete-btn" onClick={() => handleDeleteTodo(todo.id)}>Delete</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default TodosList;
