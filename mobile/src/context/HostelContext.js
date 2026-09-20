import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'selectedHostelId';
const HostelContext = createContext();

export const useHostel = () => {
  const context = useContext(HostelContext);
  if (!context) throw new Error('useHostel must be used within HostelProvider');
  return context;
};

export const HostelProvider = ({ children }) => {
  const { user } = useAuth();
  const [selectedHostelId, setSelectedHostelIdState] = useState(null);
  const [hostels, setHostels] = useState([]);

  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    (async () => {
      if (isSuperAdmin) {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        setSelectedHostelIdState(saved || null);
      } else if (user) {
        setSelectedHostelIdState(null);
      }
    })();
  }, [isSuperAdmin, user]);

  useEffect(() => {
    if (!isSuperAdmin) {
      setHostels([]);
      return;
    }
    api
      .get('/api/hostels')
      .then((res) => setHostels((res.data || []).filter((h) => h.status === 'active')))
      .catch(() => setHostels([]));
  }, [isSuperAdmin]);

  const setSelectedHostelId = async (id) => {
    if (id) {
      await AsyncStorage.setItem(STORAGE_KEY, String(id));
      setSelectedHostelIdState(String(id));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setSelectedHostelIdState(null);
    }
  };

  return (
    <HostelContext.Provider
      value={{
        selectedHostelId,
        setSelectedHostelId,
        hostels,
        isSuperAdmin,
        selectedHostel:
          hostels.find((h) => String(h.id) === String(selectedHostelId)) || null,
      }}
    >
      {children}
    </HostelContext.Provider>
  );
};
