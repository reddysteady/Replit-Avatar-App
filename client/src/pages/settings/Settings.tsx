import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();

  // Redirect to AI Settings as the default sub-page according to menu architecture
  useEffect(() => {
    navigate('/settings/ai', { replace: true });
  }, [navigate]);

  return null; // This will redirect immediately to /settings/ai
};

export default Settings;