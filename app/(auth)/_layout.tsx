import { Slot } from 'expo-router';
import { dbg } from '@/utils/debug';

export default function AuthLayout() {
  if (__DEV__) dbg.trackRender('AuthLayout');
  return <Slot />;
}
