import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Axios from 'axios';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Button from '@mui/material/Button';
import './profile.css';

function Profile() {
    const { id } = useParams();
    const [userDetails, setUserDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        fname: '',
        lname: '',
        birthday: new Date().toISOString().slice(0, 10),
        city: '',
        state: '',
        zip: ''
    });

    // GET API call for fetching current user information
    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                const res = await Axios.get(`/api/user/profile/${id}`);
                setUserDetails(res.data);
                setFormData(prevState => ({
                    ...prevState,
                    fname: res.data.fname || '',
                    lname: res.data.lname || '',
                    birthday: res.data.birthday.slice(0, 10), // Ensure the date is in yyyy-mm-dd format
                    city: res.data.city || '',
                    state: res.data.state || '',
                    zip: res.data.zip || ''
                }));
                setLoading(false);
            } catch (error) {
                console.error('Error fetching user details:', error);
                setLoading(false);
            }
        };

        fetchUserDetails();
    }, [id]);

    const handleEditToggle = () => {
        setEditMode(!editMode);
    };

    // PUT API call for updating profile information
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.fname || !formData.lname || !formData.city || !formData.state || !formData.zip) {
            alert('All fields are required.');
            return;
        }

        if (!/^[a-zA-Z]+$/.test(formData.fname)) {
            alert('First name must contain only letters.');
            return;
        }

        if (!/^[a-zA-Z]+$/.test(formData.lname)) {
            alert('Last name must contain only letters.');
            return;
        }

        if (!/^\d{5}$/.test(formData.zip)) {
            alert('Zip code must be exactly 5 digits.');
            return;
        }

        try {
            await Axios.put(`/api/user/profile/${id}`, formData);
            setEditMode(false);
            window.location.reload();
        } catch (error) {
            console.error('Error updating user details:', error);
        }
    };

    const handleInputChange = (key, value) => {
        setFormData(prevState => ({
            ...prevState,
            [key]: value,
        }));
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (!userDetails) {
        return <div className="not-found">User not found</div>;
    }

    return (
        <div className="profile-container">
            <div className="profile-button-container">
                <div className="back-button-container">
                    <Link to="/home"><Button variant="text" className="back-button" startIcon={<ArrowBackIcon />}>Back</Button></Link>
                </div>
                <div className="edit-button-container">
                    <button className="editbutton-txt" onClick={handleEditToggle}>{editMode ? 'Cancel' : 'Edit'}</button>
                </div>
            </div>

            <form className="profile-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>First Name</label>
                    <input
                        type="text"
                        value={formData.fname}
                        onChange={(e) => handleInputChange('fname', e.target.value)}
                        disabled={!editMode}
                        required
                        pattern="[A-Za-z]*"
                        title="First name must contain only letters."
                    />
                </div>

                <div className="form-group">
                    <label>Last Name</label>
                    <input
                        type="text"
                        value={formData.lname}
                        onChange={(e) => handleInputChange('lname', e.target.value)}
                        disabled={!editMode}
                        required
                        pattern="[A-Za-z]*"
                        title="Last name must contain only letters."
                    />
                </div>

                <div className="form-group">
                    <label>Birthday</label>
                    <input
                        type="date"
                        value={formData.birthday}
                        onChange={(e) => handleInputChange('birthday', e.target.value)}
                        disabled={!editMode}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>City</label>
                    <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        disabled={!editMode}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>State</label>
                    <select
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        disabled={!editMode}
                        required
                    >
                        <option value="">Select State</option>
                        <option value="AL">Alabama (AL)</option>
                        <option value="AK">Alaska (AK)</option>
                        <option value="AZ">Arizona (AZ)</option>
                        <option value="AR">Arkansas (AR)</option>
                        <option value="CA">California (CA)</option>
                        <option value="CO">Colorado (CO)</option>
                        <option value="CT">Connecticut (CT)</option>
                        <option value="DE">Delaware (DE)</option>
                        <option value="FL">Florida (FL)</option>
                        <option value="GA">Georgia (GA)</option>
                        <option value="HI">Hawaii (HI)</option>
                        <option value="ID">Idaho (ID)</option>
                        <option value="IL">Illinois (IL)</option>
                        <option value="IN">Indiana (IN)</option>
                        <option value="IA">Iowa (IA)</option>
                        <option value="KS">Kansas (KS)</option>
                        <option value="KY">Kentucky (KY)</option>
                        <option value="LA">Louisiana (LA)</option>
                        <option value="ME">Maine (ME)</option>
                        <option value="MD">Maryland (MD)</option>
                        <option value="MA">Massachusetts (MA)</option>
                        <option value="MI">Michigan (MI)</option>
                        <option value="MN">Minnesota (MN)</option>
                        <option value="MS">Mississippi (MS)</option>
                        <option value="MO">Missouri (MO)</option>
                        <option value="MT">Montana (MT)</option>
                        <option value="NE">Nebraska (NE)</option>
                        <option value="NV">Nevada (NV)</option>
                        <option value="NH">New Hampshire (NH)</option>
                        <option value="NJ">New Jersey (NJ)</option>
                        <option value="NM">New Mexico (NM)</option>
                        <option value="NY">New York (NY)</option>
                        <option value="NC">North Carolina (NC)</option>
                        <option value="ND">North Dakota (ND)</option>
                        <option value="OH">Ohio (OH)</option>
                        <option value="OK">Oklahoma (OK)</option>
                        <option value="OR">Oregon (OR)</option>
                        <option value="PA">Pennsylvania (PA)</option>
                        <option value="RI">Rhode Island (RI)</option>
                        <option value="SC">South Carolina (SC)</option>
                        <option value="SD">South Dakota (SD)</option>
                        <option value="TN">Tennessee (TN)</option>
                        <option value="TX">Texas (TX)</option>
                        <option value="UT">Utah (UT)</option>
                        <option value="VT">Vermont (VT)</option>
                        <option value="VA">Virginia (VA)</option>
                        <option value="WA">Washington (WA)</option>
                        <option value="WV">West Virginia (WV)</option>
                        <option value="WI">Wisconsin (WI)</option>
                        <option value="WY">Wyoming (WY)</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Zip Code</label>
                    <input
                        type="text"
                        value={formData.zip}
                        onChange={(e) => handleInputChange('zip', e.target.value)}
                        disabled={!editMode}
                        required
                        pattern="\d{5}"
                        title="Zip code must be exactly 5 digits."
                    />
                </div>

                {editMode && (
                    <button type="submit" className="save-button">Save</button>
                )}
            </form>
        </div>
    );
}

export default Profile;
