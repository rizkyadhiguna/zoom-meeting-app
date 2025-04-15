import CreateMeetingForm from '../../components/create-meeting-component';
import React from 'react';

const CreatePage: React.FC = () => {
  return (
    <div>
      <h1>Create a New Zoom Meeting</h1>
      <CreateMeetingForm />
    </div>
  );
};

export default CreatePage;