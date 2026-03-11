// Stub for react-native codegenNativeComponent used by react-native-svg fabric modules.
// In a jsdom/web test environment these native components are never instantiated,
// so we return a simple string component name that React can render as a DOM element.
export default function codegenNativeComponent(name) {
  return name;
}
