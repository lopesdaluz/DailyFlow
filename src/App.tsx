import { useState } from 'react';
import './App.css';

type Task = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
};

//state variables to handle loading and message
function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  //function to handle signup,
  // when being clicked the function updates the loading state to true and clears any previous messages.
  // It then sends a POST request to the signup endpoint with the email and password.
  //  If the response is not ok,
  // it throws an error with the message from the response.
  // If the signup is successful,
  //  it stores the token in the local storage and updates the message state to indicate success.
  //  If the request fails, it catches the error and updates the message state with the error message.
  // Finally, it sets the loading state back to false.
  const handleLogin = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('dailyflow-token', data.token);
      //prototype example
      const loadedTasks = await fetchTask();
      setTasks(loadedTasks);
      // if (tasks.length > 0) {
      //   const firstTaskId = tasks[0].id;
      //   await updateTask(firstTaskId);
      // }
      // await createTask();
      setMessage('Login successfull');
      console.log('Login response:', data);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Something went wrong';
      setMessage(errorMessage);
      console.error('Login error', error);
    } finally {
      setLoading(false);
    }
  };

  //fetch task
  const fetchTask = async () => {
    //tar den token från local storage.
    const token = localStorage.getItem('dailyflow-token');

    const response = await fetch('http://localhost:5000/api/tasks', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch tasks');
    }

    console.log('Tasks:', data.tasks);
    return data.tasks;
  };

  //create useEffect HÄR

  //create a task function
  const createTask = async () => {
    // Kolla att titeln inte är tom
    if (!title.trim()) {
      setMessage('Title is required');
      return;
    }

    try {
      const token = localStorage.getItem('dailyflow-token');

      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create task');
      }

      // Hämta listan igen så att den nya tasken syns
      const refreshedTasks = await fetchTask();
      setTasks(refreshedTasks);

      // Töm fälten och visa ett meddelande
      setTitle('');
      setDescription('');
      setMessage('Task created');
      console.log('Created task:', data);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Something went wrong'
      );
    }
  };
  //update a existing task function
  const updateTask = async (taskId: string) => {
    const token = localStorage.getItem('dailyflow-token');

    const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Update task title',
        description: 'Updated task description',
        completed: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update task');
    }

    console.log('Updated task:', data);
    return data;
  };

  const handleSignin = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      localStorage.setItem('dailyflow-token', data.token);
      setMessage('Signup successful');
      console.log('Signup response:', data);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Something went wrong';
      setMessage(errorMessage);
      console.error('Signup error', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px' }}>
      <button onClick={handleLogin} disabled={loading}>
        {loading ? 'Logging in...' : 'Log in'}
      </button>
      {message && <p>{message}</p>}
      <input
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Name"
      />
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password"
      />
      <button onClick={handleSignin} disabled={loading}>
        {loading ? 'Sign  in...' : 'Sign in'}
      </button>
      {/*add the task list */}
      <h2>New task</h2>
      <input
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Title"
      />
      <input
        type="text"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="description"
      />
      <button onClick={createTask}>Create task</button>
      <h2>My tasks</h2>
      {tasks.length === 0 ? (
        <p> No tasks yet </p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li key={task.id}>
              <strong>{task.title}</strong>
              {task.description && <p>{task.description}</p>}
              <span>{task.completed ? 'completed' : 'not done'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
export default App;
