import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import webrtc from '../../src/stages/webrtc.js';
import { makeCtx, mockRTCPeerConnection, flushPromises } from '../helpers/mock-globals.js';

describe('webrtc stage', () => {
  let ctx;
  let originalRTC;
  beforeEach(() => {
    vi.useFakeTimers();
    originalRTC = window.RTCPeerConnection;
    ctx = makeCtx();
  });
  afterEach(() => {
    window.RTCPeerConnection = originalRTC;
  });

  it('exports the expected metadata', () => {
    expect(webrtc.id).toBe('webrtc');
    expect(typeof webrtc.run).toBe('function');
  });

  it('mounts the diag summary and a skip button before any probing', () => {
    mockRTCPeerConnection();
    webrtc.run(ctx);
    expect(ctx.body.querySelector('#diag-rtc')).not.toBeNull();
    const initialButtons = ctx.setButtons.mock.calls[0][0];
    expect(initialButtons[0].label).toBe('Skip');
  });

  it('marks fail when RTCPeerConnection is not supported', () => {
    delete window.RTCPeerConnection;
    webrtc.run(ctx);
    expect(ctx.markResult).toHaveBeenCalledWith('fail', 'WebRTC not supported');
    expect(ctx.body.querySelector('#diag-title').textContent).toBe(
      "Video calls aren't supported",
    );
  });

  it('marks pass when an srflx candidate arrives', async () => {
    const created = mockRTCPeerConnection({
      candidates: [{ candidate: 'candidate:1 1 udp 1234 1.2.3.4 5678 typ srflx' }],
    });
    webrtc.run(ctx);
    await flushPromises();
    created[0].fireCandidates();
    expect(ctx.markResult).toHaveBeenCalledWith('pass', expect.stringContaining('STUN reachable'));
  });

  it('marks fail when the STUN probe times out without srflx', async () => {
    const created = mockRTCPeerConnection({
      candidates: [{ candidate: 'candidate:1 1 udp 1234 192.168.0.1 5678 typ host' }],
    });
    webrtc.run(ctx);
    await flushPromises();
    created[0].fireCandidates();
    vi.advanceTimersByTime(7000);
    expect(ctx.markResult).toHaveBeenCalledWith('fail', expect.any(String));
  });

  it('marks fail when RTCPeerConnection construction throws', () => {
    window.RTCPeerConnection = vi.fn(() => {
      throw new Error('blocked');
    });
    webrtc.run(ctx);
    expect(ctx.markResult).toHaveBeenCalledWith('fail', expect.stringContaining('WebRTC error'));
  });
});
