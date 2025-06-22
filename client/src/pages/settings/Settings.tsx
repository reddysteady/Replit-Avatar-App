import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import React from 'react';

// Dummy components for demonstration purposes
const NavItem = ({ to, icon: Icon, label, description }) => (
  <div>
    <a href={to}>
      {Icon && <Icon />}
      {label} - {description}
    </a>
  </div>
);

const Shield = () => <span>ShieldIcon</span>;
const MessageSquare = () => <span>MessageSquareIcon</span>;

const Settings = () => {
  const navigate = useNavigate();

  // Redirect to AI Settings as the default sub-page according to menu architecture
  useEffect(() => {
    navigate('/settings/ai', { replace: true });
  }, [navigate]);

  return (
    <div>
      <h1>Settings</h1>
      <NavItem
        to="/settings/ai"
        icon={Shield}
        label="AI Settings"
        description="Configure AI behavior"
      />
      <NavItem
        to="/settings/privacy"
        icon={Shield}
        label="Privacy & Security"
        description="Data handling and security settings"
      />
      <NavItem
        to="/settings/chat-logs"
        icon={MessageSquare}
        label="Chat Logs"
        description="Review AI conversation logs for improvements"
      />
    </div>
  );
};

export default Settings;