import React from "react";

class TaskStats extends React.Component {
  getCounts() {
    const total = this.props.tasks.length;
    const completed = this.props.tasks.filter((task) => task.status === "completed").length;
    const pending = total - completed;
    return { total, completed, pending };
  }

  render() {
    const { total, completed, pending } = this.getCounts();

    return (
      <div className="stats-card">
        <h3>Task Overview</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span>Total</span>
            <strong>{total}</strong>
          </div>
          <div className="stat-item">
            <span>Completed</span>
            <strong>{completed}</strong>
          </div>
          <div className="stat-item">
            <span>Pending</span>
            <strong>{pending}</strong>
          </div>
        </div>
      </div>
    );
  }
}

export default TaskStats;
