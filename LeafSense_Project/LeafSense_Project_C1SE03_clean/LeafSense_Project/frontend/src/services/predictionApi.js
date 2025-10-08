import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';

export const analyzeLeafImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await axios.post(`${BASE_URL}/prediction/analyze`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        throw new Error('Failed to analyze image');
    }
};