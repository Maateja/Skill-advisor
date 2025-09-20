// firestore_service.js
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { app } from "./firebase-init.js"; // Assuming you will create a separate init file

const db = getFirestore(app);

// Function to save user data
export const saveUserData = async (userId, email) => {
    try {
        await setDoc(doc(db, "users", userId), {
            email: email,
            createdAt: new Date()
        });
        console.log("User data saved successfully!");
    } catch (e) {
        console.error("Error adding document: ", e);
    }
};