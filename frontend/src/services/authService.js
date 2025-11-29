import api from './api';

export const authService = {
  async login(email, password) {
    try {
    // Create FormData for OAuth2PasswordRequestForm
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    console.log('Login response:', response.data);
    
    // Store the token
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw new Error(error.response?.data?.detail || 'Login failed');
  }
},

  async register(userData) {
    try {
      // Transform the data to match backend expectations
      const response = await api.post('/auth/register', {
        full_name: userData.fullName || userData.name,
        email: userData.email,
        password: userData.password,
      });
      return response.data;
    } catch (error) {
      // FastAPI returns errors in 'detail' field
      const errorMessage = error.response?.data?.detail;
      
      // If detail is an array (validation errors), extract the message
      if (Array.isArray(errorMessage)) {
        throw new Error(errorMessage.map(err => err.msg).join(', '));
      }
      
      throw new Error(errorMessage || 'Registration failed');
    }
  },

  async verifyToken(token) {
    try {
      const response = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw new Error('Token verification failed');
    }
  },

  async forgotPassword(email) {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Request failed');
    }
  },

  async resetPassword(token, newPassword) {
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Password reset failed');
    }
  },

  logout() {
    localStorage.removeItem('token');
  },
};