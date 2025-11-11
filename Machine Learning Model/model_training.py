import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import joblib
from datetime import datetime

class ReminderSleepPredictor:
    def __init__(self):
        self.sleep_model = None
        self.wakeup_model = None
        self.priority_encoder = LabelEncoder()
        self.category_encoder = LabelEncoder()
        
    def extract_features_from_reminders(self, reminders_df):
        """Extract sleep-related features from reminder data"""
        
        features = []
        
        for _, reminder in reminders_df.iterrows():
            if reminder['date'] and reminder['time']:
                reminder_datetime = pd.to_datetime(f"{reminder['date']} {reminder['time']}")
                hour = reminder_datetime.hour
                day_of_week = reminder_datetime.dayofweek
                is_weekend = 1 if day_of_week >= 5 else 0
                is_evening = 1 if hour >= 18 else 0
                is_morning = 1 if hour >= 5 and hour <= 10 else 0
                is_late_night = 1 if hour >= 22 or hour <= 3 else 0
            else:
                hour = 12
                day_of_week = 0
                is_weekend = 0
                is_evening = 0
                is_morning = 0
                is_late_night = 0
            
            # Priority encoding
            priority_map = {'low': 0, 'medium': 1, 'high': 2}
            priority_score = priority_map.get(reminder['priority'], 1)
            
            # Category analysis
            category = reminder['category']
            is_work_related = 1 if category in ['Work', 'Finance'] else 0
            is_health_related = 1 if category == 'Health' else 0
            is_personal = 1 if category == 'Personal' else 0
            
            # Text analysis from title and description
            title = str(reminder['title']).lower()
            description = str(reminder.get('description', '')).lower()
            
            # Detect sleep-related keywords
            sleep_keywords = ['sleep', 'bed', 'wake up', 'alarm', 'rest', 'tired', 'nap']
            has_sleep_mention = any(keyword in title + description for keyword in sleep_keywords)
            
            # Detect stress-related keywords
            stress_keywords = ['urgent', 'important', 'deadline', 'meeting', 'due', 'asap']
            has_stress_mention = any(keyword in title + description for keyword in stress_keywords)
            
            # Calculate reminder density (reminders per day)
            reminder_count = len(reminders_df)
            
            feature_set = {
                'hour_of_day': hour,
                'day_of_week': day_of_week,
                'is_weekend': is_weekend,
                'is_evening': is_evening,
                'is_morning': is_morning,
                'is_late_night': is_late_night,
                'priority_score': priority_score,
                'is_work_related': is_work_related,
                'is_health_related': is_health_related,
                'is_personal': is_personal,
                'has_sleep_mention': has_sleep_mention,
                'has_stress_mention': has_stress_mention,
                'reminder_count': reminder_count,
                'title_length': len(title),
                'has_description': 1 if description.strip() else 0,
            }
            
            features.append(feature_set)
        
        return pd.DataFrame(features)
    
    def create_training_data(self, reminders_df, actual_sleep_data):
        """Combine reminder features with actual sleep data"""
        reminder_features = self.extract_features_from_reminders(reminders_df)

        training_data = pd.concat([reminder_features, actual_sleep_data], axis=1)
        return training_data
    
    def train_models(self, training_data):
        """Train sleep prediction models"""
        
        # Feature columns
        feature_cols = [col for col in training_data.columns if col not in ['sleep_duration', 'wake_up_consistency']]
        X = training_data[feature_cols]
        y_sleep = training_data['sleep_duration']
        y_wakeup = training_data['wake_up_consistency']
        
        # Train model
        self.sleep_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.sleep_model.fit(X, y_sleep)
        
        self.wakeup_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.wakeup_model.fit(X, y_wakeup)
        
        print("Models trained successfully!")
        print(f"Features used: {feature_cols}")
        
        return self
    
    def predict_from_reminders(self, reminders_data):
        """Predict sleep patterns from reminder data"""
        if self.sleep_model is None:
            raise ValueError("Model not trained yet")
        
        features_df = self.extract_features_from_reminders(reminders_data)
        
        sleep_pred = self.sleep_model.predict(features_df)[0]
        wakeup_pred = self.wakeup_model.predict(features_df)[0]
        
        return {
            'predicted_sleep_duration': round(sleep_pred, 1),
            'predicted_wakeup_consistency': round(wakeup_pred, 1),
            'features_used': len(features_df.columns),
            'reminder_count': len(reminders_data)
        }
    
    def save_models(self):
        """Save trained models"""
        joblib.dump(self.sleep_model, 'reminder_sleep_model.joblib')
        joblib.dump(self.wakeup_model, 'reminder_wakeup_model.joblib')
        print("Models saved!")

def create_enhanced_dataset():
    """Create dataset linking reminder patterns to sleep behavior"""
    
    np.random.seed(42)
    data = []
    
    for i in range(1000):
        reminder_count = np.random.poisson(8)  # Average 8 reminders
        evening_reminders = np.random.binomial(reminder_count, 0.3)  # 30% in evening
        high_priority_ratio = np.random.beta(2, 5)  # Most reminders are low/medium priority
        work_related_ratio = np.random.beta(3, 3)  # Mixed work/personal

        features = {
            'hour_of_day': np.random.randint(6, 23),
            'day_of_week': np.random.randint(0, 7),
            'is_weekend': np.random.choice([0, 1], p=[0.7, 0.3]),
            'is_evening': 1 if np.random.random() < 0.3 else 0,
            'is_morning': 1 if np.random.random() < 0.4 else 0,
            'is_late_night': 1 if np.random.random() < 0.1 else 0,
            'priority_score': np.random.choice([0, 1, 2], p=[0.4, 0.5, 0.1]),
            'is_work_related': 1 if np.random.random() < work_related_ratio else 0,
            'is_health_related': 1 if np.random.random() < 0.2 else 0,
            'is_personal': 1 if np.random.random() < 0.6 else 0,
            'has_sleep_mention': 1 if np.random.random() < 0.1 else 0,
            'has_stress_mention': 1 if np.random.random() < 0.3 else 0,
            'reminder_count': reminder_count,
            'title_length': np.random.randint(10, 50),
            'has_description': 1 if np.random.random() < 0.7 else 0,
        }
        
        # Calculating sleep patterns based on reminder behavior
        base_sleep = 7.5
        sleep_duration = base_sleep
        
        # Factors affecting sleep
        sleep_duration -= evening_reminders * 0.1  # More evening reminders = less sleep
        sleep_duration -= high_priority_ratio * 0.8  # High priority stress affects sleep
        sleep_duration -= features['has_stress_mention'] * 0.3
        sleep_duration += features['is_weekend'] * 0.5
        sleep_duration -= features['is_late_night'] * 0.4
        
        # Adding noise and bounds
        sleep_duration += np.random.normal(0, 0.5)
        sleep_duration = max(4, min(10, sleep_duration))
        
        # Wake-up consistency
        wakeup_consistency = 1.0
        wakeup_consistency += high_priority_ratio * 0.5
        wakeup_consistency += features['has_stress_mention'] * 0.3
        wakeup_consistency += (reminder_count / 20)  # More reminders = less consistent
        wakeup_consistency = max(0.5, min(3.0, wakeup_consistency))
        
        features['sleep_duration'] = round(sleep_duration, 1)
        features['wake_up_consistency'] = round(wakeup_consistency, 1)
        
        data.append(features)
    
    return pd.DataFrame(data)

if __name__ == "__main__":
    enhanced_df = create_enhanced_dataset()
    enhanced_df.to_csv('enhanced_sleep_dataset.csv', index=False)
    
    predictor = ReminderSleepPredictor()
    predictor.train_models(enhanced_df)
    predictor.save_models()
    
    print("Enhanced model trained and ready!")