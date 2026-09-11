import { describe, expect, it } from 'vitest';
import { imageUpdate, validJpeg } from './upload-prepared-images.mjs';
import { PLACEHOLDER } from './lib/r2.mjs';
const post = { id: 'post-1', image: PLACEHOLDER, imageSource: 'https://example.com/article' };
const entry = { id: post.id, imageSource: post.imageSource };
describe('prepared image trust boundary', () => {
  it('accepts an existing post and constructs the destination itself', () => {
    expect(imageUpdate({ ...entry, image: 'https://attacker.invalid/a' }, post)).toEqual({ image: 'https://img.cloudcodetree.com/post-1.jpg' });
  });
  it('rejects traversal, missing posts, changed source and unsafe attribution', () => {
    expect(imageUpdate({ ...entry, id: '../post-1' }, post)).toBeNull();
    expect(imageUpdate(entry, undefined)).toBeNull();
    expect(imageUpdate({ ...entry, imageSource: 'different' }, post)).toBeNull();
    expect(imageUpdate({ ...entry, imageCredit: 'Name', imageCreditUrl: 'javascript:alert(1)' }, post)).toBeNull();
  });
  it('does not decode prepared bytes and rejects non-JPEG data', () => {
    expect(validJpeg(Buffer.from([255, 216, 255, 0]))).toBe(true);
    expect(validJpeg(Buffer.from('<script>hello</script>'))).toBe(false);
  });
});
