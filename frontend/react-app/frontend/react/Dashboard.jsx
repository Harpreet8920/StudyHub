import React, { useMemo, useState } from "react";

class ProgressCard extends React.Component {
  render() {
    const { completed, total, percent } = this.props;
    return (
      <p>
        Progress: {completed}/{total} ({percent}%)
      </p>
    );
  }
}

function Dashboard() {
  const [tasks, setTasks] = useState([
    { id: 1, name: "Complete DBMS notes", done: false },
    { id: 2, name: "Practice DSA problems", done: true }
  ]);

  const completed = useMemo(() => tasks.filter((t) => t.done).length, [tasks]);
  const percent = Math.round((completed / tasks.length) * 100);

  function toggleTask(id) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  return (
    <section>
      <h3>StudyHub Dashboard (React Demo)</h3>
      <ProgressCard completed={completed} total={tasks.length} percent={percent} />
      <button onClick={() => toggleTask(1)}>Toggle First Task</button>
    </section>
  );
}

export default Dashboard;
