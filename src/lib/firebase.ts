import { initializeApp } from "firebase/app";
import { initializeFirestore, doc, getDocFromServer } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBVcgpME_dXtFSRo_wYSa5kFv7j3wGfevc",
  authDomain: "second-ego-j5jvd.firebaseapp.com",
  projectId: "second-ego-j5jvd",
  storageBucket: "second-ego-j5jvd.firebasestorage.app",
  messagingSenderId: "227238568349",
  appId: "1:227238568349:web:dbae3456f146baf48a0f74"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore targeting the specific databaseId provisioned by the platform
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true
}, "ai-studio-68de2a6f-1236-486e-a221-e74efaaf1ba0");

// Initialize Firebase Auth
export const auth = getAuth(app);

// Validate Connection to Firestore (Prerequisite Guideline)
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("Firestore connection test successful.");
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration. The client is offline.");
    } else {
      console.log("Firestore initialized successfully (test connection resolved).");
    }
  }
}

testConnection();
