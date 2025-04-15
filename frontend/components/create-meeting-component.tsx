"use client";

import React, { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  TextField,
  Button,
  Typography,
  Container,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';

interface CreateMeetingFormProps { }

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
  const [startTime, setStartTime] = useState<Dayjs | null>(dayjs());
  const [duration, setDuration] = useState<number | string>(60);
  const [timezone, setTimezone] = useState('UTC');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  let response: Response | undefined;

  useEffect(() => {
    const authSuccess = searchParams?.get('auth');
    if (authSuccess === 'success') {
      setMessage('Zoom authentication successful! You can now create a meeting.');
    }
  }, [searchParams]);

  const handleConnectZoom = () => {
    window.location.href = '/api/zoom/auth';
  };

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
          start_time: startTime?.toISOString(), // Convert Dayjs to ISO string
          duration: parseInt(duration.toString(), 10),
          timezone,
          password,
        }),
      });

      const data: CreateMeetingResponse | ErrorResponse = await response.json();

      if (response.ok) {
        const meetingData = data as CreateMeetingResponse;
        setMessage(`Meeting created successfully! Join URL: ${meetingData.join_url}`);
        setTopic('');
        setStartTime(dayjs());
        setDuration(60);
        setTimezone('UTC');
        setPassword('');
      } else {
        const errorData = data as ErrorResponse;
        setMessage(`Failed to create meeting: <span class="math-inline">\{errorData\.error \|\| response\.statusText\}</span>{errorData.details ?  - ${errorData.details} : ''}`);
      }
    } catch (error: any) {
      console.error('Frontend error creating meeting:', error);
      setMessage(`An unexpected error occurred: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Create New Zoom Meeting
        </Typography>

        {message && (
          <Alert severity={response?.ok ? 'success' : 'error'} sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        <Button variant="contained" color="primary" onClick={handleConnectZoom} sx={{ mb: 2 }}>
          Connect to Zoom
        </Button>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Topic"
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            margin="normal"
          />

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateTimePicker
              label="Start Time"
              value={startTime}
              onChange={(newValue) => setStartTime(newValue)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  margin: 'normal',
                  required: true,
                },
              }}
            />
          </LocalizationProvider>

          <FormControl fullWidth margin="normal">
            <InputLabel id="duration-label">Duration (minutes)</InputLabel>
            <Select
              labelId="duration-label"
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              label="Duration (minutes)"
            >
              <MenuItem value={30}>30</MenuItem>
              <MenuItem value={60}>60</MenuItem>
              <MenuItem value={90}>90</MenuItem>
              <MenuItem value={120}>120</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Timezone"
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            defaultValue="UTC"
            margin="normal"
          />

          <TextField
            fullWidth
            label="Password (optional)"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              endIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Creating...' : 'Create Meeting'}
            </Button>
          </Box>
        </form>
      </Box>
    </Container>
  );
};

export default CreateMeetingForm;