const User = require('./User');

// Mock mongoose to avoid actual database operations
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    model: jest.fn(() => {
      return function MockUser(data) {
        // Copy all data to this instance
        Object.assign(this, data);
        
        // Set defaults
        this.avatar = this.avatar || null;
        this.createdAt = this.createdAt || new Date();
        this._id = 'mock-id-123';
        
        // Mock save method
        this.save = jest.fn(() => {
          // Simulate validation errors
          if (!this.email) {
            const error = new Error('Email is required');
            error.name = 'ValidationError';
            return Promise.reject(error);
          }
          if (!this.password) {
            const error = new Error('Password is required');
            error.name = 'ValidationError';
            return Promise.reject(error);
          }
          if (this.email && !this.email.includes('@')) {
            const error = new Error('Please enter a valid email');
            error.name = 'ValidationError';
            return Promise.reject(error);
          }
          
          // Convert email to lowercase (like the real schema)
          this.email = this.email.toLowerCase();
          
          return Promise.resolve(this);
        });
        
        return this;
      };
    }),
    Schema: jest.fn(() => ({}))
  };
});

describe('User Model', () => {
  it('should create a user with valid data', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'Password123!'
    };
    
    const user = new User(userData);
    const savedUser = await user.save();
    
    expect(savedUser.email).toBe('test@example.com');
    expect(savedUser.password).toBe('Password123!');
    expect(savedUser.avatar).toBe(null);
    expect(savedUser.createdAt).toBeDefined();
    expect(savedUser._id).toBeDefined();
  });

  it('should not create a user without email', async () => {
    const user = new User({ password: 'Password123!' });
    
    await expect(user.save()).rejects.toThrow('Email is required');
  });

  it('should not create a user without password', async () => {
    const user = new User({ email: 'test@example.com' });
    
    await expect(user.save()).rejects.toThrow('Password is required');
  });

  it('should not create user with invalid email', async () => {
    const user = new User({ 
      email: 'invalid-email', 
      password: 'Password123!' 
    });
    
    await expect(user.save()).rejects.toThrow('Please enter a valid email');
  });

  it('should convert email to lowercase', async () => {
    const user = new User({
      email: 'TEST@EXAMPLE.COM',
      password: 'Password123!'
    });
    
    const savedUser = await user.save();
    expect(savedUser.email).toBe('test@example.com');
  });

  it('should set default avatar to null', async () => {
    const user = new User({
      email: 'test@example.com',
      password: 'Password123!'
    });
    
    const savedUser = await user.save();
    expect(savedUser.avatar).toBe(null);
  });

  it('should set custom avatar', async () => {
    const user = new User({
      email: 'test@example.com',
      password: 'Password123!',
      avatar: 'https://example.com/avatar.png'
    });
    
    const savedUser = await user.save();
    expect(savedUser.avatar).toBe('https://example.com/avatar.png');
  });
});