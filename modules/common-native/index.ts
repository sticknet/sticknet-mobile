// Reexport the native module. On web, it will be resolved to CommonNativeModule.web.ts
// and on native platforms to CommonNativeModule.ts
export {default} from './src/CommonNativeModule';
export {default as CommonNativeView} from './src/CommonNativeView';
export * from './src/CommonNative.types';
