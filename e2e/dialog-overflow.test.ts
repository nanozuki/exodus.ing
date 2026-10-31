import { test, expect } from './support/fixtures';

test('Username dialog fits its content while opening and typing', async ({ actor }) => {
  const page = await actor('carol');
  await page.goto('/console/account');
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 375, height: 812 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.getByRole('button', { name: '编辑', exact: true }).click();
    const modal = page.getByRole('dialog', { name: '修改用户名' });
    const measure = (frames: number) =>
      modal.evaluate(async (element, count) => {
        const samples = [];
        for (let frame = 0; frame < count; frame += 1) {
          samples.push({
            width: element.clientWidth,
            scrollWidth: element.scrollWidth,
            height: element.clientHeight,
            scrollHeight: element.scrollHeight,
          });
          await new Promise(requestAnimationFrame);
        }
        return samples;
      }, frames);
    const opening = await measure(15);
    const input = page.locator('input[name^="username/"]');
    const [focusChanges] = await Promise.all([
      measure(45),
      (async () => {
        for (let change = 0; change < 3; change += 1) {
          await input.press('Tab');
          await page.getByRole('button', { name: '取消', exact: true }).press('Shift+Tab');
        }
      })(),
    ]);
    const [typing] = await Promise.all([
      measure(45),
      page.locator('input[name^="username/"]').pressSequentially('typing-check', { delay: 40 }),
    ]);
    for (const sample of [...opening, ...focusChanges, ...typing]) {
      expect(sample.scrollWidth, `Horizontal overflow at ${viewport.width}px`).toBeLessThanOrEqual(sample.width);
      expect(sample.scrollHeight, `Vertical overflow at ${viewport.width}px`).toBeLessThanOrEqual(sample.height);
    }
    await page.getByRole('button', { name: '取消', exact: true }).click();
  }
});

test('Autofill controls stay aligned inside the username dialog', async ({ actor }) => {
  const page = await actor('carol');
  await page.goto('/console/account');
  await page.getByRole('button', { name: '编辑', exact: true }).click();
  const placement = await page.getByRole('dialog', { name: '修改用户名' }).evaluate((element) => {
    const input = element.querySelector('input')!;
    const anchor = input.getBoundingClientRect();
    const target = { x: anchor.right - 24, y: anchor.top + 4 };
    // Password managers inject viewport-positioned controls into modal dialogs.
    const control = document.createElement('div');
    control.style.cssText = `position: fixed; left: ${target.x}px; top: ${target.y}px; width: 16px; height: 16px;`;
    element.append(control);
    try {
      const actual = control.getBoundingClientRect();
      return {
        target,
        actual: { x: actual.x, y: actual.y },
        width: element.clientWidth,
        scrollWidth: element.scrollWidth,
        height: element.clientHeight,
        scrollHeight: element.scrollHeight,
      };
    } finally {
      control.remove();
    }
  });
  expect(Math.abs(placement.actual.x - placement.target.x)).toBeLessThan(1);
  expect(Math.abs(placement.actual.y - placement.target.y)).toBeLessThan(1);
  expect(placement.scrollWidth).toBeLessThanOrEqual(placement.width);
  expect(placement.scrollHeight).toBeLessThanOrEqual(placement.height);
});
