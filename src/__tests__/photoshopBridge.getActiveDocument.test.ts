type MockDoc = { id: number; name: string; width: number; height: number; resolution: number };

let mockActiveDocument: MockDoc | null = {
  id: 1,
  name: 'Untitled-1',
  width: 1000,
  height: 1000,
  resolution: 72,
};

// app.documents is a DIFFERENT API surface than app.activeDocument. The bonus
// fallback in getActiveDocument() reads it when activeDocument is null (File > New).
let mockDocuments: MockDoc[] = [];

jest.mock(
  'photoshop',
  () => ({
    app: {
      get activeDocument() {
        return mockActiveDocument;
      },
      get documents() {
        return mockDocuments;
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
    mockDocuments = [];
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

  test('returns null when there is no active document and no open documents', async () => {
    mockActiveDocument = null;
    mockDocuments = [];

    const doc = await photoshopBridge.getActiveDocument();

    expect(doc).toBeNull();
  });

  test('BONUS: falls back to app.documents when activeDocument is null (File > New)', async () => {
    // app.activeDocument never reported the freshly-created document, but
    // app.documents (a different API surface) lists it — auto-detection should
    // still resolve dimensions from the most recently added document.
    mockActiveDocument = null;
    mockDocuments = [{ id: 5, name: 'Untitled-2', width: 800, height: 600, resolution: 72 }];
    jest.spyOn(photoshopBridge as any, 'getSelectionBounds').mockResolvedValue(null);

    const doc = await photoshopBridge.getActiveDocument();

    expect(doc).toEqual({
      id: 5,
      name: 'Untitled-2',
      width: 800,
      height: 600,
      resolution: 72,
      hasSelection: false,
    });
  });
});
