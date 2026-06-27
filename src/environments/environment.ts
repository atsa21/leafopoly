import { FirebaseOptions } from 'firebase/app';

export const environment = {
  production: false,
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  } satisfies FirebaseOptions,
};
