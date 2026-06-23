import { ref, getStorage, uploadBytes, getDownloadURL } from "firebase/storage";
import firebaseApp from "../config/firebase-config";

export const uploadFilesToFirebaseAndReturnUrls = async (files: any[]) => {
  try {
    const storageRef = ref(getStorage(firebaseApp), "images");

    const uploadedFilesRefs = await Promise.all(
      files.map((file) => {
        // Prefix with a unique id so two users uploading the same filename
        // don't collide and overwrite each other's images.
        const fileRef = ref(storageRef, `${crypto.randomUUID()}-${file.name}`);
        return uploadBytes(fileRef, file);
      })
    );

    const urls = await Promise.all(
      uploadedFilesRefs.map((fileRef: any) => getDownloadURL(fileRef.ref))
    );

    return urls;
  } catch (error: any) {
    throw new Error(error);
  }
};
