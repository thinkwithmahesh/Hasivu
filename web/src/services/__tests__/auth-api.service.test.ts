import { AuthApiService } from '../auth-api.service';

const mockUser = {
  id: 'user-1',
  email: 'parent.demo@hasivu.local',
  firstName: 'Demo',
  lastName: 'Parent',
  role: 'parent' as const,
  permissions: ['order_food'],
  schoolId: 'school-1',
};

describe('AuthApiService', () => {
  let service: AuthApiService;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    service = new AuthApiService();
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  it('logs in through the cookie-backed auth endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { user: mockUser } }),
    });

    const result = await service.login({
      email: 'parent.demo@hasivu.local',
      password: 'Hasivu123!',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      })
    );
    expect(result).toEqual({ user: mockUser, tokens: undefined, success: true });
  });

  it('throws a readable error when login fails', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Invalid credentials' }),
    });

    await expect(
      service.login({ email: 'bad@example.com', password: 'wrong' })
    ).rejects.toThrow('Invalid credentials');
  });

  it('refreshes tokens once when calls are concurrent', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { tokens: { accessToken: 'new-access', refreshToken: 'new-refresh' } } }),
    });

    const [first, second] = await Promise.all([service.refreshToken(), service.refreshToken()]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first.accessToken).toBe('new-access');
    expect(second.refreshToken).toBe('new-refresh');
  });

  it('returns the current user and retries after refresh on 401', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 401 })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tokens: { accessToken: 'refreshed', refreshToken: 'refresh' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { user: mockUser } }),
      });

    const user = await service.getCurrentUser();

    expect(user.email).toBe('parent.demo@hasivu.local');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not expose browser-readable auth tokens', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.getAccessToken()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();

    service.setTokens({ accessToken: 'access', refreshToken: 'refresh' });

    expect(localStorage.setItem).not.toHaveBeenCalledWith(
      expect.stringMatching(/token/i),
      expect.any(String)
    );
  });

  it('clears only non-token user cache on logout and clearTokens', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });

    await service.logout();
    service.clearTokens();

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/logout',
      expect.objectContaining({ method: 'POST', credentials: 'include' })
    );
    expect(localStorage.removeItem).toHaveBeenCalledWith('user');
  });

  it('stores and reads user profile cache without token storage', () => {
    (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockUser));

    expect(service.getStoredUser()?.email).toBe(mockUser.email);
    service.setStoredUser(mockUser);

    expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
  });
});
