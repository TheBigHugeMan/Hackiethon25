// firebaseService.js
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signOut 
} from 'firebase/auth';

/**
 * Firebase service for AI Chat Widget
 * Handles conversation history, user preferences, and reminders
 */
class FirebaseService {
  constructor(config) {
    if (!config) {
      throw new Error('Firebase configuration is required');
    }
    
    // Initialize Firebase
    this.app = initializeApp(config);
    this.db = getFirestore(this.app);
    this.auth = getAuth(this.app);
    
    // User state
    this.userId = null;
    this.isAuthenticated = false;
    
    // Setup auth state listener
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.userId = user.uid;
        this.isAuthenticated = true;
      } else {
        this.userId = null;
        this.isAuthenticated = false;
      }
    });
  }
  
  /**
   * Authenticate user (anonymously by default)
   * @returns {Promise<string>} - User ID
   */
  async authenticate() {
    if (this.isAuthenticated) {
      return this.userId;
    }
    
    try {
      const userCredential = await signInAnonymously(this.auth);
      this.userId = userCredential.user.uid;
      this.isAuthenticated = true;
      return this.userId;
    } catch (error) {
      console.error('Error authenticating:', error);
      throw error;
    }
  }
  
  /**
   * Sign out the current user
   * @returns {Promise<void>}
   */
  async signOut() {
    if (!this.isAuthenticated) {
      return;
    }
    
    try {
      await signOut(this.auth);
      this.userId = null;
      this.isAuthenticated = false;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }
  
  /**
   * Get conversation history
   * @param {number} limit - Number of messages to retrieve
   * @returns {Promise<Array>} - Array of messages
   */
  async getConversationHistory(messageLimit = 20) {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }
    
    try {
      const messagesQuery = query(
        collection(this.db, 'users', this.userId, 'messages'),
        orderBy('timestamp', 'desc'),
        limit(messageLimit)
      );
      
      const querySnapshot = await getDocs(messagesQuery);
      
      const messages = [];
      querySnapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Return in chronological order (oldest first)
      return messages.reverse();
    } catch (error) {
      console.error('Error getting conversation history:', error);
      return [];
    }
  }
  
  /**
   * Save a message to the conversation history
   * @param {Object} message - Message object with role, content, etc.
   * @returns {Promise<string>} - Document ID of the saved message
   */
  async saveMessage(message) {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }
    
    try {
      const messageWithTimestamp = {
        ...message,
        timestamp: serverTimestamp()
      };
      
      const docRef = await addDoc(
        collection(this.db, 'users', this.userId, 'messages'),
        messageWithTimestamp
      );
      
      return docRef.id;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }
  
  /**
   * Save or update user preferences
   * @param {Object} preferences - User preferences object
   * @returns {Promise<void>}
   */
  async savePreferences(preferences) {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }
    
    try {
      await setDoc(
        doc(this.db, 'users', this.userId, 'settings', 'preferences'),
        {
          ...preferences,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw error;
    }
  }
  
  /**
   * Get user preferences
   * @returns {Promise<Object>} - User preferences
   */
  async getPreferences() {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }
    
    try {
      const docSnap = await getDocs(
        doc(this.db, 'users', this.userId, 'settings', 'preferences')
      );
      
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        // Return default preferences if none exist
        return {
          assistantName: 'AI Companion',
          avatarUrl: '/default-avatar.png',
          personality: {
            template: 'cheerful',
            traits: {
              kindness: 70,
              sass: 30,
              humor: 60,
              formality: 40
            }
          }
        };
      }
    } catch (error) {
      console.error('Error getting preferences:', error);
      throw error;
    }
  }
  
  /**
   * Save a reminder
   * @param {Object} reminder - Reminder object
   * @returns {Promise<string>} - Document ID of the saved reminder
   */
  async saveReminder(reminder) {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }
    
    try {
      const reminderWithTimestamp = {
        ...reminder,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(
        collection(this.db, 'users', this.userId, 'reminders'),
        reminderWithTimestamp
      );
      
      return docRef.id;
    } catch (error) {
      console.error('Error saving reminder:', error);
      throw error;
    }
  }
  
  /**
   * Get upcoming reminders
   * @returns {Promise<Array>} - Array of upcoming reminders
   */
  async getUpcomingReminders() {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }
    
    try {
      const now = new Date();
      
      const remindersQuery = query(
        collection(this.db, 'users', this.userId, 'reminders'),
        where('date', '>=', now),
        orderBy('date', 'asc')
      );
      
      const querySnapshot = await getDocs(remindersQuery);
      
      const reminders = [];
      querySnapshot.forEach((doc) => {
        reminders.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return reminders;
    } catch (error) {
      console.error('Error getting reminders:', error);
      return [];
    }
  }
  
  /**
   * Update a reminder
   * @param {string} reminderId - ID of the reminder to update
   * @param {Object} updates - Updates to apply to the reminder
   * @returns {Promise<void>}
   */
  async updateReminder(reminderId, updates) {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }
    
    try {
      await updateDoc(
        doc(this.db, 'users', this.userId, 'reminders', reminderId),
        {
          ...updates,
          updatedAt: serverTimestamp()
        }
      );
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  }
  
  /**
   * Delete a reminder
   * @param {string} reminderId - ID of the reminder to delete
   * @returns {Promise<void>}
   */
  async deleteReminder(reminderId) {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }
    
    try {
      await deleteDoc(
        doc(this.db, 'users', this.userId, 'reminders', reminderId)
      );
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  }
}

export default FirebaseService;