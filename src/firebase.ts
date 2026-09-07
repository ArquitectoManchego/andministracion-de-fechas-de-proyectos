import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { Project, Task, Resource, SpecialEvent } from './types';

export const firebaseConfig = {
  apiKey: "AIzaSyAj84Ru4DXZRs0h3QEbJm0akTKsQtcf-gM",
  authDomain: "studio-9900268407-536d0.firebaseapp.com",
  projectId: "studio-9900268407-536d0",
  storageBucket: "studio-9900268407-536d0.firebasestorage.app",
  messagingSenderId: "300483743417",
  appId: "1:300483743417:web:a068f756cc48336bd99568"
};

// Inicialización de Firebase
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

export interface CloudProjectData {
  projects: Project[];
  tasks: Task[];
  resources: Resource[];
  specialEvents: SpecialEvent[];
  lastUpdated?: string;
  updatedBy?: string;
}

const DOCUMENT_PATH = ['projectmaster', 'main_schedule'] as const;

/**
 * Guarda los datos en la base de datos de Firebase Firestore en tiempo real.
 */
export async function saveToFirebase(data: CloudProjectData): Promise<void> {
  try {
    const docRef = doc(db, DOCUMENT_PATH[0], DOCUMENT_PATH[1]);
    await setDoc(docRef, {
      ...data,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Error al guardar en Firebase:', error);
    throw error;
  }
}

/**
 * Obtiene los datos de Firebase una sola vez.
 */
export async function getFromFirebase(): Promise<CloudProjectData | null> {
  try {
    const docRef = doc(db, DOCUMENT_PATH[0], DOCUMENT_PATH[1]);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as CloudProjectData;
    }
    return null;
  } catch (error) {
    console.error('Error al cargar de Firebase:', error);
    return null;
  }
}

/**
 * Escucha cambios en tiempo real desde Firebase para sincronizar entre celular, laptop y otros dispositivos.
 */
export function subscribeToFirebase(callback: (data: CloudProjectData) => void): () => void {
  const docRef = doc(db, DOCUMENT_PATH[0], DOCUMENT_PATH[1]);
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data() as CloudProjectData;
      callback(data);
    }
  }, (err) => {
    console.warn('Error en suscripción Firebase:', err);
  });
}
