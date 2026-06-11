import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

const API_URL = 'http://localhost:3000';

async function apiRequest(path, options) {
  const response = await fetch(`${API_URL}${path}`, options);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Request failed');
  }

  return result.data;
}

const Dashboard = () => {
  const [user] = useState(() => {
    const storedUser = localStorage.getItem('currentUser');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [showProfile, setShowProfile] = useState(false);
  const [showTodos, setShowTodos] = useState(false);
  const [todos, setTodos] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadTodos = async (activeUser = user) => {
    if (!activeUser) return;

    setIsLoading(true);
    setError('');
    try {
      const data = await apiRequest(`/todos?userId=${activeUser.id}`);
      setTodos(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowTodos = () => {
    setShowTodos(true);
    loadTodos();
  };

  const handleAddTodo = async (event) => {
    event.preventDefault();
    if (!newTitle.trim()) return;

    setError('');
    try {
      await apiRequest('/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: newTitle,
          completed: false
        })
      });
      setNewTitle('');
      await loadTodos();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleCompletedChange = async (todo) => {
    setError('');
    try {
      await apiRequest(`/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !todo.completed })
      });
      await loadTodos();
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
      await apiRequest(`/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingTitle })
      });
      setEditingId(null);
      setEditingTitle('');
      await loadTodos();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleDeleteTodo = async (id) => {
    setError('');
    try {
      await apiRequest(`/todos/${id}`, { method: 'DELETE' });
      await loadTodos();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  if (!user) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo">JSONPlaceholder Clone</div>
        </div>
        <div className="header-center">
          <h1 className="welcome-message">Hello, {user.name}!</h1>
        </div>
        <div className="header-right">
          <button className="icon-btn" onClick={() => setShowProfile(true)}>Info</button>
          <button className="icon-btn logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {showProfile && (
        <div className="modal-overlay" onClick={() => setShowProfile(false)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>User Profile</h2>
              <button className="close-btn" onClick={() => setShowProfile(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="profile-detail"><span className="detail-label">ID:</span><span>{user.id}</span></div>
              <div className="profile-detail"><span className="detail-label">Name:</span><span>{user.name}</span></div>
              <div className="profile-detail"><span className="detail-label">Username:</span><span>@{user.username}</span></div>
              <div className="profile-detail"><span className="detail-label">Email:</span><span>{user.email}</span></div>
            </div>
          </div>
        </div>
      )}

      <main className="dashboard-main">
        <nav className="resource-nav">
          <button className={`resource-btn ${showTodos ? 'active' : ''}`} onClick={handleShowTodos}>
            Todos
          </button>
        </nav>

        {!showTodos ? (
          <section className="placeholder-card">
            <h2>Dashboard</h2>
            <p>Choose Todos to manage your tasks.</p>
          </section>
        ) : (
          <section className="todos-card">
            <div className="todos-heading">
              <div>
                <h2>My Todos</h2>
                <p>{todos.length} task{todos.length === 1 ? '' : 's'}, sorted by ID</p>
              </div>
              <button className="secondary-btn" onClick={() => loadTodos()}>Refresh</button>
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
                {todos.map((todo) => (
                  <li className="todo-item" key={todo.id}>
                    <input
                      className="todo-checkbox"
                      type="checkbox"
                      checked={Boolean(todo.completed)}
                      onChange={() => handleCompletedChange(todo)}
                      aria-label={`Mark ${todo.title} as ${todo.completed ? 'incomplete' : 'completed'}`}
                    />
                    <span className="todo-id">#{todo.id}</span>
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
        )}
      </main>
    </div>
  );
};

export default Dashboard;
