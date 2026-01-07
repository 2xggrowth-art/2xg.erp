import ComingSoon from '../components/common/ComingSoon';

const TasksPage = () => {
  return (
    <ComingSoon
      moduleName="Task Management"
      description="Organize, assign, and track tasks and projects with powerful collaboration tools."
      features={[
        'Task creation and assignment',
        'Project organization',
        'Priority and status tracking',
        'Due date reminders',
        'Task dependencies',
        'Time tracking and estimation',
        'Collaborative comments and attachments',
        'Kanban board view',
        'Gantt chart visualization',
        'Team productivity analytics'
      ]}
    />
  );
};

export default TasksPage;
