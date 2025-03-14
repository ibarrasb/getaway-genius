import React, { useState } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import './detailed.css';

function AddActivity({ addActivity, removeActivity, activities }) {
    const [activity, setActivity] = useState('');

    const handleChange = (e) => {
        setActivity(e.target.value);
    };

    const handleAddActivity = () => {
        if (activity.trim() !== '') {
            addActivity(activity.trim());
            setActivity('');
        }
    };

    const handleRemoveActivity = (index) => {
        removeActivity(index);
    };

    return (
        <div className="add-activity-container">
        <div className="activity-input">
            <TextField
                id="activity"
                label="Add Note"
                variant="outlined"
                value={activity}
                onChange={handleChange}
                fullWidth
            />
            <Button variant="contained" color="primary" onClick={handleAddActivity}>
                Add
            </Button>
            </div>
            <div className="activity-list">
            {activities.map((activity, index) => (
                <div key={index} className="activity-item">
                    {activity}
                    <Button variant="outlined" size="small" onClick={() => handleRemoveActivity(index)}>Remove</Button>
                </div>
            ))}
        </div>
        </div>
    );
}

export default AddActivity;
