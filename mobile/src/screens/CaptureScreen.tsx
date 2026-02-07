import React, { useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Vibration,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList, AuthContext } from '../../App';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Capture'>;
};

export default function CaptureScreen({ navigation }: Props) {
  const { user, logout } = useContext(AuthContext);

  const takePhoto = async () => {
    Vibration.vibrate(10);

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera access is needed to capture receipts. Please enable it in Settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        navigation.navigate('Amount', { imageUri: result.assets[0].uri });
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      Alert.alert('Error', error.message || 'Failed to open camera. Please try again.');
    }
  };

  const pickFromGallery = async () => {
    Vibration.vibrate(10);

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Gallery access is needed to select receipts. Please enable it in Settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        navigation.navigate('Amount', { imageUri: result.assets[0].uri });
      }
    } catch (error: any) {
      console.error('Gallery error:', error);
      Alert.alert('Error', error.message || 'Failed to open gallery. Please try again.');
    }
  };

  const skipCapture = () => {
    Vibration.vibrate(10);
    navigation.navigate('Amount', { imageUri: undefined });
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.userName}>{user?.employee_name || 'User'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Add Expense</Text>
        <Text style={styles.subtitle}>Take a photo of your receipt</Text>

        {/* Camera Button */}
        <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
          <Text style={styles.cameraIcon}>📷</Text>
        </TouchableOpacity>

        {/* Gallery Button */}
        <TouchableOpacity style={styles.galleryButton} onPress={pickFromGallery}>
          <Text style={styles.galleryIcon}>🖼️</Text>
          <Text style={styles.galleryText}>Choose from Gallery</Text>
        </TouchableOpacity>

        {/* Skip Option */}
        <TouchableOpacity onPress={skipCapture} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip - No receipt</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  logoutText: {
    color: '#DC2626',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 48,
  },
  cameraButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cameraIcon: {
    fontSize: 40,
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  galleryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  galleryText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  skipButton: {
    marginTop: 24,
  },
  skipText: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'underline',
  },
});
