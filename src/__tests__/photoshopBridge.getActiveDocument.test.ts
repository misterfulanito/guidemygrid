let mockActiveDocument: { id: number; name: string; width: number; height: number; resolution: number } | null = {
  id: 1,
  name: 'Untitled-1',
  width: 1000,
  height: 1000,
  resolution: 72,
};

jest.mock(
  'photoshop',
  () => ({
    app: {
      get activeDocument() {
        return mockActiveDocument;
      },
    },
    core: {
      executeAsModal: jest.fn(),
    },
    action: {
      batchPlay: jest.fn(),
      addNotificationListener: jest.fn(),
      removeNotificationListener: jest.fn(),
    },
  }),
  { virtual: true }
);

import { photoshopBridge } from '../services/photoshopBridge';

describe('photoshopBridge.getActiveDocument', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    mockActiveDocument = {
      id: 1,
      name: 'Untitled-1',
      width: 1000,
      height: 1000,
      resolution: 72,
    };
  });

  test('resolves a non-null document with hasSelection:false when getSelectionBounds() rejects (modal-scope timing failure)', async () => {
    jest
      .spyOn(photoshopBridge as any, 'getSelectionBounds')
      .mockRejectedValue(new Error('executeAsModal: modal scope not available'));

    const doc = await photoshopBridge.getActiveDocument();

    expect(doc).toEqual({
      id: 1,
      name: 'Untitled-1',
      width: 1000,
      height: 1000,
      resolution: 72,
      hasSelection: false,
    });
  });

  test('returns hasSelection:true when getSelectionBounds() resolves to bounds', async () => {
    jest.spyOn(photoshopBridge as any, 'getSelectionBounds').mockResolvedValue({
      top: 0,
      left: 0,
      bottom: 1000,
      right: 1000,
      width: 1000,
      height: 1000,
    });

    const doc = await photoshopBridge.getActiveDocument();

    expect(doc?.hasSelection).toBe(true);
  });

  test('returns null when there is no active document', async () => {
    mockActiveDocument = null;

    const doc = await photoshopBridge.getActiveDocument();

    expect(doc).toBeNull();
  });
});
