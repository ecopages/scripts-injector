import { eco } from '@ecopages/core';
import { BaseLayout } from '@/layouts/base-layout/base-layout';
import { Footer } from '@/components/footer';
import { Button } from '@/components/button';

type InjectorTrigger = {
	'on:idle'?: boolean;
	'on:interaction'?: string;
	'on:visible'?: string | boolean;
};

const injectorAttrs = (scripts: string, trigger: InjectorTrigger, className?: string) => ({
	'attr:scripts': scripts,
	...(trigger['on:idle'] ? { 'attr:on:idle': true } : {}),
	...(trigger['on:interaction'] ? { 'attr:on:interaction': trigger['on:interaction'] } : {}),
	...(trigger['on:visible'] !== undefined ? { 'attr:on:visible': trigger['on:visible'] } : {}),
	...(className ? { class: className } : {}),
});

export default eco.page({
	dependencies: {
		stylesheets: ['./index.css'],
		components: [BaseLayout, Footer],
	},
	layout: BaseLayout,
	render: () => {
		return (
			<div class="showcase">
				<section class="showcase-hero">
					<p class="showcase-hero__subtitle">Scripts Injector</p>
					<h1 class="showcase-hero__title">
						Orchestrate scripts.
						<br />
						<scripts-injector {...injectorAttrs('/scripts/accelerate.script.js', { 'on:idle': true })}>
							<span class="accelerate-word text-accent">Accelerate your page.</span>
						</scripts-injector>
					</h1>
					<p class="showcase-hero__description">
						Take full control of your scripts with a declarative approach. Inject what you need, exactly
						when and where you need it.
					</p>
					<div class="showcase-hero__actions">
						<Button href="/docs" variant="default">
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 2 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
							Documentation
						</Button>
					</div>
				</section>

				<div id="examples" class="showcase-examples">
					<section class="showcase-section">
						<div class="showcase-info">
							<h2 class="section-title">Lazy Interaction (Click)</h2>
							<p class="section-desc">
								Delays loading of heavy logic until the user actually clicks. The click event is
								captured, the script loads, and then the click is replayed natively.
							</p>
							<span class="showcase-tag">on:interaction="click"</span>
						</div>
						<div class="showcase-demo">
							<div class="showcase-demo-surface">
								<div class="text-center">
									<scripts-injector
										{...injectorAttrs('/scripts/demo-click.js', { 'on:interaction': 'click' })}
									>
										<button id="demo-click-btn" class="button button--tonal">
											Click to Launch
										</button>
									</scripts-injector>
								</div>
							</div>
						</div>
					</section>

					<section class="showcase-section">
						<div class="showcase-info">
							<h2 class="section-title">Anticipation (Hover)</h2>
							<p class="section-desc">
								Preloads resources when a user hovers, ensuring instant availability without waiting for
								a click. Ideal for menus or tooltips.
							</p>
							<span class="showcase-tag">on:interaction="mouseenter"</span>
						</div>
						<div class="showcase-demo">
							<div class="showcase-demo-surface">
								<scripts-injector
									{...injectorAttrs(
										'/scripts/demo-hover.js',
										{ 'on:interaction': 'mouseenter' },
										'w-full max-w-md',
									)}
								>
									<div
										id="demo-hover-area"
										class="h-32 border border-dashed border-border bg-background flex items-center justify-center text-on-background/70 text-sm font-medium cursor-pointer hover:border-on-background/40 hover:text-on-background transition-colors"
									>
										Hover me to load
									</div>
								</scripts-injector>
							</div>
						</div>
					</section>

					<section class="showcase-section">
						<div class="showcase-info">
							<h2 class="section-title">Input Focus</h2>
							<p class="section-desc">
								Inject validation or input masks exactly when the user focuses on a field.
							</p>
							<span class="showcase-tag">on:interaction="focusin"</span>
						</div>
						<div class="showcase-demo">
							<div class="showcase-demo-surface">
								<scripts-injector
									{...injectorAttrs(
										'/scripts/demo-focus.js',
										{ 'on:interaction': 'focusin' },
										'w-full max-w-sm',
									)}
								>
									<form class="space-y-4" onsubmit="return false">
										<h3 class="font-heading font-semibold text-on-background mt-0">Search</h3>
										<input
											id="demo-focus-input"
											type="text"
											name="q"
											placeholder="you@example.com"
											class="input-field"
											required
										/>
										<div id="demo-focus-feedback"></div>
									</form>
								</scripts-injector>
							</div>
						</div>
					</section>

					<section class="showcase-section">
						<div class="showcase-info">
							<h2 class="section-title">Background (Idle)</h2>
							<p class="section-desc">
								Non-critical resources like analytics or logging can be loaded when the browser is idle,
								preventing main-thread blocking during initial load.
							</p>
							<span class="showcase-tag">on:idle</span>
						</div>
						<div class="showcase-demo">
							<div class="showcase-demo-surface">
								<scripts-injector {...injectorAttrs('/scripts/demo-idle.js', { 'on:idle': true })}>
									<div
										id="demo-idle-badge"
										class="px-4 py-1.5 border border-border bg-background text-muted-foreground text-sm font-medium transition-all duration-700 animate-pulse"
									>
										Waiting for Idle...
									</div>
								</scripts-injector>
							</div>
						</div>
					</section>

					<section class="showcase-section">
						<div class="showcase-info">
							<h2 class="section-title">Form Interception</h2>
							<p class="section-desc">
								Inject validation or submission logic exactly when the user attempts to submit a form.
							</p>
							<span class="showcase-tag">on:interaction="submit"</span>
						</div>
						<div class="showcase-demo">
							<div class="showcase-demo-surface">
								<scripts-injector
									{...injectorAttrs(
										'/scripts/demo-form.js',
										{ 'on:interaction': 'submit' },
										'w-full max-w-sm',
									)}
								>
									<form id="demo-form" class="space-y-4" onsubmit="return false">
										<h3 class="font-heading font-semibold text-on-background mt-0">Newsletter</h3>
										<input
											type="email"
											name="email"
											placeholder="you@example.com"
											class="input-field"
											required
										/>
										<button type="submit" class="button button--primary w-full justify-center">
											Subscribe
										</button>
										<div id="demo-form-feedback"></div>
									</form>
								</scripts-injector>
							</div>
						</div>
					</section>

					<section class="showcase-section">
						<div class="showcase-info">
							<h2 class="section-title">Dynamic Selection</h2>
							<p class="section-desc">Load dependent logic based on user choices from a dropdown menu.</p>
							<span class="showcase-tag">on:interaction="change"</span>
						</div>
						<div class="showcase-demo">
							<div class="showcase-demo-surface">
								<div class="w-full max-w-xs">
									<scripts-injector
										{...injectorAttrs(
											'/scripts/demo-select.js',
											{ 'on:interaction': 'change' },
											'w-full',
										)}
									>
										<select id="demo-select" class="select-field" aria-label="Demo Selection">
											<option value="">Select an option...</option>
											<option value="A">Feature A</option>
											<option value="B">Feature B</option>
											<option value="C">Feature C</option>
										</select>
									</scripts-injector>
									<div
										id="demo-select-feedback"
										class="mt-4 text-center h-4 font-semibold text-accent"
									></div>
								</div>
							</div>
						</div>
					</section>

					<section class="showcase-section">
						<div class="showcase-info">
							<h2 class="section-title">Nested Composition</h2>
							<p class="section-desc">
								Injectors can be nested within each other. Parent and child loading logic remains
								independent.
							</p>
							<span class="showcase-tag">Nested Components</span>
						</div>
						<div class="showcase-demo">
							<div class="showcase-demo-surface">
								<scripts-injector
									{...injectorAttrs(
										'/scripts/demo-nested-parent.js',
										{ 'on:interaction': 'mouseenter' },
										'contents',
									)}
								>
									<div
										id="demo-nested-parent"
										class="p-8 border border-dashed border-border relative bg-background transition-colors w-full"
									>
										<span class="absolute top-0 right-0 border-b border-l border-border bg-background-accent text-on-background/70 text-xs font-mono px-2 py-1 uppercase tracking-wider">
											Parent (Hover)
										</span>

										<div class="flex justify-center">
											<scripts-injector
												{...injectorAttrs('/scripts/demo-nested-child.js', {
													'on:interaction': 'click',
												})}
											>
												<button id="demo-nested-child" class="button button--tonal">
													Child Button (Click)
												</button>
											</scripts-injector>
										</div>
									</div>
								</scripts-injector>
							</div>
						</div>
					</section>

					<section class="showcase-section">
						<div class="showcase-info">
							<h2 class="section-title">Margin Visibility</h2>
							<p class="section-desc">
								Preload scripts <em>before</em> content enters the viewport to ensure zero CLS or delay
								when the user arrives.
							</p>
							<span class="showcase-tag">on:visible="200px"</span>
						</div>
						<div class="showcase-demo">
							<div class="showcase-demo-surface flex-col">
								<div class="text-sm text-muted-foreground mb-8 italic">
									Scroll container (simulated)
								</div>
								<div class="h-32"></div>
								<scripts-injector
									{...injectorAttrs(
										'/scripts/demo-margin.js',
										{ 'on:visible': '200px' },
										'w-full max-w-lg',
									)}
								>
									<div
										id="demo-margin-box"
										class="h-32 border border-border bg-background text-on-background text-sm font-medium flex items-center justify-center transition-colors w-full"
									>
										I load at 200px offset
									</div>
								</scripts-injector>
							</div>
						</div>
					</section>
				</div>

				<Footer />
			</div>
		);
	},
});
