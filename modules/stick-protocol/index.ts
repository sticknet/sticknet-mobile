// Reexport the native module. On web, it will be resolved to StickProtocolModule.web.ts
// and on native platforms to StickProtocolModule.ts
export {default} from './src/StickProtocolModule';
export {default as StickProtocolView} from './src/StickProtocolView';
export * from './src/StickProtocol.types';
