import { describe, expect, it, vi } from 'vitest';
import worker, { type Env } from './index';

function stubEnv() {
  const assetFetch = vi.fn(
    async (_request: Request) =>
      new Response('<!doctype html><title>ok</title>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
  );
  const env = {
    ASSETS: { fetch: assetFetch },
    PRODUCTION_HOSTNAME: 'cloudcodetree.com',
  } as unknown as Env;
  return { env, assetFetch };
}

describe('pass-through worker', () => {
  it('returns the asset response unchanged', async () => {
    const { env } = stubEnv();
    const res = await worker.fetch(new Request('https://cloudcodetree.com/about/'), env);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('<title>ok</title>');
  });

  it('forwards the request to the assets binding verbatim', async () => {
    const { env, assetFetch } = stubEnv();
    const request = new Request('https://cloudcodetree.com/projects/span-calculator/demo/');
    await worker.fetch(request, env);
    expect(assetFetch).toHaveBeenCalledTimes(1);
    expect(assetFetch.mock.calls[0][0]).toBe(request);
  });
});
