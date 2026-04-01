// src/App.jsx
import { useState, useRef, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import "./App.css";

const DEFAULT_IMAGE = "/to-do-list.png"; 

const App = () => {
  const [newTask, setNewTask] = useState("");
  const [taskImage, setTaskImage] = useState(null);
  const [dueDate, setDueDate] = useState(""); 
  const [showNotifications, setShowNotifications] = useState(false); 
  
  const fileInputRef = useRef(null);
  const notificationRef = useRef(null); // Ref for the notification popup
  const tasks = useLiveQuery(() => db.tasks.toArray(), []);

  // --- NEW: Click Outside Logic ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If the popup is open and the click is NOT inside the popup, close it
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  // Request Notification Permission
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  // Alarm Engine
  useEffect(() => {
    const checkAlarms = setInterval(async () => {
      const allTasks = await db.tasks.toArray();
      const now = new Date().getTime();

      allTasks.forEach(async (task) => {
        if (task.dueDate && !task.notified) {
          const taskTime = new Date(task.dueDate).getTime();
          if (now >= taskTime) {
            if (Notification.permission === "granted") {
              new Notification("Task Due!", { body: task.title, icon: task.image || DEFAULT_IMAGE });
            }
            await db.tasks.update(task.id, { notified: true, notificationDismissed: false });
          }
        }
      });
    }, 10000); 
    return () => clearInterval(checkAlarms);
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setTaskImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    await db.tasks.add({
      title: newTask,
      image: taskImage,
      dueDate: dueDate || null,
      notified: false,
      notificationDismissed: false 
    });
    setNewTask(""); setTaskImage(null); setDueDate("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const dismissNotification = async (id) => {
    await db.tasks.update(id, { notificationDismissed: true });
  };

  const activeNotifications = tasks?.filter(t => t.notified && !t.notificationDismissed) || [];
//color
  return (
    <div className="todo-container">
      <header className="todo-header">
        <h1 className="App_Title">Todo List</h1>
        <div className="notification-bell-container" onClick={() => setShowNotifications(!showNotifications)}>
          <span className="bell-icon">
            {/* Changed <image> to <img> and added a className */}
            <img src="/notification.png" alt="Notification Bell" className="bell-img" />
          </span>
          {activeNotifications.length > 0 && (
            <span className="notification-badge">{activeNotifications.length}</span>
          )}
        </div>

        {showNotifications && (
          <div className="notification-popup" ref={notificationRef}>
            <div className="notification-popup-header">
              <h3 className="notification-title">Notifications</h3>
              {/* Close button for the popup itself */}
              <button className="popup-close-x" onClick={() => setShowNotifications(false)}>×</button>
            </div>
            
            {activeNotifications.length === 0 ? (
              <p className="notification-empty">No new notifications.</p>
            ) : (
              <ul className="notification-list">
                {activeNotifications.map(notif => (
                  <li key={notif.id} className="notification-item">
                    <span className="notification-text">{notif.title}</span>
                    <button className="notification-dismiss" onClick={() => dismissNotification(notif.id)}>×</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </header>

      {/* Inputs */}
      <section className="input-section">
        <input type="text" className="task-input" placeholder="Task" value={newTask} onChange={(e) => setNewTask(e.target.value)} />
        <input type="datetime-local" className="date-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <input type="file" className="file-input" accept="image/*" onChange={handleImageChange} ref={fileInputRef} />
        {taskImage && <img src={taskImage} alt="Preview" className="image-preview" />}
        <button className="add-task-btn" onClick={addTask}>Add Task</button>
      </section>

      {/* List */}
      <section className="list-section">
        {!tasks ? <p>Loading...</p> : (
          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task.id} className="task-item">
                <img src={task.image || DEFAULT_IMAGE} alt="Task" className="task-image" />
                <div className="task-details">
                  <div className="task-title">{task.title}</div>
                  {task.dueDate && <div className="task-due-date">{new Date(task.dueDate).toLocaleString()}</div>}
                </div>
                <button className="delete-task-btn" onClick={() => db.tasks.delete(task.id)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default App;