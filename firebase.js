import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDlHLCPtlITZ4ezjYWbUYA3r70BgensOl8",
  authDomain: "hehe-63f6d.firebaseapp.com",
  projectId: "hehe-63f6d",
  storageBucket: "hehe-63f6d.appspot.com",
  messagingSenderId: "54586209991",
  appId: "1:54586209991:web:ecaa663106b0160a1cb0e2",
  measurementId: "G-F190E6ZZVY"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
