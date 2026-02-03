# 2XG Expense Mobile App

React Native mobile app for quick expense entry.

## Features

- Phone + 4-digit PIN login
- Camera capture for receipts
- Numeric keypad for amount entry
- Category selection with icons
- Payment method selection
- Auto-approval for expenses under ₹2000

## Setup

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure API URL

Edit `src/services/api.ts` and update the API_BASE_URL:

```typescript
// For local development, use your computer's IP address
const API_BASE_URL = __DEV__
  ? 'http://YOUR_LOCAL_IP:5000/api'  // e.g., http://192.168.1.100:5000/api
  : 'https://api.erp.2xg.in/api';
```

### 3. Run in Development

```bash
# Start Expo
npm start

# Then scan QR code with Expo Go app on your phone
```

## Building APK

### Option 1: Using EAS Build (Recommended)

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login to Expo:
```bash
eas login
```

3. Configure project (first time only):
```bash
eas build:configure
```

4. Build APK:
```bash
eas build --platform android --profile preview
```

### Option 2: Local Build (Requires Android Studio)

1. Eject from Expo:
```bash
npx expo prebuild
```

2. Build with Gradle:
```bash
cd android
./gradlew assembleRelease
```

APK will be in `android/app/build/outputs/apk/release/`

## Database Setup

Run this SQL in your Supabase to create the mobile users table:

```sql
-- Create mobile_users table
CREATE TABLE IF NOT EXISTS mobile_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(15) NOT NULL UNIQUE,
  pin VARCHAR(4) NOT NULL,
  employee_name VARCHAR(255) NOT NULL,
  employee_id VARCHAR(50),
  branch VARCHAR(100) DEFAULT 'Head Office',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add sample users
INSERT INTO mobile_users (phone_number, pin, employee_name, branch) VALUES
  ('9876543210', '1234', 'Admin User', 'Head Office'),
  ('9876543211', '1234', 'Field Staff 1', 'Branch 1');

NOTIFY pgrst, 'reload schema';
```

## Adding New Users

Use the API endpoint:

```bash
curl -X POST https://api.erp.2xg.in/api/mobile-auth/users \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "9876543210",
    "pin": "1234",
    "employee_name": "John Doe",
    "branch": "Head Office"
  }'
```

## App Flow

1. **Login** → Phone + PIN
2. **Capture** → Camera / Gallery / Skip
3. **Amount** → Numeric keypad
4. **Category** → Icon grid (6 categories)
5. **Payment** → Cash / UPI / Card / Bank
6. **Review** → Confirm & Submit
7. **Success** → Shows approval status
