"use client";

import React, { useState, FormEvent } from 'react';

interface CreateMeetingFormProps {}

interface CreateMeetingResponse {
  id: number;
  uuid: string;
  host_id: string;
  join_url: string;
  start_url: string;
  topic: string;
  start_time: string;
  duration: number;
  timezone: string;
  created_at: string;
  password?: string;
  h323_password?: string;
  pmi?: number;
  type?: number;
  status?: string;
  encrypted_password?: string;
  settings?: Record<string, any>;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

const CreateMeetingForm: React.FC<CreateMeetingFormProps> = () => {
  const [topic, setTopic] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [timezone, setTimezone] = useState('UTC');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/create-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          start_time: startTime,
          duration: duration,
          timezone,
          password,
        }),
      });

      const data: CreateMeetingResponse | ErrorResponse = await response.json();

      if (response.ok) {
        const meetingData = data as CreateMeetingResponse;
        setMessage(`Meeting created successfully! Join URL: ${meetingData.join_url}`);
        setTopic('');
        setStartTime('');
        setDuration(60);
        setTimezone('UTC');
        setPassword('');
      } else {
        const errorData = data as ErrorResponse;
        setMessage(`Failed to create meeting: ${errorData.error || response.statusText}${errorData.details ? ` - ${errorData.details}` : ''}`);
      }
    } catch (error: any) {
      console.error('Frontend error creating meeting:', error);
      setMessage(`An unexpected error occurred: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Create New Zoom Meeting</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="topic">Topic:</label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="startTime">Start Time:</label>
          <input
            type="datetime-local"
            id="startTime"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="duration">Duration (minutes):</label>
          <input
            type="number"
            id="duration"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            required
          />
        </div>
        <div>
          <label htmlFor="timezone">Timezone:</label>
          <input
            type="text"
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password (optional):</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Meeting'}
        </button>
        {message && <p>{message}</p>}
      </form>
    </div>
  );
};

export default CreateMeetingForm;