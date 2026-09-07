import { SessionManager } from '../src/services/sessionManager';
import { SessionState } from '../src/models/session';

describe('SessionManager', () => {
  let sessionManager: SessionManager;

  beforeEach(() => {
    sessionManager = new SessionManager(1); // 1 minute timeout for testing
  });

  test('creates new session with GREETING state', () => {
    const session = sessionManager.getSession('+15550001111');
    expect(session.userId).toBe('+15550001111');
    expect(session.state).toBe(SessionState.GREETING);
  });

  test('updates session state and metadata', () => {
    sessionManager.updateSession('+15550001111', SessionState.SEARCH_RESULTS, {
      lastCategory: 'Home Repairs & Maintenance',
    });

    const session = sessionManager.getSession('+15550001111');
    expect(session.state).toBe(SessionState.SEARCH_RESULTS);
    expect(session.lastCategory).toBe('Home Repairs & Maintenance');
  });

  test('resets session to GREETING after timeout', () => {
    sessionManager.updateSession('+15550001111', SessionState.SEARCH_RESULTS);
    
    // Simulate time passing (2 minutes)
    const session = sessionManager.getSession('+15550001111');
    session.updatedAt = new Date(Date.now() - 2 * 60 * 1000);

    const reFetched = sessionManager.getSession('+15550001111');
    expect(reFetched.state).toBe(SessionState.GREETING);
  });
});
