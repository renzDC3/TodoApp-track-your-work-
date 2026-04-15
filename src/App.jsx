import { useState, useRef, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import "./App.css";

const DEFAULT_IMAGE = "/to-do-list.png";
const ICON_CHOICES = [
  { value: "/icons/icon-1.png", label: "Icon 1" },
  { value: "/icons/icon-2.png", label: "Icon 2" },
  { value: "/icons/icon-3.png", label: "Icon 3" },
  { value: "/icons/icon-4.png", label: "Icon 4" },
  { value: "/icons/icon-5.png", label: "Icon 5" },
  { value: "/icons/icon-6.png", label: "Icon 6" },
  { value: "/icons/icon-7.png", label: "Icon 7" },
  { value: "/icons/icon-8.png", label: "Icon 8" },
];

const App = () => {
  const [newTask, setNewTask] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(ICON_CHOICES[0].value);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconSearch, setIconSearch] = useState("");

  const iconPickerRef = useRef(null);
  const tasks = useLiveQuery(() => db.tasks.toArray(), []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (iconPickerRef.current && !iconPickerRef.current.contains(event.target)) {
        setShowIconPicker(false);
      }
    };

    if (showIconPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showIconPicker]);

  const addTask = async () => {
    if (!newTask.trim()) return;

    await db.tasks.add({
      title: newTask,
      icon: selectedIcon,
      completed: false,
    });

    setNewTask("");
    setSelectedIcon(ICON_CHOICES[0].value);
  };

  const toggleTaskCompleted = async (task) => {
    await db.tasks.update(task.id, { completed: !task.completed });
  };

  const completedCount = tasks?.filter((task) => task.completed).length || 0;
  const uncompletedCount = (tasks?.length || 0) - completedCount;
  const selectedIconLabel = ICON_CHOICES.find((icon) => icon.value === selectedIcon)?.label || "Choose icon";
  const filteredIcons = ICON_CHOICES.filter((icon) =>
    icon.label.toLowerCase().includes(iconSearch.toLowerCase()) ||
    icon.value.toLowerCase().includes(iconSearch.toLowerCase())
  );

  const renderTaskIcon = (iconValue, title) => {
    if (iconValue && iconValue.startsWith("/")) {
      return (
        <img
          src={iconValue}
          alt={title}
          className="task-image"
          onError={(event) => {
            event.currentTarget.src = DEFAULT_IMAGE;
          }}
        />
      );
    }

    if (iconValue) {
      return (
        <div className="task-icon" aria-hidden="true">
          {iconValue}
        </div>
      );
    }

    return <img src={DEFAULT_IMAGE} alt={title} className="task-image" />;
  };

  return (
    <div className="todo-container">
      <header className="todo-header todo-header-simple">
        <h1 className="App_Title">Todo List</h1>
      </header>

      <section className="input-section">
        <input
          type="text"
          className="task-input"
          placeholder="Task"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
        />
        <div className="icon-picker" ref={iconPickerRef}>
          <span className="icon-picker-label">Choose icon</span>
          <button type="button" className="icon-picker-trigger" onClick={() => setShowIconPicker((open) => !open)}>
            <span className="icon-picker-preview">
              <img
                src={selectedIcon}
                alt={selectedIconLabel}
                className="icon-picker-preview-image"
                onError={(event) => {
                  event.currentTarget.src = DEFAULT_IMAGE;
                }}
              />
            </span>
            <span className="icon-picker-trigger-text">{selectedIconLabel}</span>
          </button>

          {showIconPicker && (
            <div className="icon-picker-popup">
              <input
                type="text"
                className="icon-search-input"
                placeholder="Search sticker or icon"
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
              />

              {filteredIcons.length === 0 ? (
                <p className="icon-empty-state">No matching icons found.</p>
              ) : (
                <div className="icon-options">
                  {filteredIcons.map((iconOption) => (
                    <button
                      key={iconOption.value}
                      type="button"
                      className={`icon-option ${selectedIcon === iconOption.value ? "selected" : ""}`}
                      onClick={() => {
                        setSelectedIcon(iconOption.value);
                        setShowIconPicker(false);
                        setIconSearch("");
                      }}
                      aria-label={iconOption.label}
                      title={iconOption.label}
                    >
                      <img
                        src={iconOption.value}
                        alt={iconOption.label}
                        className="icon-option-image"
                        onError={(event) => {
                          event.currentTarget.src = DEFAULT_IMAGE;
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <button className="add-task-btn" onClick={addTask}>
          Add Task
        </button>
      </section>

      <section className="list-section">
        <div className="task-summary">
          <span className="summary-pill">Complete: {completedCount}</span>
          <span className="summary-pill">Uncomplete: {uncompletedCount}</span>
        </div>
        {!tasks ? (
          <p>Loading...</p>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task.id} className={`task-item ${task.completed ? "is-completed" : ""}`}>
                <div className="task-visual">
                  {renderTaskIcon(task.icon || task.image, task.title)}
                </div>

                <div className="task-details">
                  <div className="task-title">{task.title}</div>
                </div>

                <div className="task-actions">
                  <button className="complete-task-btn" onClick={() => toggleTaskCompleted(task)}>
                    {task.completed ? "Uncomplete" : "Complete"}
                  </button>
                  <button className="delete-task-btn" onClick={() => db.tasks.delete(task.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default App;