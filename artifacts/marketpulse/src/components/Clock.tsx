import { useEffect, useState } from 'react';

export default function Clock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const ny  = now.toLocaleTimeString('en-US', { hour12: false, timeZone: 'America/New_York' });
      const ist = now.toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' });
      setTime(`NY ${ny} · IST ${ist}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return <div className="clock-text">{time}</div>;
}
