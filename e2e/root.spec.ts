import { test, expect } from '@playwright/test';

test.describe('Home Page Script Injection', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('Scenario 1: Click Replay works', async ({ page }) => {
        const btn = page.locator('#demo-click-btn');
        const script = page.locator('script[src="/scripts/demo-click.js"]');
        
        await expect(script).not.toBeAttached();

        await btn.click();

        await expect(script).toBeAttached();

        await expect(btn).toHaveAttribute('data-script-loaded', 'true');
        await expect(btn).toContainText('Launched!');

        const hoverScript = page.locator('script[src="/scripts/demo-hover.js"]');
        await expect(hoverScript).not.toBeAttached();
    });

    test('Scenario 2: Hover Load (mouseenter)', async ({ page }) => {
        const area = page.locator('#demo-hover-area');
        const script = page.locator('script[src="/scripts/demo-hover.js"]');

        await expect(script).not.toBeAttached();

        await area.hover();

        await expect(script).toBeAttached();
        const container = page.locator('scripts-injector >> #demo-hover-area');
        await expect(container).toHaveAttribute('data-script-loaded', 'true');
        await expect(container).toContainText('Activated');
    });

    test('Scenario 3: Focus Load (focusin)', async ({ page }) => {
        const input = page.locator('#demo-focus-input');
        const script = page.locator('script[src="/scripts/demo-focus.js"]');

        await expect(script).not.toBeAttached();

        await input.focus();

        await expect(script).toBeAttached();
        await expect(input).toHaveAttribute('data-script-loaded', 'true');
    });

    test('Scenario 4: Idle Load', async ({ page }) => {
        const badge = page.locator('#demo-idle-badge');
        await expect(badge).toHaveAttribute('data-script-loaded', 'true', { timeout: 10000 });
        await expect(badge).toContainText('Idle Resource Loaded');
    });

    test('Scenario 5: Form Submission', async ({ page }) => {
        const form = page.locator('#demo-form');
        const script = page.locator('script[src="/scripts/demo-form.js"]');
        const feedback = page.locator('#demo-form-feedback');

        await expect(script).not.toBeAttached();

        await page.locator('#demo-form input').fill('test@example.com');
        await page.locator('#demo-form button[type="submit"]').click();

        await expect(script).toBeAttached();
        await expect(form).toHaveAttribute('data-script-loaded', 'true');
        await expect(feedback).toContainText('Form validated and submitted');
    });

    test('Scenario 6: Select Change', async ({ page }) => {
        const select = page.locator('#demo-select');
        const script = page.locator('script[src="/scripts/demo-select.js"]');
        const feedback = page.locator('#demo-select-feedback');

        await expect(script).not.toBeAttached();

        await select.selectOption('B');

        await expect(script).toBeAttached();
        await expect(select).toHaveAttribute('data-script-loaded', 'true');
        await expect(feedback).toContainText('Selection changed to: B');
    });

    test('Scenario 7: Nested Interactions', async ({ page }) => {
        const parent = page.locator('#demo-nested-parent');
        const child = page.locator('#demo-nested-child');

        await parent.hover();
        await expect(page.locator('script[src="/scripts/demo-nested-parent.js"]')).toBeAttached();
        await expect(page.locator('script[src="/scripts/demo-nested-child.js"]')).not.toBeAttached();

        await child.click();
        await expect(page.locator('script[src="/scripts/demo-nested-child.js"]')).toBeAttached();
        await expect(child).toContainText('Child Active!');
    });

    test('Scenario 8: Margin Visibility', async ({ page }) => {
        const box = page.locator('#demo-margin-box');
        const script = page.locator('script[src="/scripts/demo-margin.js"]');
        
        await expect(script).not.toBeAttached();
        
        await box.scrollIntoViewIfNeeded();

        await expect(script).toBeAttached();
        await expect(box).toHaveAttribute('data-script-loaded', 'true');
        await expect(box).toContainText('Loaded early!');
    });
});
