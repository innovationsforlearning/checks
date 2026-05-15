import { vi, afterEach } from 'vitest';

export function mockGetUserMedia(impl) {
  if (!navigator.mediaDevices) {
    Object.defineProperty(navigator, 'mediaDevices', { value: {}, configurable: true });
  }
  navigator.mediaDevices.getUserMedia = vi.fn(impl);
  return navigator.mediaDevices.getUserMedia;
}

export function fakeMediaStream({ kind = 'video', readyState = 'live' } = {}) {
  const track = {
    kind,
    readyState,
    stop: vi.fn(),
    onended: null,
  };
  const stream = {
    getTracks: () => [track],
    getAudioTracks: () => (kind === 'audio' ? [track] : []),
    getVideoTracks: () => (kind === 'video' ? [track] : []),
  };
  return { stream, track };
}

export function mockAudioContext() {
  const ctxInstances = [];
  const FakeAudioContext = vi.fn(function () {
    const inst = {
      state: 'running',
      currentTime: 0,
      destination: {},
      resume: vi.fn().mockResolvedValue(),
      close: vi.fn(),
      createOscillator: vi.fn(() => ({
        type: '',
        frequency: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      })),
      createGain: vi.fn(() => ({
        gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), value: 0 },
        connect: vi.fn(),
      })),
      createMediaStreamSource: vi.fn(() => ({ connect: vi.fn() })),
      createAnalyser: vi.fn(() => ({
        fftSize: 0,
        smoothingTimeConstant: 0,
        frequencyBinCount: 128,
        connect: vi.fn(),
        getByteTimeDomainData: vi.fn((arr) => arr.fill(128)),
        getByteFrequencyData: vi.fn((arr) => arr.fill(0)),
      })),
      onstatechange: null,
    };
    ctxInstances.push(inst);
    return inst;
  });
  window.AudioContext = FakeAudioContext;
  window.webkitAudioContext = FakeAudioContext;
  return { FakeAudioContext, ctxInstances };
}

export function mockRTCPeerConnection({ candidates = [] } = {}) {
  const created = [];
  window.RTCPeerConnection = vi.fn(function () {
    const inst = {
      onicecandidate: null,
      createDataChannel: vi.fn(),
      createOffer: vi.fn().mockResolvedValue({}),
      setLocalDescription: vi.fn().mockResolvedValue(),
      close: vi.fn(),
      fireCandidates() {
        candidates.forEach((c) => this.onicecandidate?.({ candidate: c }));
        this.onicecandidate?.({ candidate: null });
      },
    };
    created.push(inst);
    return inst;
  });
  return created;
}

export function mockFetch(responder) {
  const fn = vi.fn(responder);
  global.fetch = fn;
  return fn;
}

export function makeCtx(overrides = {}) {
  const body = document.createElement('div');
  body.id = 'test-body';
  document.body.appendChild(body);
  // Stale bodies left in document.body cause jsdom's querySelector('#id') to
  // return null on later bodies that reuse the same id. Tear down after the
  // test that allocated this ctx — keeps lifecycle co-located with the allocator.
  afterEach(() => body.remove());
  const ctx = {
    body,
    touchSupported: false,
    markResult: vi.fn(),
    advance: vi.fn(),
    setStatus: vi.fn(),
    setButtons: vi.fn(),
    addCleanup: vi.fn(),
    addStream: vi.fn(),
    addAudioContext: vi.fn(),
    addListener: vi.fn(),
    ...overrides,
  };
  return ctx;
}

export function flushPromises() {
  // Microtask-based so it works under vi.useFakeTimers() (setTimeout would
  // never fire). Three awaits drain typical chained awaits like
  // `await getUserMedia().then(...)` where each `.then` adds a microtask hop.
  return Promise.resolve().then(() => Promise.resolve()).then(() => Promise.resolve());
}
