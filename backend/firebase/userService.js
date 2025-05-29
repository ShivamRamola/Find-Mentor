import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./config"; // adjust if config is in a different folder

export const setUserInFirestore = async (user, role = "student") => {
  if (!user) return;

  const userRef = doc(db, "users", user.uid);

  await setDoc(userRef, {
    uid: user.uid,
    name: user.displayName || "Unnamed",
    email: user.email,
    role: role,
    photoURL: user.photoURL || "",
    online: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};
