module.exports = {
  initUmbraWasm: jest.fn().mockResolvedValue({}),
  getWasm: jest.fn().mockReturnValue(null),
  isWasmReady: jest.fn().mockReturnValue(false),
  eventBridge: {
    connect: jest.fn(),
    onAll: jest.fn(),
    disconnect: jest.fn(),
  },
};
