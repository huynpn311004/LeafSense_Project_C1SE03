import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';

export const analyzeLeafImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('token');
    
    const headers = {
        'Content-Type': 'multipart/form-data',
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
        const response = await axios.post(`${BASE_URL}/prediction/analyze`, formData, {
            headers: headers,
        });
        
        return response.data;
    } catch (error) {
        throw new Error('Failed to analyze image');
    }
};